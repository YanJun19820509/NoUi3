
import { ccclass, property, menu, Label, isValid, ProgressBar } from '../yj';
import { YJTimeFormatDecorator } from '../base/YJTimeFormatDecorator';
import { no } from '../no';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetTimeCountDown
 * DateTime = Mon Jan 17 2022 14:39:39 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetTimeCountDown.ts
 * FileBasenameNoExtension = SetTimeCountDown
 * URL = db://assets/Script/common/ui/SetTimeCountDown.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetTimeCountDown')
@menu('NoUi/ui/SetTimeCountDown(设置倒计时:number)')
/**
 * 设置倒计时
 * data: 时间段 秒
 */
export class SetTimeCountDown extends HackUi {
    /**
     * 是否显示文本倒计时
     * @规则：
     * - true时显示label/charLabel组件
     * - false时显示进度组件
     * @示例 
     * this.isLabel = true // 显示文本倒计时
     */
    @property({ displayName: '显示倒计时' })
    isLabel: boolean = true;

    @property({ type: Label, visible() { return this.isLabel; } })
    label: Label = null;

    @property({ type: YJCharLabel, visible() { return this.isLabel; } })
    charLabel: YJCharLabel = null;

    @property({ type: ProgressBar, visible() { return !this.isLabel; } })
    progressBar: ProgressBar = null;

    /**
     * 时间格式化模板字符串
     * @规则：
     * - 使用{h}、{m}、{s}占位符
     * - 支持自定义分隔符
     * @示例 
     * '剩余时间:{h}时{m}分{s}秒' // 显示为"剩余时间:01时23分45秒"
     */
    @property({ displayName: '格式化模板', visible() { return this.isLabel; } })
    formatter: string = '{h}:{m}:{s}';

    /**
     * 是否用零补位显示时间
     * @示例 
     * show0 = true 时显示"01:02:03"
     * show0 = false 时显示"1:2:3"
     */
    @property({ displayName: '用0补位', visible() { return this.isLabel; } })
    show0: boolean = true;

    /**
     * 自定义时间格式装饰器
     * @功能说明：
     * - 当需要复杂时间格式时使用
     * - 优先级高于formatter模板
     * @示例 
     * decorator.format(3600) 返回"1小时"
     */
    @property({ type: YJTimeFormatDecorator, displayName: '格式化装饰器', visible() { return this.isLabel; } })
    decorator: YJTimeFormatDecorator = null;

    /**
     * 关联的进度组件集合
     * @规则：
     * - 倒计时时间会转换为百分比传递给这些组件
     * - 需要实现HackUi接口的组件
     * @示例 
     * this.hackUiComponents = [progressBarComponent] // 将百分比传递给进度条
     */
    @property({ type: HackUi, tooltip: '将倒计时转换成百分比，传给对应组件' })
    hackUiComponents: HackUi[] = [];

    /**
     * 百分比计算方向
     * @规则：
     * - true: 从0到1递减（默认）
     * - false: 从1到0递增
     * @示例 
     * is0_1 = true 时，剩余50%时间显示0.5
     */
    @property({ displayName: '由0到1', visible() { return !this.isLabel; } })
    is0_1: boolean = true;

    /**
     * 每秒触发的事件回调
     * @示例 
     * 添加声音组件播放滴答声
     */
    @property({ type: no.EventHandlerInfo, displayName: '每秒回调' })
    secondCalls: no.EventHandlerInfo[] = [];

    /**
     * 倒计时结束事件回调
     * @示例 
     * 结束显示特效或跳转场景
     */
    @property({ type: no.EventHandlerInfo, displayName: '结束回调' })
    endCalls: no.EventHandlerInfo[] = [];

    /**
     * 是否启用定时触发功能
     * @规则：
     * - 需要配合time属性使用
     * @示例 
     * 设置60秒时触发特殊事件
     */
    @property({ displayName: '定时触发' })
    isTime: boolean = false;

    @property({ min: 0, step: 1, displayName: '定时触发时间', visible() { return this.isTime; } })
    time: number = 60;

    @property({ type: no.EventHandlerInfo, displayName: '定时回调', visible() { return this.isTime; } })
    timeCalls: no.EventHandlerInfo[] = [];

    // 倒计时总时长（秒）
    protected _max: number;
    // 目标截止时间戳（秒）
    protected _deadline: number;
    private _pauseTime: number = 0;


    onDisable() {
        // 组件禁用时取消时间监听
        no.sysTime.offTickTock(this);
    }

    /**
     * 数据驱动更新方法
     * @param data 支持的参数类型：
     * - number: 总秒数（如3600）
     * - string: 数字字符串（如"3600"）或直接显示文本
     * - array: [剩余秒数, 总秒数]（如[1800, 3600]）
     * - 'stop': 停止倒计时
     * - 'pause': 暂停倒计时
     * - 'resume': 恢复倒计时
     * @示例 
     * this.a_setData(60)       // 60秒倒计时
     * this.a_setData("hello")  // 直接显示"hello"文本
     * this.a_setData([30, 60]) // 显示30秒倒计时（总时长60秒）
     * this.a_setData('stop')   // 停止倒计时
     * this.a_setData('pause')   // 暂停倒计时
     * this.a_setData('resume')   // 恢复倒计时
     */
    protected onDataChange(data: any) {
        no.sysTime.offTickTock(this);

        if (data == 'pause') {
            this._pauseTime = no.sysTime.now;
            return;
        }
        if (data == 'resume') {
            if (this._pauseTime > 0) {
                const a = no.sysTime.now - this._pauseTime;
                this._deadline += a;
                this._pauseTime = 0;
            }
            no.sysTime.onTickTock(this);
            return;
        }
        if (data == 'stop') {
            data = 0;
        }
        this._pauseTime = 0;

        // 处理直接显示文本的情况
        if (typeof data == 'string' && isNaN(Number(data))) {
            this.setLabel(data);
            return;
        }

        const now = no.sysTime.now;

        // 处理数组参数格式[剩余时间, 总时间]
        if (data instanceof Array) {
            const remaining = Number(data[0]);
            if (remaining <= 0) {
                this.setLabel('');
                return;
            }
            this._deadline = remaining + now;
            this._max = Number(data[1]);
        }
        // 处理数字参数格式
        else {
            const totalSeconds = Number(data);
            if (totalSeconds <= 0) {
                this.setLabel('');
                return;
            }
            this._deadline = totalSeconds + now;
            this._max = totalSeconds;
        }

        this.doTickTock(now);
        no.sysTime.onTickTock(this);
    }

    /**
     * 执行倒计时更新
     * @param now 当前时间戳（秒）
     * @实现逻辑：
     * 1. 计算剩余时间
     * 2. 触发时间相关回调
     * 3. 更新显示内容
     * 4. 计算并传递百分比
     */
    public doTickTock(now: number) {
        if (!isValid(this.node, true)) return;

        const remaining = this._deadline - now;

        // 更新进度百分比
        this.setPercent(remaining);

        // 倒计时结束处理
        if (remaining < 0) {
            no.sysTime.offTickTock(this);
            no.EventHandlerInfo.execute(this.endCalls);
            return;
        }
        // 倒计时进行中处理
        else {
            no.EventHandlerInfo.execute(this.secondCalls);

            // 触发定时回调
            if (this.isTime && remaining === this.time) {
                no.EventHandlerInfo.execute(this.timeCalls);
            }
        }

        // 更新文本显示
        if (this.isLabel) {
            const formatted = this.decorator
                ? this.decorator.format(remaining)
                : no.sec2time(remaining, this.formatter, this.show0);
            this.setLabel(formatted);
        }
    }

    /**
     * 设置显示文本内容
     * @param str 要显示的字符串
     * @规则：
     * - 优先使用label组件
     * - 无label时使用charLabel组件
     */
    protected setLabel(str: string): void {
        if (this.label) {
            this.label.string = str || '';
        } else if (this.charLabel) {
            this.charLabel.string = str || '';
        }
    }

    /**
     * 计算并传递百分比
     * @param v 剩余时间（秒）
     * @实现逻辑：
     * 1. 计算当前进度百分比
     * 2. 根据is0_1调整百分比方向
     * 3. 传递给所有关联组件
     */
    protected setPercent(v: number) {
        let percent = v / this._max;
        if (this.is0_1) percent = 1 - percent;

        // 遍历所有关联组件传递百分比
        for (let i = 0; i < this.hackUiComponents.length; i++) {
            this.hackUiComponents[i].a_setData(String(percent));
        }
        if (this.progressBar) {
            this.progressBar.progress = percent;
        }
    }
}
