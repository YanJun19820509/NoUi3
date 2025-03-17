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

    /**
     * 判断当前是否允许拖拽
     * @returns 默认返回true，可重写此方法实现条件判断
     * @example
     * // 当满足特定条件时才允许拖拽
     * canDrag() {
     *     return this.itemData.isUnlocked;
     * }
     */
    public canDrag(): boolean {
        return true;
    }

    /**
     * 拖拽开始时的回调
     * @param event 触摸事件对象
     * @example
     * // 记录初始位置/显示拖拽效果
     * onStart(event) {
     *     this.startPos = this.node.position.clone();
     *     this.node.opacity = 150; // 半透明拖拽效果
     * }
     */
    public onStart(event: EventTouch) {

    }

    /**
     * 拖拽移动时的回调（每帧调用）
     * @param event 触摸事件对象
     * @example
     * // 更新节点位置跟随触摸
     * onMove(event) {
     *     const delta = event.getDelta();
     *     this.node.position.add3f(delta.x, delta.y, 0);
     *     // 限制移动范围
     *     this.node.position.clampf(-300, -500, 300, 500);
     * }
     */
    public onMove(event: EventTouch) {

    }

    /**
     * 拖拽结束时的回调（成功放置后）
     * @param event 触摸事件对象
     * @example
     * // 处理放置成功逻辑
     * onEnd(event) {
     *     if (this.currentTarget) {
     *         this.currentTarget.acceptItem(this);
     *         no.evn.emit('item-drop', this.itemData);
     *     }
     * }
     */
    public onEnd(event: EventTouch) {

    }

    /**
     * 拖拽取消时的回调（未成功放置）
     * @param event 触摸事件对象
     * @example
     * // 重置状态/显示取消效果
     * onCancel(event) {
     *     this.node.getComponent(Button).interactable = false;
     *     this.scheduleOnce(() => {
     *         this.node.getComponent(Button).interactable = true;
     *     }, 0.5);
     * }
     */
    public onCancel(event: EventTouch) {

    }

    /**
     * 返回原位的动画回调
     * @param event 触摸事件对象
     * @example
     * // 播放返回动画
     * onMoveBack(event) {
     *     tween(this.node)
     *         .to(0.3, { position: this.startPos }, { easing: 'sineOut' })
     *         .start();
     * }
     */
    public onMoveBack(event: EventTouch) {

    }
}