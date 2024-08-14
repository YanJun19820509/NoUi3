import { _decorator, Component, Node } from 'cc';
const { ccclass, property, disallowMultiple } = _decorator;

/**
 * 标记会打断合批的节点，由YJNotBatchItemManager管理
 * 如果YJNotBatchItem节点下有子节点，会自动添加YJNotBatchItem组件，无需手动添加
 */
@ccclass('YJNotBatchItem')
@disallowMultiple()
export class YJNotBatchItem extends Component {
    private parent: Node;
    private index: number;
    private opacity: number;

    protected onLoad(): void {
        this.node.children.forEach(child => child.addComponent(YJNotBatchItem));
    }

    public saveProperties() {
        this.parent = this.node.parent;
        this.index = this.node.getSiblingIndex();
        this.opacity = this.node._uiProps.localOpacity;
        this.node._uiProps.localOpacity = this.parent._uiProps.localOpacity;
    }

    public resetProperties() {
        this.node._uiProps.localOpacity = this.opacity;
        this.parent['_children'].splice(this.index, 0, this.node);
    }
}


