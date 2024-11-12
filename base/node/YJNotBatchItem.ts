import { ccclass, disallowMultiple, Component, Node } from "../../yj";


/**
 * 标记会打断合批的节点，由YJNotBatchItemManager管理
 * 如果YJNotBatchItem节点下有子节点，会自动添加YJNotBatchItem组件，无需手动添加
 */
@ccclass('YJNotBatchItem')
@disallowMultiple()
export class YJNotBatchItem extends Component {
    /** 节点的父节点 */
    private parent: Node;
    /** 节点在父节点中的索引 */
    private index: number; 
    /** 节点原始的透明度值 */
    private opacity: number;

    /**
     * 保存节点的属性
     * 保存父节点引用、在父节点中的索引位置和原始透明度
     * 并将节点透明度设置为与父节点一致
     */
    public saveProperties() {
        this.parent = this.node.parent;
        this.index = this.node.getSiblingIndex();
        this.opacity = this.node._uiProps.localOpacity;
        this.node._uiProps.localOpacity = this.parent._uiProps.localOpacity;
    }

    /**
     * 重置节点的属性
     * 恢复节点原始的透明度值
     * 将节点重新插入到父节点的原始位置
     */
    public resetProperties() {
        this.node._uiProps.localOpacity = this.opacity;
        this.parent['_children'].splice(this.index, 0, this.node);
    }
}


