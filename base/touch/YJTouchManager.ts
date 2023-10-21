import { no } from "../../no";
import { Component, EventTouch, ccclass, property, Node } from "../../yj";
import { YJTouchDispatcher } from "./YJTouchDispatcher";

//touch管理器
@ccclass('YJTouchManager')
export class YJTouchManager extends Component {
    @property({ displayName: '捕获' })
    useCapture: boolean = true;

    private _dispatchers: YJTouchDispatcher[] = [];

    private static _ins: YJTouchManager;

    public static get ins(): YJTouchManager {
        return this._ins;
    }

    onLoad() {
        YJTouchManager._ins = this;
    }

    onDestroy() {
        YJTouchManager._ins = null;
    }

    onEnable() {
        this.node.on(Node.EventType.TOUCH_START, this.onStart, this, this.useCapture);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onMove, this, this.useCapture);
        this.node.on(Node.EventType.TOUCH_END, this.onEnd, this, this.useCapture);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onCancel, this, this.useCapture);

    }

    onDisable() {
        this.node.off(Node.EventType.TOUCH_START, this.onStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onCancel, this);
    }

    public register(dispatcher: YJTouchDispatcher) {
        no.addToArray(this._dispatchers, dispatcher, 'uuid');
    }

    public unregister(dispatcher: YJTouchDispatcher) {
        no.removeFromArray(this._dispatchers, dispatcher, 'uuid');
    }

    protected onStart(event: EventTouch) {
        this._dispatchers.forEach(dispatcher => {
            dispatcher.onStart(event);
        });
    }

    protected onMove(event: EventTouch) {
        this._dispatchers.forEach(dispatcher => {
            dispatcher.onMove(event);
        });
    }

    protected onEnd(event: EventTouch) {
        this._dispatchers.forEach(dispatcher => {
            dispatcher.onEnd(event);
        });
    }

    protected onCancel(event: EventTouch) {
        this._dispatchers.forEach(dispatcher => {
            dispatcher.onCancel(event);
        });
    }
}


