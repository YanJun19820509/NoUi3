
import { _decorator, Component, Node, EventTouch } from './yj';
import { no } from '../../no';
import { YJTouchListener } from './YJTouchListener';
const { ccclass, menu } = _decorator;

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
    private listeners: YJTouchListener[] = [];

    private static _ins: YJTouchDispatcher;

    /**
     * 单例
     */
    public static get ins(): YJTouchDispatcher {
        return this._ins;
    }

    onLoad() {
        YJTouchDispatcher._ins = this;
    }

    onDestroy() {
        YJTouchDispatcher._ins = null;
    }

    public onStart(event: EventTouch) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            this.listeners[i].onStart(event);
        }
    }

    public onMove(event: EventTouch) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            this.listeners[i].onMove(event);
        }
    }

    public onEnd(event: EventTouch) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            this.listeners[i].onEnd(event);
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
