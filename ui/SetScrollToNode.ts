
import { UITransform, v2, ccclass, menu } from '../yj';
import { SetScrollToPercent } from './SetScrollToPercent';

/**
 * Predefined variables
 * Name = SetScrollToNode
 * DateTime = Mon Jan 17 2022 14:16:25 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetScrollToNode.ts
 * FileBasenameNoExtension = SetScrollToNode
 * URL = db://assets/Script/NoUi3/ui/SetScrollToNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetScrollToNode')
@menu('NoUi/ui/SetScrollToNode(设置scrollView滚动到节点:string)')
/**
 * 滚动到指定名称的节点
 * data:string
 */
export class SetScrollToNode extends SetScrollToPercent {

    /**
     * 当数据变化时延迟执行滚动到节点操作
     * @param data 目标节点名称 
     */
    protected onDataChange(data: any) {
        // 使用定时器延迟执行，确保节点布局完成
        this.scheduleOnce(() => {
            this.a_scrollToNode(data);
        }, this.wait);
    }

    /**
     * 滚动到指定名称的节点
     * @param name 目标节点名称
     * @example
     * // 将ScrollView滚动到名为"item_5"的节点
     * this.a_scrollToNode("item_5");
     */
    public a_scrollToNode(name: string) {
        // 验证ScrollView有效性
        if (!this.scrollView?.isValid) return;
        
        // 获取目标节点
        let node = this.scrollView.content.getChildByName(name);
        if (node == null) return;

        // 计算内容容器的布局信息
        let ut = this.scrollView.content.getComponent(UITransform);
        let anchor = ut.anchorPoint; // 获取锚点坐标
        let size = ut.getBoundingBox().size; // 获取容器总尺寸
        
        // 计算目标节点相对位置
        let pos = node.position;
        // 计算最终偏移量（考虑锚点偏移和自定义偏移）
        let offset = v2(
            pos.x + size.width * anchor.x + this.offset.x,
            pos.y - size.height * anchor.y - this.offset.y
        );

        // 根据滚动方向重置不需要的轴向偏移
        if (!this.scrollView.vertical) {
            offset.y = 0; // 垂直滚动禁用时归零Y轴偏移
        }
        if (!this.scrollView.horizontal) {
            offset.x = 0; // 水平滚动禁用时归零X轴偏移
        }

        // 执行滚动动画
        this.scrollToOffset(offset, this.duration);
    }
}
