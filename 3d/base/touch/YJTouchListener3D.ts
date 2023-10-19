
import { ccclass, property, menu, Component, Node, EventTouch, Rect, EDITOR } from '../../../yj';
import { no } from '../../../no';
import { YJTouchDispatcher3D } from './YJTouchDispatcher3D';

/**
 * Predefined variables
 * Name = YJTouchListener3D
 * DateTime = Fri Jan 14 2022 17:37:26 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTouchListener3D.ts
 * FileBasenameNoExtension = YJTouchListener3D
 * URL = db://assets/Script/NoUi3/base/touch/YJTouchListener3D.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
/**
 * touch事件监听器，配合YJTouchDispatcher使用
 */
@ccclass('YJTouchListener3D')
@menu('NoUi/touch/YJTouchListener3D(监听器)')
export class YJTouchListener3D extends Component {
    @property(YJTouchDispatcher3D)
    dispatcher: YJTouchDispatcher3D = null;
    @property({ displayName: '需要选中' })
    needSel: boolean = false;
    @property({ displayName: '优先级', tooltip: '优先级高的先处理，如果需要选中且支持事件吞噬则不会处理优先级低的' })
    priority: number = 0;
    @property({ type: no.EventHandlerInfo, displayName: '按下事件' })
    startHandlers: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '移动事件' })
    moveHandlers: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '释放事件' })
    endHandlers: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '取消事件' })
    cancelHandlers: no.EventHandlerInfo[] = [];

    onLoad() {
        if (EDITOR) {
            if (!this.dispatcher) this.dispatcher = no.getComponentInParents(this.node, YJTouchDispatcher3D);
        }
    }

    async onEnable() {
        this.dispatcher?.addListener(this);
    }

    onDisable() {
        this.dispatcher?.removeListener(this);
    }

    public onStart(event: EventTouch): void {
        no.EventHandlerInfo.execute(this.startHandlers, event);
    }

    public onMove(event: EventTouch): void {
        no.EventHandlerInfo.execute(this.moveHandlers, event);
    }

    public onEnd(event: EventTouch): void {
        no.EventHandlerInfo.execute(this.endHandlers, event);
    }

    public onCancel(event: EventTouch) {
        no.EventHandlerInfo.execute(this.cancelHandlers, event);
    }
}
