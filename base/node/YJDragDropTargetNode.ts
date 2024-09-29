import { no } from "NoUi3/no";
import { ccclass, Component, property, Rect } from "../../yj";
/**
 * 拖拽放入目标节点
 * Author mqsy_yj
 * DateTime Sun Sep 29 2024 10:46:18 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJDragDropTargetNode')
export class YJDragDropTargetNode extends Component {
    private _rect: Rect;

    /**
     * 当前节点在world的rect
     * @returns 
     */
    public nodeRect() {
        if (!this._rect) this.updateNodeRect();
        return this._rect;
    }

    /** 更新节点rect */
    public updateNodeRect() {
        this._rect = no.nodeRect(this.node);
    }
}