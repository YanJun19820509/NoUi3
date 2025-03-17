import { no } from "../../no";
import { ccclass, Component, EDITOR, executeInEditMode, Mask, Node, NodeEventType, property, requireComponent, ScrollView } from "../../yj";
/**
 * 
 * Author mqsy_yj
 * DateTime Sat Aug 17 2024 14:45:17 GMT+0800 (中国标准时间)
 * 自动开启ScrollView的mask，当内容超出时mask开启，否则关闭
 */

@ccclass('YJScrollViewMaskAutoEnable')
@requireComponent(Mask)
@executeInEditMode()
/**
 * 自动控制ScrollView遮罩启用的组件
 * @example
 * // 挂载在ScrollView节点上，自动绑定content节点
 * // 或手动指定content节点，当内容尺寸超过容器时自动启用遮罩
 * 
 * // 通过父节点获取ScrollView的content（编辑器模式自动配置）
 * this.node.addComponent(YJScrollViewMaskAutoEnable);
 * 
 * // 或手动指定content节点
 * const maskCtrl = this.node.addComponent(YJScrollViewMaskAutoEnable);
 * maskCtrl.content = this.scrollView.content;
 */
export class YJScrollViewMaskAutoEnable extends Component {
    /**
     * 需要检测的内容节点（通常为ScrollView的content）
     * @tip 如果未指定，在编辑器模式下会自动从父节点的ScrollView组件获取
     */
    @property(Node)
    content: Node = null;

    /** 当组件启用时注册尺寸变化事件 */
    onEnable() {
        // 监听内容节点尺寸变化事件
        this.content?.on(NodeEventType.SIZE_CHANGED, this._enableMask, this);
    }

    /** 当组件禁用时移除事件监听 */
    onDisable() {
        // 移除内容节点尺寸变化监听，避免内存泄漏
        this.content?.off(NodeEventType.SIZE_CHANGED, this._enableMask, this);
    }

    /** 根据内容尺寸控制遮罩启用状态 */
    private _enableMask() {
        // 获取容器（当前节点）和内容节点的尺寸
        const containerSize = no.size(this.node);
        const contentSize = no.size(this.content);
        
        // 当内容高度或宽度超过容器时启用遮罩
        const needMask = contentSize.height > containerSize.height || contentSize.width > containerSize.width;
        this.getComponent(Mask).enabled = needMask;
    }

    /** 编辑器模式下自动配置 */
    update() {
        if (EDITOR) {
            // 自动从父节点的ScrollView组件获取content（如果未手动指定）
            if (!this.content) {
                this.content = this.node.parent.getComponent(ScrollView)?.content;
            }
        }
    }
}