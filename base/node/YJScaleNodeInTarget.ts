
import { ccclass, property, Component, Node, UITransform, isValid } from '../../yj';

/**
 * Predefined variables
 * Name = YJScaleNodeInTarget
 * DateTime = Thu Mar 02 2023 18:29:12 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJScaleNodeInTarget.ts
 * FileBasenameNoExtension = YJScaleNodeInTarget
 * URL = db://assets/NoUi3/base/node/YJScaleNodeInTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 * 自动缩放节点，使其不超过目标节点
 */

@ccclass('YJScaleNodeInTarget')
export class YJScaleNodeInTarget extends Component {
    /**
     * 目标容器节点
     * @property {Node} target
     * @remarks
     * - 用于限制当前节点缩放的最大边界
     * - 未设置时自动使用父节点作为目标容器
     * @example
     * // 在编辑器中将某个背景节点拖拽到该属性上
     * @property({ type: Node, tooltip: '如果不设置，默认为父节点' })
     */
    @property({ type: Node, tooltip: '如果不设置，默认为父节点' })
    target: Node = null;

    /**
     * 组件初始化
     * @remarks
     * - 自动设置默认目标节点为父节点
     * - 监听节点尺寸变化事件
     */
    onLoad() {
        if (!this.target) this.target = this.node.parent;
        this.node.on(Node.EventType.SIZE_CHANGED, this.onResize, this);
    }

    /**
     * 组件销毁时清理
     * @remarks
     * 移除所有事件监听，防止内存泄漏
     */
    onDestroy() {
        this.node.targetOff(this);
    }

    /**
     * 节点尺寸变化回调
     * @remarks
     * 执行流程：
     * 1. 校验目标节点和当前节点有效性
     * 2. 获取目标容器和当前节点的实际尺寸
     * 3. 计算当前缩放比例是否超出容器边界
     * 4. 按最小比例进行等比缩放
     * 
     * @example
     * // 动态改变目标容器示例：
     * changeTarget(newTarget: Node) {
     *     this.target = newTarget;
     *     this.onResize(); // 手动触发重新计算
     * }
     */
    private onResize() {
        if (!this.target) return;
        if (!isValid(this.node)) return;

        // 获取目标容器的内容尺寸（克隆防止修改原始数据）
        const tSize = this.target.getComponent(UITransform).contentSize.clone();
        // 当前节点的原始内容尺寸
        const size = this.node.getComponent(UITransform).contentSize;
        // 当前节点的缩放值
        const scale = this.node.scale.clone();

        // 判断是否需要缩放（任一维度超出容器）
        if (size.width * scale.x > tSize.width || size.height * scale.y > tSize.height) {
            // 计算最大可缩放比例（保持宽高比）
            const s = Math.min(tSize.width / size.width, tSize.height / size.height);
            this.node.setScale(s, s, s);
        }
    }
}
