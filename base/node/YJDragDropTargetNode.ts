import { no } from "../../no";
import { ccclass, Component, property, Rect } from "../../yj";
/**
 * 拖拽放入目标节点
 * Author mqsy_yj
 * DateTime Sun Sep 29 2024 10:46:18 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJDragDropTargetNode')
/**
 * 拖拽放入目标节点组件
 * @remarks 
 * - 负责管理拖放目标区域的范围检测
 * - 自动计算节点在父节点坐标系中的矩形区域
 * - 适用于需要精确拖放检测的场景（如物品栏、拼图板等）
 * @example
 * // 在拖拽管理器的onApproachTarget事件中检测碰撞：
 * const targetRect = targetNode.getComponent(YJDragDropTargetNode).nodeRect();
 * if (draggedNodeRect.intersects(targetRect)) {
 *   // 执行高亮目标区域等逻辑
 * }
 */
export class YJDragDropTargetNode extends Component {
    /** 缓存节点矩形区域（父节点坐标系）避免重复计算 */
    private _rect: Rect;

    /**
     * 获取节点在父节点坐标系中的矩形区域
     * @returns math.Rect 矩形区域对象（包含x,y,width,height属性）
     * @remarks 
     * - 使用懒加载模式，首次访问时自动计算
     * - 当节点变换发生变化时需要手动调用updateNodeRect()
     * @example
     * // 在拖拽过程中实时检测是否进入目标区域：
     * const targetRect = this.target.nodeRect();
     * const itemPos = this.draggedItem.node.position;
     * return targetRect.contains(no.vec3ToVec2(itemPos));
     */
    public nodeRect(): Rect {
        if (!this._rect) this.updateNodeRect();
        return this._rect;
    }

    /** 
     * 更新节点矩形区域缓存
     * @remarks 
     * - 当节点位置/尺寸发生变化时应调用此方法
     * - 使用no.nodeRect()自动计算节点包围盒
     * @example
     * // 当动态调整目标区域大小时：
     * this.getComponent(YJDragDropTargetNode).updateNodeRect();
     */
    public updateNodeRect(): void {
        this._rect = no.nodeRect(this.node);
    }
}