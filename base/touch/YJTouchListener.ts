
import { ccclass, property, menu, Component, Node, EventTouch, Rect, EDITOR } from '../../yj';
import { no } from '../../no';
import { YJFitScreen } from '../YJFitScreen';
import { YJTouchDispatcher } from './YJTouchDispatcher';

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
    @property(YJTouchDispatcher)
    dispatcher: YJTouchDispatcher = null;

    @property({ type: no.EventHandlerInfo, displayName: '按下事件' })
    startHandlers: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '移动事件' })
    moveHandlers: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '释放事件' })
    endHandlers: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '取消事件' })
    cancelHandlers: no.EventHandlerInfo[] = [];
    @property({ displayName: '吞噬' })
    canSwallow: boolean = true;

    //是否在区域内
    protected isTouchIn: boolean = false;
    protected rect: Rect;

    onLoad() {
        if (EDITOR) {
            if (!this.dispatcher) this.dispatcher = no.getComponentInParents(this.node, YJTouchDispatcher);
        }
    }

    async onEnable() {
        this.dispatcher?.addListener(this);
    }

    onDisable() {
        this.dispatcher?.removeListener(this);
    }

    public onStart(event: EventTouch): boolean {
        if (this.rect == null) this.rect = no.nodeBoundingBox(this.node);
        this.isTouchIn = this.rect.contains(YJFitScreen.fitTouchPoint(event.touch));
        event.preventSwallow = !(this.canSwallow && this.isTouchIn);
        if (!this.isTouchIn) return false;
        no.EventHandlerInfo.execute(this.startHandlers, event);
        return true;
    }

    public onMove(event: EventTouch): boolean {
        event.preventSwallow = !(this.canSwallow && this.isTouchIn);
        if (!this.isTouchIn) return false;
        no.EventHandlerInfo.execute(this.moveHandlers, event);
        return true;
    }

    public onEnd(event: EventTouch): boolean {
        event.preventSwallow = !(this.canSwallow && this.isTouchIn);
        if (!this.isTouchIn) return false;
        this.isTouchIn = false;
        no.EventHandlerInfo.execute(this.endHandlers, event);
        return true;
    }

    public onCancel(event: EventTouch) {
        event.preventSwallow = !(this.canSwallow && this.isTouchIn);
        if (!this.isTouchIn) return;
        this.isTouchIn = false;
        no.EventHandlerInfo.execute(this.cancelHandlers, event);
    }
}
