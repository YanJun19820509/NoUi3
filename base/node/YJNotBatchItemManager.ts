import { ccclass, Component, director, isValid, UITransform, Node, Director } from '../../yj';
import { YJNotBatchItem } from './YJNotBatchItem';
/**
 * YJNotBatchItem管理器，会自动搜索当前节点下所有子节点的YJNotBatchItem
 * 在开始渲染前，将YJNotBatchItem所属的节点移出其父节点，不打断同级节点的渲染合批，渲染结束后再移回父节点。
 * 所以实际渲染效果是YJNotBatchItem的节点都在最上层。如果有遮挡效果，用于遮挡的节点必需为YJNotBatchItem节点的子节点。
 */
@ccclass('YJNotBatchItemManager')
export class YJNotBatchItemManager extends Component {
    /** 存储所有YJNotBatchItemManager组件所在的节点 */
    public static batchNodes: Node[] = [];

    /** 用于存放不参与合批的节点的容器层 */
    private _layer: Node;
    /** 存储包含子节点的不参与合批节点 */
    private _subNodes: Node[] = [];

    /** 组件加载时创建容器层并初始化 */
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

    /** 组件销毁时从batchNodes中移除 */
    protected onDestroy(): void {
        let index = YJNotBatchItemManager.batchNodes.indexOf(this.node);
        if (index > -1) {
            YJNotBatchItemManager.batchNodes.splice(index, 1);
        }
    }

    /** 将不参与合批的子节点移动到新的容器层 */
    public setNotBatchChildrenToNewLayer() {
        if (!this.enabledInHierarchy) return;
        this.getNotBatchChildren(this.node);
        this.getSubNotBatchChildren();
    }

    /**
     * 递归查找节点下所有不参与合批的子节点
     * @param parent 要查找的父节点
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

    /** 递归处理包含子节点的不参与合批节点 */
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

    /** 将不参与合批的节点恢复到原来的位置 */
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