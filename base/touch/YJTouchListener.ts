
import { _decorator, Component, Node, EventTouch, Rect } from 'cc';
import { no } from '../../no';
import { YJTouchDispatcher } from './YJTouchDispatcher';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJTouchListener
 * DateTime = Fri Jan 14 2022 17:37:26 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTouchListener.ts
 * FileBasenameNoExtension = YJTouchListener
 * URL = db://assets/Script/NoUi3/base/touch/YJTouchListener.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
/**
 * touch事件监听器，配合YJTouchDispatcher使用
 */
@ccclass('YJTouchListener')
@menu('NoUi/touch/YJTouchListener(监听器)')
export class YJTouchListener extends Component {
    @property({ type: no.EventHandlerInfo, displayName: '按下事件' })
    startHandlers: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '移动事件' })
    moveHandlers: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '释放事件' })
    endHandlers: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '取消事件' })
    cancelHandlers: no.EventHandlerInfo[] = [];

    //是否在区域内
    protected isTouchIn: boolean = false;
    protected rect: Rect;

    async onEnable() {
        await no.waitFor(() => { return YJTouchDispatcher.ins != null; }, this)
        YJTouchDispatcher.ins?.addListener(this);
    }

    onDisable() {
        YJTouchDispatcher.ins?.removeListener(this);
    }

    public onStart(event: EventTouch) {
        if (this.rect == null) this.rect = no.nodeBoundingBox(this.node);
        this.isTouchIn = this.rect.contains(event.getUIStartLocation());
        if (!this.isTouchIn) return;
        no.EventHandlerInfo.execute(this.startHandlers, event);
    }

    public onMove(event: EventTouch) {
        if (!this.isTouchIn) return;
        no.EventHandlerInfo.execute(this.moveHandlers, event);
    }

    public onEnd(event: EventTouch) {
        if (!this.isTouchIn) return;
        this.isTouchIn = false;
        no.EventHandlerInfo.execute(this.endHandlers, event);
    }

    public onCancel(event: EventTouch) {
        if (!this.isTouchIn) return;
        this.isTouchIn = false;
        no.EventHandlerInfo.execute(this.cancelHandlers, event);
    }
}
