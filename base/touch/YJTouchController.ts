
import { _decorator, Component, Node, EventTouch, Touch } from 'cc';
import { YJTouchDispatcher } from './YJTouchDispatcher';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJTouchController
 * DateTime = Fri Jan 14 2022 17:36:57 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTouchController.ts
 * FileBasenameNoExtension = YJTouchController
 * URL = db://assets/Script/NoUi3/base/touch/YJTouchController.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
/**
* touch控制器
*/
@ccclass('YJTouchController')
@menu('NoUi/touch/YJTouchController(控制器)')
export class YJTouchController extends Component {
    @property(YJTouchDispatcher)
    dispatcher: YJTouchDispatcher = null;

    @property({ displayName: '多点触控' })
    multiable: boolean = false;
    @property({ displayName: '需要先选中' })
    selected: boolean = true;
    @property({ displayName: '处理取消' })
    needCancel: boolean = true;
    @property({ displayName: '捕获' })
    useCapture: boolean = true;

    protected _touched: boolean;
    protected currentTouch: Touch;

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

    private checkTouched(event: EventTouch): boolean {
        if (this._touched && !this.multiable && this.currentTouch != null) {
            if (event.getTouches().length == 1) return true;
            return this.currentTouch?.getID() == event.touch.getID();
        }
        return true;
    }

    protected onStart(event: EventTouch) {
        if (!this.checkTouched(event)) return;
        this.currentTouch = event.touch;
        this._touched = true;
        if (this.dispatcher)
            this.dispatcher.onStart(event)
        event.preventSwallow = true;
    }

    protected onMove(event: EventTouch) {
        if (this.selected && !this._touched) return;
        if (this.dispatcher)
            this.dispatcher.onMove(event)
        event.preventSwallow = true;
    }

    protected onEnd(event: EventTouch) {
        if (this.selected && !this._touched) return;
        // if (!this.checkTouched(event)) return;
        this._touched = false;
        this.currentTouch = null;
        if (this.dispatcher)
            this.dispatcher.onEnd(event)
        event.preventSwallow = true;
    }

    protected onCancel(event: EventTouch) {
        if (this.selected && !this._touched || !this.needCancel) return;
        this._touched = false;
        this.currentTouch = null;
        if (this.dispatcher)
            this.dispatcher.onCancel(event)
        event.preventSwallow = true;
    }

    public trigger(type: string, event: EventTouch): void {
        switch (type) {
            case Node.EventType.TOUCH_START:
                this.onStart(event);
                break;
            case Node.EventType.TOUCH_MOVE:
                this.onMove(event);
                break;
            case Node.EventType.TOUCH_END:
                this.onEnd(event);
                break;
            case Node.EventType.TOUCH_CANCEL:
                this.onCancel(event);
                break;
        }
    }
}
