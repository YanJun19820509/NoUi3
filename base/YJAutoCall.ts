
import { ccclass, property, menu, Component, Node } from '../yj';
import { no } from '../no';

/**
 * Predefined variables
 * Name = YJAutoCall
 * DateTime = Fri Jan 14 2022 17:51:46 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJAutoCall.ts
 * FileBasenameNoExtension = YJAutoCall
 * URL = db://assets/Script/common/base/YJAutoCall.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJAutoCall')
@menu('NoUi/base/YJAutoCall(自动执行)')
/**
 * 自动执行组件
 * @description 用于在特定时机自动执行预设的回调方法
 * @example
 * // 在编辑器中使用时：
 * // 1. 将组件挂载到节点
 * // 2. 配置回调事件列表（calls）
 * // 3. 设置触发条件（加载时/激活时）
 * 
 * @example
 * // 激活时立即执行：
 * // - 勾选 callOnEnable
 * // - delay 设置为 0
 * 
 * @example
 * // 加载时延迟1秒执行（仅一次）：
 * // - 勾选 callOnLoad 和 once
 * // - delay 设置为 1000
 */
export class YJAutoCall extends Component {
    /** 执行延时（单位：毫秒，实际会转换为秒数调度） */
    @property({ displayName: '延时(ms)', min: 0, step: 1 })
    delay: number = 0;

    /** 要执行的事件处理器列表（支持多组件/方法回调） */
    @property(no.EventHandlerInfo)
    calls: no.EventHandlerInfo[] = [];

    /** 是否在节点加载完成后自动执行（onLoad生命周期） */
    @property({ displayName: '加载时执行' })
    callOnLoad: boolean = false;

    /** 是否在组件激活时自动执行（onEnable生命周期） */
    @property({ displayName: '激活时执行' })
    callOnEnable: boolean = false;

    /** 是否只允许执行一次（后续调用将被忽略） */
    @property({ displayName: '仅执行一次' })
    once: boolean = false;

    /** 执行状态标记（配合once属性使用） */
    private _done = false;

    /** 
     * 节点加载完成回调 
     * @desc 当配置callOnLoad且未开启callOnEnable时触发
     * 避免同时开启两个自动执行配置时重复触发
     */
    onLoad() {
        this.callOnLoad && !this.callOnEnable && this.a_call();
    }

    /** 
     * 组件激活回调
     * @desc 当配置callOnEnable时立即触发
     * 注意：组件被反复激活/禁用时会重复触发
     */
    onEnable() {
        this.callOnEnable && this.a_call();
    }

    /**
     * 执行预设回调
     * @description 
     * - 取消所有已安排的执行保证最新调用有效性
     * - 根据once属性控制单次执行逻辑
     * @example
     * // 动态调用示例：
     * autoCallComp.a_call();
     * // 延迟2秒执行：
     * autoCallComp.delay = 2000;
     * autoCallComp.a_call();
     */
    public a_call() {
        if (this.once && this._done) return;
        this.unscheduleAllCallbacks();
        this._done = true;
        this.scheduleOnce(() => {
            no.EventHandlerInfo.execute(this.calls);
        }, this.delay / 1000);
    }

    /**
     * 停止所有预定回调
     * @example
     * // 停止正在等待执行的回调：
     * autoCallComp.a_stop();
     */
    public a_stop() {
        this.unscheduleAllCallbacks();
    }
}
