
import { ccclass, menu, Component, Node, EventTouch, property } from '../../yj';
import { no } from '../../no';
import { YJTouchListener } from './YJTouchListener';
import { YJTouchManager } from './YJTouchManager';

/**
 * Predefined variables
 * Name = YJTouchDispatcher
 * DateTime = Fri Jan 14 2022 17:37:12 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTouchDispatcher.ts
 * FileBasenameNoExtension = YJTouchDispatcher
 * URL = db://assets/Script/NoUi3/base/touch/YJTouchDispatcher.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
/**
* touch事件分发器，配合YJTouchListener使用
*/
@ccclass('YJTouchDispatcher')
@menu('NoUi/touch/YJTouchDispatcher(分发器)')
export class YJTouchDispatcher extends Component {
    @property({ displayName: '注册到管理器' })
    addToManager: boolean = false;

    onLoad() {
        if (this.addToManager) YJTouchManager.ins.register(this);
    }

    onDestroy() {
        if (this.addToManager) YJTouchManager.ins.unregister(this);
    }

    private listeners: YJTouchListener[] = [];

    public onStart(event: EventTouch) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            if (this.listeners[i].onStart(event) && !event.preventSwallow) break;
        }
    }

    public onMove(event: EventTouch) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            if (this.listeners[i].onMove(event) && !event.preventSwallow) break;
        }
    }

    public onEnd(event: EventTouch) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            if (this.listeners[i].onEnd(event) && !event.preventSwallow) break;
        }
    }

    public onCancel(event: EventTouch) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            this.listeners[i].onCancel(event);
        }
    }

    public addListener(listener: YJTouchListener) {
        no.addToArray(this.listeners, listener, 'uuid');
    }

    public removeListener(listener: YJTouchListener) {
        no.removeFromArray(this.listeners, listener, 'uuid');
    }
}
