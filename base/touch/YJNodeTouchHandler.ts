
import { ccclass, property, menu, Component, Node, EventTouch } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJNodeTouchHandler
 * DateTime = Tue Feb 15 2022 13:34:04 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJNodeTouchHandler.ts
 * FileBasenameNoExtension = YJNodeTouchHandler
 * URL = db://assets/NoUi3/base/touch/YJNodeTouchHandler.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJNodeTouchHandler')
@menu('NoUi/touch/YJNodeTouchHandler(单个节点的触控处理)')
export class YJNodeTouchHandler extends Component {
    @property(no.EventHandlerInfo)
    touchStart: no.EventHandlerInfo = new no.EventHandlerInfo();
    @property(no.EventHandlerInfo)
    touchMove: no.EventHandlerInfo = new no.EventHandlerInfo();
    @property(no.EventHandlerInfo)
    touchEnd: no.EventHandlerInfo = new no.EventHandlerInfo();
    @property(no.EventHandlerInfo)
    touchCancel: no.EventHandlerInfo = new no.EventHandlerInfo();

    onEnable() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onDisable() {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    private onTouchStart(e: EventTouch) {
        this.touchStart.execute(e);
    }

    private onTouchMove(e: EventTouch) {
        this.touchMove.execute(e);
    }

    private onTouchEnd(e: EventTouch) {
        this.touchEnd.execute(e);
    }

    private onTouchCancel(e: EventTouch) {
        this.touchCancel.execute(e);
    }
}
