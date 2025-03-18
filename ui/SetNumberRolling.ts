import { Label, RichText, ccclass, isValid, property } from '../../NoUi3/yj';
import { no } from '../no';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';
import { HackUi } from './HackUi';

/**
 * 数字滚动效果
 * Author mqsy_yj
 * DateTime Tue Oct 10 2023 14:54:12 GMT+0800 (中国标准时间)
 * data:{from:number,to:number, format:string}
 */

@ccclass('SetNumberRolling')
/**
 * 数字滚动效果组件
 * 使用说明：
 * 1. 需要挂载在包含Label/RichText/YJCharLabel组件的节点上
 * 2. 通过data参数触发滚动效果，data格式：{from: 起始数值, to: 目标数值, format?: 格式字符串}
 * 3. 支持自定义数值格式、滚动持续时间和滚动次数
 * 
 * 示例：
 * // 从100滚动到500，保留两位小数，带货币符号格式
 * this.node.emit('data', {from: 100, to: 500, format: '￥{0}'});
 */
export class SetNumberRolling extends HackUi {
    @property({ displayName: '时长s', min: 0, tooltip: '动画总持续时间（秒）' })
    duration: number = 1;
    
    @property({ displayName: '滚动次数', min: 0, tooltip: '数值变化的次数（0表示持续变化）' })
    num: number = 1;
    
    @property({ displayName: '保留小数位', min: 0, step: 1, tooltip: '数值显示的小数位精度' })
    decimal: number = 0;
    
    @property({ displayName: '格式化模板', tooltip: '使用{0}作为数值占位符\n示例：\'Score: {0}\'' })
    formatter: string = '{0}';
    
    @property({ type: no.EventHandlerInfo, tooltip: '动画结束时的回调事件' })
    onEnd: no.EventHandlerInfo[] = [];

    // 显示组件缓存
    protected label: Label | RichText | YJCharLabel;

    /**
     * 数据更新处理方法
     * @param data 包含起始值、目标值和可选格式参数
     * 示例数据：{from: 100, to: 500, format: '￥{0}'}
     */
    protected onDataChange(data: any) {
        if (data.format) this.formatter = data.format;
        this.rolling(data);
    }

    /**
     * 执行滚动动画
     * @param data 数值参数
     * 实现原理：
     * 1. 计算每次变化的增量值
     * 2. 使用定时器分步更新显示数值
     * 3. 动画结束后修正最终值
     */
    private rolling(data: any) {
        const from = data.from;
        const to = data.to;
        // 计算每次增量（保留指定位数的小数）
        const add = no.float((to - from) / this.num, this.decimal);
        
        // 初始化显示
        this.setLabel(from);
        if (from == to) return;

        let currentValue = from;
        // 使用定时器分步更新数值
        no.schedule(
            () => {
                currentValue += add;
                this.setLabel(no.floor(currentValue));
            },
            this.duration / this.num, // 每次更新的间隔时间
            this.num,                 // 总执行次数
            0,                        // 初始延迟
            this,
            () => { // 完成回调
                this.setLabel(to);
                no.EventHandlerInfo.execute(this.onEnd);
            }
        );
    }

    /**
     * 更新显示组件内容
     * @param v 当前数值
     * 实现特性：
     * - 自动获取节点上的文本组件
     * - 支持动态格式化显示
     * - 组件有效性检查
     */
    private setLabel(v: number) {
        if (!isValid(this.node)) return;
        
        // 延迟获取文本组件
        if (!this.label) {
            this.label = this.node.getComponent(Label) || 
                        this.node.getComponent(RichText) || 
                        this.node.getComponent(YJCharLabel);
        }
        
        // 格式化显示数值（示例：当formatter为'Rank:{0}'时显示'Rank:100'）
        this.label.string = no.formatString(this.formatter, { '0': v.toFixed(this.decimal) });
    }

    /** 预留空方法（根据需求实现） */
    // public a_setEmpty(): void {
    // }
}
