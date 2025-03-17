import { ccclass, Component, director, isValid, UITransform, Node, Director } from '../../yj';
import { YJNotBatchItem } from './YJNotBatchItem';
/**
 * YJNotBatchItem管理器，会自动搜索当前节点下所有子节点的YJNotBatchItem
 * 在开始渲染前，将YJNotBatchItem所属的节点移出其父节点，不打断同级节点的渲染合批，渲染结束后再移回父节点。
 * 所以实际渲染效果是YJNotBatchItem的节点都在最上层。如果有遮挡效果，用于遮挡的节点必需为YJNotBatchItem节点的子节点。
 * 注：此组件在原生环境下无效，因为通过'_children'来管理子节点的层级关系在原生环境下无效。
 */
@ccclass('YJNotBatchItemManager')
export class YJNotBatchItemManager extends Component {
    /** 
     * 存储所有YJNotBatchItemManager组件所在的节点 
     * @example
     * // 获取场景中所有管理器节点：
     * const allBatchManagers = YJNotBatchItemManager.batchNodes;
     * allBatchManagers.forEach(manager => console.log(manager.name));
     */
    public static batchNodes: Node[] = [];

    /** 
     * 用于存放不参与合批的节点的临时容器层
     * @remarks 该层会在渲染前创建，渲染后销毁
     */
    private _layer: Node;
    /** 
     * 存储包含子节点的不参与合批节点（用于递归处理）
     * @remarks 当父节点被标记为不参与合批时，需要递归处理其所有子节点
     */
    private _subNodes: Node[] = [];

    /** 
     * 组件加载时创建容器层并初始化
     * @remarks
     * - 将当前节点注册到静态管理器
     * - 创建_batch_layer节点作为临时容器
     * - 保持容器层与当前节点相同的UI属性
     * @example
     * // 在编辑器模式下：
     * // 添加本组件后会在节点下生成_batch_layer子节点
     */
    protected onLoad(): void {
        YJNotBatchItemManager.batchNodes.push(this.node);
        // 创建容器层
        this._layer = new Node('_batch_layer');
        const ut = this._layer.addComponent(UITransform);
        // 设置容器层的大小和锚点与当前节点一致
        ut.setContentSize(this.node.getComponent(UITransform).contentSize.clone());
        ut.setAnchorPoint(this.node.getComponent(UITransform).anchorPoint.clone());
        this._layer.layer = this.node.layer;
        this._layer.parent = this.node;
    }

    /** 
     * 组件销毁时从batchNodes中移除 
     * @example
     * // 当节点被销毁时：
     * // 自动从静态管理列表中移除，防止内存泄漏
     */
    protected onDestroy(): void {
        let index = YJNotBatchItemManager.batchNodes.indexOf(this.node);
        if (index > -1) {
            YJNotBatchItemManager.batchNodes.splice(index, 1);
        }
    }

    /** 
     * 将不参与合批的子节点移动到新的容器层
     * @remarks
     * 执行流程：
     * 1. 检查组件是否在激活状态
     * 2. 递归查找所有需要处理的子节点
     * 3. 处理包含子节点的特殊节点
     * @example
     * // 手动触发节点重组：
     * manager.setNotBatchChildrenToNewLayer();
     * // 注意：通常由导演事件自动调用，无需手动触发
     */
    public setNotBatchChildrenToNewLayer() {
        if (!this.enabledInHierarchy) return;
        this.getNotBatchChildren(this.node);
        this.getSubNotBatchChildren();
    }

    /**
     * 递归查找节点下所有不参与合批的子节点
     * @param parent 要查找的父节点
     * @remarks
     * 处理逻辑：
     * 1. 从后往前遍历子节点（保证处理顺序）
     * 2. 发现YJNotBatchItem组件时：
     *    - 保存原始属性
     *    - 移动到临时容器层
     *    - 记录需要递归处理的父节点
     * 3. 继续递归处理其他子节点
     * @example
     * // 处理节点树结构：
     * // ParentNode
     * //   |- Child1 (有YJNotBatchItem)
     * //   |- Child2
     * //       |- GrandChild (有YJNotBatchItem)
     * // 处理后Child1和GrandChild都会被移动到临时层
     */
    private getNotBatchChildren(parent: Node) {
        if (parent && parent.name != '_batch_layer') {
            let children = parent['_children'];
            if (children.length == 0) return;
            for (let i = children.length - 1; i >= 0; i--) {
                let child = children[i];
                if (isValid(child, true)) {
                    const notBatchItem = child.getComponent(YJNotBatchItem);
                    if (notBatchItem && notBatchItem.enabled) {
                        // 保存节点属性并移动到容器层
                        notBatchItem.saveProperties();
                        children.splice(i, 1);
                        this._layer['_children'].unshift(child);
                        if (child['_children'].length > 0) this._subNodes.unshift(child);
                    } else {
                        this.getNotBatchChildren(child);
                    }
                }
            }
        }
    }

    /** 
     * 递归处理包含子节点的不参与合批节点
     * @remarks
     * 特殊处理流程：
     * 1. 为所有子节点自动添加YJNotBatchItem组件
     * 2. 清空原父节点的子节点列表
     * 3. 递归处理包含孙节点的子节点
     * @example
     * // 处理复杂层级结构：
     * // 当父节点被标记时，其所有子节点/孙节点都会自动获得YJNotBatchItem组件
     * // 确保整个子树都不参与合批
     */
    private getSubNotBatchChildren() {
        const n = this._subNodes.length;
        if (n == 0) return;
        let nodes: Node[] = [];
        for (let i = 0; i < n; i++) {
            let children = this._subNodes[i]['_children'];
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                // 为子节点添加或获取YJNotBatchItem组件
                const notBatchItem = child.getComponent(YJNotBatchItem) || child.addComponent(YJNotBatchItem);
                notBatchItem.saveProperties();
                this._layer['_children'].push(child);
                if (child['_children'].length > 0) nodes.push(child);
            }
            this._subNodes[i]['_children'].length = 0;
        }
        this._subNodes = nodes;
        this.getSubNotBatchChildren();
    }

    /** 
     * 将不参与合批的节点恢复到原来的位置
     * @remarks
     * 恢复流程：
     * 1. 从临时容器层弹出所有节点
     * 2. 调用每个节点的resetProperties方法
     * 3. 最终清空临时容器
     * @example
     * // 渲染结束后：
     * // 所有临时移动的节点都会回到原始父节点
     * // 保持场景节点结构不变
     */
    public resetNotBatchChildrenToOldLayer() {
        if (!this.enabledInHierarchy) return;
        const batchItems = this._layer.children;
        while (1) {
            const item = batchItems.pop();
            if (!item) {
                break;
            }
            item.getComponent(YJNotBatchItem).resetProperties();
        }
    }
}


director.on(Director.EVENT_BEFORE_DRAW, (dt) => {
    let nodes = YJNotBatchItemManager.batchNodes;
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.active && node.isValid) {
            node.getComponent(YJNotBatchItemManager).setNotBatchChildrenToNewLayer();
        }
    }
});


director.on(Director.EVENT_AFTER_DRAW, (dt) => {
    let nodes = YJNotBatchItemManager.batchNodes;
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.active && node.isValid) {
            node.getComponent(YJNotBatchItemManager).resetNotBatchChildrenToOldLayer();
        }
    }
});