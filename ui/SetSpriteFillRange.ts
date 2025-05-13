import { ccclass, property, requireComponent, Sprite, tween } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetSpriteFillRange
 * DateTime = Mon Jun 27 2022 11:46:16 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpriteFillRange.ts
 * FileBasenameNoExtension = SetSpriteFillRange
 * URL = db://assets/common/ui/SetSpriteFillRange.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetSpriteFillRange')
@requireComponent(Sprite)
/**
 * Sprite填充范围控制组件
 * 功能说明：
 * - 通过缓动动画控制Sprite的fillRange属性
 * - 支持设置过渡时间（duration）
 * - 自动处理数值范围限制和缓动中断
 * 
 * @使用示例：
 * // 立即设置填充到50%
 * this.a_setData(0.5);
 * // 用2秒时间过渡到80%填充
 * this.duration = 2;
 * this.a_setData(0.8);
 * // 通过字符串参数设置（会自动转换）
 * this.a_setData("0.3");
 */
export class SetSpriteFillRange extends HackUi {
    /**
     * 缓动过渡时间（单位：秒）
     * @规则：
     * - 0表示立即变化
     * - 大于0时执行线性缓动
     * @示例 this.duration = 1.5 // 1.5秒过渡动画
     */
    @property({
        tooltip: "缓动时间(秒)",
        min: 0 // 最小值限制保证不出现负数
    })
    private duration: number = 0;

    // 缓动系统引用（用于中断正在进行的动画）
    private currentTween: any = null;
    // 缓存的Sprite组件引用（优化性能）
    private sprite: Sprite = null;

    /**
     * 组件加载回调
     * @功能：
     * - 缓存Sprite组件引用避免重复获取
     * - 继承父类onLoad逻辑
     */
    public onLoad() {
        super.onLoad && super.onLoad();
        this.sprite = this.getComponent(Sprite);
    }

    /**
     * 数据驱动更新方法
     * @param data 目标填充值，支持类型：
     * - number: 0-1之间的数值
     * - string: 可转换为数值的字符串
     * @规则：
     * - 自动转换非法值为有效范围（0-1）
     * - 非数值数据会被忽略
     * @示例 
     * this.onDataChange(0.7)   // 正常数值
     * this.onDataChange("1.2") // 会被修正为1
     * this.onDataChange("abc") // 会被忽略
     */
    protected onDataChange(data: any) {
        if (!this.sprite) return;
        
        // 数据有效性检查（过滤非数值类型）
        if (isNaN(data)) return;
        
        // 数值范围限制（保证在0-1之间）
        const targetValue = Math.max(0, Math.min(Number(data), 1));

        // 中断正在进行的缓动动画
        if (this.currentTween) {
            this.currentTween.stop();
        }

        // 创建线性缓动动画
        this.currentTween = tween(this.sprite)
            .to(this.duration, { fillRange: targetValue }, {
                easing: 'linear' // 使用线性插值保证均匀变化
            })
            .start();
    }

    /**
     * 组件销毁回调
     * @功能：
     * - 停止所有进行中的缓动动画
     * - 释放资源引用
     * - 继承父类onDestroy逻辑
     */
    protected onDestroy() {
        super.onDestroy && super.onDestroy();
        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = null; // 清除引用帮助GC
        }
    }
}
