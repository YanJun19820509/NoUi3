
import { no } from '../../no';
import { ccclass, property, Toggle, Sprite } from '../../yj';

/**
 * Predefined variables
 * Name = YJToggle
 * DateTime = Mon Jul 18 2022 16:59:22 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJToggle.ts
 * FileBasenameNoExtension = YJToggle
 * URL = db://assets/NoUi3/widget/toggle/YJToggle.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJToggle')
/**
 * 增强型开关组件，扩展原生Toggle功能
 * 功能特性：
 * - 支持显示未选中状态专属图标
 * - 继承原生Toggle所有功能
 * - 提供更直观的状态切换效果
 * @example
 * // 编辑器配置示例：
 * // 1. 将Sprite节点拖拽到uncheckMark属性框作为未选中图标
 * // 2. 配置checkMark属性为选中状态图标
 * // 3. 添加点击事件处理程序
 */
export class YJToggle extends Toggle {
    @property({
        type: Sprite,
        tooltip: '未选中状态下显示的图标（建议使用与checkMark不同的视觉元素）\n示例：灰色边框图标/禁用状态标识'
    })
    uncheckMark: Sprite = null;

    /**
     * 重写状态切换效果实现
     * @description 功能实现：
     * 1. 调用父类原有动画效果（如缩放/颜色变化）
     * 2. 同步更新未选中状态图标的可见性
     * 3. 使用no.visible优化节点显隐控制（代替直接设置active）
     * @example
     * // 当isChecked变为true时：
     * // 1. 播放checkMark的选中动画
     * // 2. 隐藏uncheckMark节点
     * // 3. 触发toggle事件回调
     */
    public playEffect(): void {
        // 先执行父类的默认效果（如checkMark的显隐/动画）
        super.playEffect();
        
        // 控制未选中状态图标的显隐（使用no.visible优化性能）
        if (this.uncheckMark) {
            // 当开关处于选中状态时隐藏未选中图标，反之显示
            // 使用no.visible代替直接设置active以保持节点缩放等状态
            no.visible(this.uncheckMark.node, !this.isChecked);
        }
    }
}
