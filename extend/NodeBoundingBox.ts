/**
 * 
 * Author mqsy_yj
 * DateTime Mon Feb 09 2026 15:48:26 GMT+0800 (中国标准时间)
 *
 */

import { nodeUtils } from "@hackUi/ui/assemble/nodeUtils";
import { Rect, Node, Size, UITransform, v2, v3 } from "@hackUi/yj";



/**
 * 节点包围盒类（增强计算包含子节点的包围盒）
 * 获取节点包围盒通常用UITransform.getBoundingBoxToWorld()，
 * 如果计算不准确（需要包含动态子节点时），可用本类
 * 
 * @example
 * // 创建包围盒实例
 * const bbox = NodeBoundingBox.new(myNode);
 * 
 * // 动态添加子节点后更新包围盒
 * myNode.addChild(newChild);
 * bbox.onAddChild(newChild);
 */
export class NodeBoundingBox {
    private _targetNode: Node;
    private _rect: Rect;

    /**
     * @param targetNode - 需要计算包围盒的目标节点
     */
    constructor(targetNode: Node) {
        this._targetNode = targetNode;
        this._rect = targetNode.getComponent(UITransform).getBoundingBox();
        this._rect.center = v2();
    }

    /** 工厂方法创建新实例 */
    public static new(targetNode: Node): NodeBoundingBox {
        return new NodeBoundingBox(targetNode);
    }

    /**
     * 当添加子节点时更新包围盒
     * @param child - 新增的子节点
     * @example
     * // 动态添加子节点后手动更新
     * const newChild = instantiate(prefab);
     * parentNode.addChild(newChild);
     * bbox.onAddChild(newChild);
     */
    public onAddChild(child: Node) {
        this.updateRect(nodeUtils.size(child), nodeUtils.position(child));
    }

    /**
     * 获取节点自身坐标系下的原始包围盒（不包含子节点）
     * @returns 原始包围盒矩形
     * @example
     * // 获取节点初始包围盒
     * const originRect = bbox.getOriginRect();
     */
    public getOriginRect(): Rect {
        return this._rect.clone();
    }

    /**
     * 获取父坐标系下的包围盒（包含所有子节点）
     * @returns 父节点坐标系中的包围盒
     * @example
     * // 计算在父容器中的实际占位区域
     * const rectInParent = bbox.getRect();
     * console.log(`位置：${rectInParent.x},${rectInParent.y} 尺寸：${rectInParent.width}x${rectInParent.height}`);
     */
    public getRect(): Rect {
        let r = this._rect.clone(),
            pos = nodeUtils.position(this._targetNode);
        r.x += pos.x;
        r.y += pos.y;
        return r;
    }

    /**
     * 获取世界坐标系下的包围盒（包含所有子节点）
     * @returns 世界坐标系中的包围盒
     * @example
     * // 检测与其他节点的世界坐标碰撞
     * const worldRect1 = bbox1.getRectToWorld();
     * const worldRect2 = bbox2.getRectToWorld();
     * if (worldRect1.intersects(worldRect2)) {
     *   console.log('发生碰撞');
     * }
     */
    public getRectToWorld(): Rect {
        let r = this._rect.clone();
        const pos = nodeUtils.nodeWorldPosition(this._targetNode);
        r.x += pos.x;
        r.y += pos.y;
        return r;
    }

    private updateRect(size: Size, pos: { x: number, y: number, z: number }) {
        const xMin = pos.x - size.width / 2,
            xMax = xMin + size.width,
            yMin = pos.y - size.height / 2,
            yMax = yMin + size.height;
        this._rect.xMin = Math.min(this._rect.xMin, xMin);
        this._rect.xMax = Math.max(this._rect.xMax, xMax);
        this._rect.yMin = Math.min(this._rect.yMin, yMin);
        this._rect.yMax = Math.max(this._rect.yMax, yMax);
    }

    /**
     * 静态方法快速获取父坐标系包围盒（适合一次性计算）
     * @param targetNode - 目标节点
     * @returns 父节点坐标系中的包围盒
     * @example
     * // 快速获取单个节点的包围盒
     * const rect = NodeBoundingBox.getRect(spriteNode);
     */
    public static getRect(targetNode: Node): Rect {
        const children = targetNode.children;
        let rect = targetNode.getComponent(UITransform).getBoundingBox(),
            targetNodePos = nodeUtils.position(targetNode);
        rect.center = v2();
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const size = nodeUtils.size(child), pos = nodeUtils.position(child);
            const xMin = pos.x - size.width / 2,
                xMax = xMin + size.width,
                yMin = pos.y - size.height / 2,
                yMax = yMin + size.height;
            rect.xMin = Math.min(rect.xMin, xMin);
            rect.xMax = Math.max(rect.xMax, xMax);
            rect.yMin = Math.min(rect.yMin, yMin);
            rect.yMax = Math.max(rect.yMax, yMax);
        }
        rect.x += targetNodePos.x;
        rect.y += targetNodePos.y;
        return rect;
    }

    /**
     * 静态方法快速获取世界坐标系包围盒（适合一次性计算）
     * @param targetNode - 目标节点
     * @returns 世界坐标系中的包围盒
     * @example
     * // 快速获取UI元素的世界坐标范围
     * const worldRect = NodeBoundingBox.getRectToWorld(uiElement);
     * if (worldRect.contains(touchPos)) {
     *   console.log('点击在元素范围内');
     * }
     */
    public static getRectToWorld(targetNode: Node): Rect {
        let rect = this.getRect(targetNode),
            pos = v3(rect.center.x, rect.center.y);
        targetNode.parent.getComponent(UITransform).convertToWorldSpaceAR(pos, pos);
        rect.center.x = pos.x;
        rect.center.y = pos.y;
        return rect;
    }
}