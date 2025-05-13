
import { ccclass, Component, Node } from '../yj';

/**
 * Predefined variables
 * Name = SetCreateNodeOneByOneDelegate
 * DateTime = Wed Jun 22 2022 16:48:12 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateNodeOneByOneDelegate.ts
 * FileBasenameNoExtension = SetCreateNodeOneByOneDelegate
 * URL = db://assets/common/ui/SetCreateNodeOneByOneDelegate.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetCreateNodeOneByOneDelegate')
/**
 * 逐个创建并显示节点的委托类
 * @特点 
 * - 提供创建前后的生命周期回调
 * - 支持数据处理和节点初始化
 *
 */
export class SetCreateNodeOneByOneDelegate extends Component {
    /**
     * 在创建单个节点前触发
     * @param idx - 当前创建节点的索引号（从0开始）
     * @param data - 绑定到该节点的数据对象
     * @example
     * // 在创建前预处理数据
     * beforeCreateOneNode(index: number, itemData: any) {
     *     itemData.processed = true;
     * }
     */
    public beforeCreateOneNode(idx: number, data: any) { }

    /**
     * 在创建单个节点后触发
     * @param idx - 当前创建节点的索引号
     * @param data - 绑定到该节点的数据对象
     * @param node - 新创建的节点实例
     * @example
     * // 初始化节点组件并设置显示内容
     * afterCreateOneNode(index: number, data: ItemData, node: Node) {
     *     const item = node.getComponent(Item);
     *     item.titleLabel.string = data.title;
     *     item.icon.spriteFrame = this.iconAtlas.get(data.iconId);
     * }
     */
    public afterCreateOneNode(idx: number, data: any, node: Node) { }

    /**
     * 当所有节点创建完成后触发
     * @example
     * // 最后进行布局刷新和按钮激活
     * afterAllCreated() {
     *     this.contentView.children.forEach((child, i) => {
     *         child.x = i * 100;
     *     });
     *     this.submitButton.active = true;
     *     
     *     // 使用传统for循环替代foreach
     *     for (let i = 0; i < this.contentView.children.length; i++) {
     *         const child = this.contentView.children[i];
     *         child.getComponent(Widget)?.updateAlignment();
     *     }
     * }
     */
    public afterAllCreated() { }
}
