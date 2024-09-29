import { ccclass, EventTouch } from "NoUi3/yj";
import { YJDragDropTargetNode } from "./YJDragDropTargetNode";
/**
 * 拖拽节点
 * Author mqsy_yj
 * DateTime Sun Sep 29 2024 10:46:30 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJDragDropItemNode')
export class YJDragDropItemNode extends YJDragDropTargetNode {

    /** 是否可以拖拽 */
    public canDrag(): boolean {
        return true;
    }

    /**
     * 拖拽开时时
     * @param event 
     * @param hitInfo 
     */
    public onStart(event: EventTouch) {

    }

    /**
     * 拖拽移动时
     * @param event 
     * @param hitInfo 
     */
    public onMove(event: EventTouch) {

    }

    /**
     * 拖拽结束时
     * @param event 
     * @param hitInfo 
     */
    public onEnd(event: EventTouch) {

    }

    /**
     * 拖拽取消时
     * @param event 
     * @param hitInfo 
     */
    public onCancel(event: EventTouch) {

    }

    /**
     * 返回原位时
     * @param event 
     * @param hitInfo 
     */
    public onMoveBack(event: EventTouch) {

    }
}