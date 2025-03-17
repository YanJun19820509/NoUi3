import { ccclass, disallowMultiple, Component, Node } from "../../yj";


/**
 * 标记会打断合批的节点，由YJNotBatchItemManager管理
 * 如果YJNotBatchItem节点下有子节点，会自动添加YJNotBatchItem组件，无需手动添加
 */
@ccclass('YJNotBatchItem')
@disallowMultiple()
export class YJNotBatchItem extends Component {
    /** 
     * 存储节点的原始父节点引用
     * （当节点被临时移出父节点时保留原始父节点信息）
     */
    private parent: Node;
    /** 
     * 节点在原始父节点中的子节点索引位置
     * （用于恢复时精确还原节点层级关系）
     */
    private index: number;
    /** 
     * 节点原始的本地透明度值
     * （在修改透明度进行合批处理前保存原始值）
     */
    private opacity: number;

    /**
     * 保存节点关键属性用于后续恢复
     * 1. 记录当前父节点引用
     * 2. 记录当前在父节点中的位置索引
     * 3. 保存原始透明度值
     * 4. 将节点透明度同步为父节点透明度（确保合批时渲染一致性）
     * 
     * @example
     * // 当节点被添加到NotBatch管理器时调用
     * const item = node.addComponent(YJNotBatchItem);
     * item.saveProperties();
     */
    public saveProperties() {
        this.parent = this.node.parent;
        this.index = this.node.getSiblingIndex();
        this.opacity = this.node._uiProps.localOpacity;
        this.node._uiProps.localOpacity = this.parent._uiProps.localOpacity;
    }

    /**
     * 恢复节点原始属性
     * 1. 还原原始透明度值
     * 2. 将节点重新插入到原始父节点的正确位置
     * （通过直接操作父节点children数组来避免触发额外事件）
     * 
     * @example
     * // 当需要恢复节点原始状态时调用
     * item.resetProperties();
     * item.destroy(); // 通常配合组件销毁使用
     */
    public resetProperties() {
        // 还原透明度原始值
        this.node._uiProps.localOpacity = this.opacity;
        
        // 直接操作父节点children数组来精确插入原始位置
        // 注意：使用数组splice方法避免触发节点onChildAdded事件
        this.parent['_children'].splice(this.index, 0, this.node);
    }
}


