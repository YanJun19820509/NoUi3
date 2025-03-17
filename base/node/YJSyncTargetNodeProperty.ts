import { ccclass, property, Component, Node, executeInEditMode, EDITOR } from '../../yj';
import { no } from '../../no';

@ccclass('YJSyncTargetNodeProperty')
@executeInEditMode()
/**
 * 节点属性同步组件
 * @remarks
 * - 实现两个节点之间的transform属性同步（位置、旋转、缩放）
 * - 支持双向同步模式选择（本节点到目标节点 或 目标节点到本节点）
 * - 提供编辑器环境同步开关
 * - 适用于需要保持两个节点空间状态一致的场景
 * 
 * @example
 * // 编辑器配置示例：
 * 1. 添加到需要同步的节点
 * 2. 拖拽目标节点到target属性
 * 3. 设置同步方向（同步到target或从target同步）
 * 4. 勾选syncOnEditor可在编辑器实时预览效果
 * 
 * // 代码动态创建示例：
 * const node = new Node('SyncNode');
 * const comp = node.addComponent(YJSyncTargetNodeProperty);
 * comp.target = targetNode;  // 设置同步目标
 * comp.syncTo = true;        // 设置同步方向（本节点 -> 目标节点）
 * comp.syncOnEditor = true;  // 开启编辑器实时同步
 */
export class YJSyncTargetNodeProperty extends Component {
    @property(Node)
    target: Node = null;
    @property({ displayName: '同步到target', tooltip: '从本节点同步到target或从target同步到本节点' })
    syncTo: boolean = false;
    @property
    syncOnEditor: boolean = false;

    protected onLoad(): void {
        if (!this.target) this.update = () => { };
    }

    protected update(dt: number): void {
        if (EDITOR && !this.syncOnEditor) return;
        let from: Node, to: Node;
        this.syncTo ? (from = this.node, to = this.target) : (from = this.target, to = this.node);
        no.position(to, no.position(from));
        no.rotation(to, no.rotation(from));
        no.scale(to, no.scale(from));
    }
}


