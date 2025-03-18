
import { ProgressBar, ccclass, property, menu, Label } from '../yj';
import { HackUi } from './HackUi';
import { no } from '../no';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';

/**
 * Predefined variables
 * Name = SetProgress
 * DateTime = Mon Jan 17 2022 12:12:56 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetProgress.ts
 * FileBasenameNoExtension = SetProgress
 * URL = db://assets/Script/NoUi3/ui/SetProgress.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
//data number|[cur, max]
@ccclass('SetProgress')
@menu('NoUi/ui/SetProgress(设置进度条:number)')
/**
 * 进度条组件   
 * 功能说明：
 * - 支持数字、数组、对象等多种数据格式
 * - 自动处理数据格式转换和动画控制
 * - 兼容普通文本和字符动画文本两种显示方式
 * 
 * 使用示例：
 * // 设置进度为50%
 * this.a_setData(0.5);
 * // 设置进度为3/10
 * this.a_setData([3, 10]);
 * // 设置进度为70%
 * this.a_setData({cur:7, max:10});
 */

export class SetProgress extends HackUi {
    // 进度条组件引用
    @property(ProgressBar)
    progressBar: ProgressBar = null;
    // 缓动速度配置（单位：毫秒/完整进度）
    @property({ displayName: '缓动速度', step: 50, min: 0, tooltip: '从0到1所需要毫秒时间' })
    motionSpeed: number = 500;
    // 初始最小进度值（0-1范围）
    @property({ displayName: '小最进度', min: 0, max: 1, step: 0.1 })
    initValue: number = 0;
    // 普通文本标签组件
    @property({ type: Label })
    label: Label = null;
    // 字符动画标签组件
    @property({ type: YJCharLabel })
    charLabel: YJCharLabel = null;

    // 以下为私有属性
    private speed: number;      // 实际计算用的速度值
    private dir: number;        // 进度变化方向（1: 增加，-1: 减少）
    private targetValue: number = -1; // 目标进度值（-1表示未设置）
    private isFirst: boolean = true;  // 是否是第一次设置
    private lastValue: number = 0;    // 上次设置的进度值

    // 组件禁用时重置状态
    onDisable() {
        this.isFirst = true;
        if (this.targetValue >= 0) {
            this.progressBar.progress = this.targetValue;
        }
    }

    /**
     * 数据更新处理方法
     * @param data 支持多种格式：
     * - number: 直接进度值（0-1）
     * - Array: [当前值, 最大值] 如[50, 100]
     * - Object: 包含cur和max属性的对象 如{cur:30, max:100}
     * - 其他对象: 自动提取数字属性值转为数组
     * 示例：
     * updateProgress(0.5)          // 直接设置50%进度
     * updateProgress([3, 10])      // 设置30%进度
     * updateProgress({cur:7, max:10}) // 设置70%进度
     */
    protected onDataChange(data: any) {
        if (!this.speed)
            this.speed = 1000 / this.motionSpeed; // 转换为每秒进度变化量
        
        // 处理对象类型数据（非数组）
        if (data instanceof Object && !(data instanceof Array)) {
            const keys = Object.keys(data);
            let a: number[] = [];
            // 遍历对象属性值（兼容非数组对象）
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                a[a.length] = data[key];
            }
            data = a;
        }

        this.setLabel(data); // 更新文本显示

        // 转换不同数据格式为进度值
        if (data instanceof Array) {
            data = Math.min(data[0], data[1]) / data[1]; // 计算百分比
        } else if (data instanceof Object) {
            data = data.cur / data.max; // 兼容旧版对象格式
        }

        // 处理初始最小进度限制
        if (data > 0 && data < this.initValue)
            data = this.initValue;

        this.targetValue = data;
        
        // 直接设置进度的情况（首次/无动画/逆向变化）
        if (this.motionSpeed == 0 || this.isFirst || data <= this.lastValue) {
            this.progressBar.progress = data;
            this.isFirst = false;
        } else {
            // 计算动画方向
            this.dir = data > this.progressBar.progress ? 1 : -1;
        }
        this.lastValue = data;
    }

    // 每帧更新进度动画
    lateUpdate(dt: number) {
        if (this.targetValue == this.progressBar.progress) return;
        
        if (this.targetValue >= 0) {
            let p = this.progressBar.progress + this.speed * this.dir * dt;
            
            // 到达目标值时精确设置
            if ((this.dir > 0 && p >= this.targetValue) || 
                (this.dir < 0 && p <= this.targetValue)) {
                p = this.targetValue;
            }
            
            this.progressBar.progress = p;
        }
    }

    // 更新进度文本显示
    private setLabel(data: any) {
        if (!this.label && !this.charLabel) return;
        
        let s: string = '';
        if (typeof data == 'number') {
            // 格式化为百分比（保留1位小数）
            s = Math.floor(data * 1000) / 10 + '%';
        } else if (data instanceof Array) {
            // 显示分数格式 如"3/10"
            s = `${data[0]}/${data[1]}`;
        }
        
        // 更新对应类型的标签组件
        if (this.label) {
            this.label.string = s;
        } else if (this.charLabel) {
            this.charLabel.string = s;
        }
    }
}
