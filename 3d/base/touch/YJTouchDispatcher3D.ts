
import { ccclass, menu, Component, Node, EventTouch } from '../../../yj';
import { no } from '../../../no';
import { YJTouchListener3D } from './YJTouchListener3D';

/**
 * Predefined variables
 * Name = YJTouchDispatcher3D
 * DateTime = Fri Jan 14 2022 17:37:12 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTouchDispatcher3D.ts
 * FileBasenameNoExtension = YJTouchDispatcher3D
 * URL = db://assets/Script/NoUi3/base/touch/YJTouchDispatcher3D.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
/**
* touch事件分发器，配合YJTouchListener使用
*/
@ccclass('YJTouchDispatcher3D')
@menu('NoUi/touch/YJTouchDispatcher3D(分发器)')
export class YJTouchDispatcher3D extends Component {
    private listeners: YJTouchListener3D[] = [];

    public onStart(event: EventTouch, hitNodes: Node[]) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            const target = this.listeners[i];
            if (!target.needSel || this.include(hitNodes, target.node)) {
                target.onStart(event);
                if (target.needSel && !event.preventSwallow) break;
            }
        }
    }

    public onMove(event: EventTouch, hitNodes: Node[]) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            const target = this.listeners[i];
            if (!target.needSel || this.include(hitNodes, target.node)) {
                target.onMove(event);
                if (target.needSel && !event.preventSwallow) break;
            }
        }
    }

    public onEnd(event: EventTouch, hitNodes: Node[]) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            const target = this.listeners[i];
            if (!target.needSel || this.include(hitNodes, target.node)) {
                target.onEnd(event);
                if (target.needSel && !event.preventSwallow) break;
            }
        }
    }

    public onCancel(event: EventTouch, hitNodes: Node[]) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            const target = this.listeners[i];
            if (!target.needSel || this.include(hitNodes, target.node)) {
                target.onCancel(event);
                if (target.needSel && !event.preventSwallow) break;
            }
        }
    }

    public addListener(listener: YJTouchListener3D) {
        no.addToArray(this.listeners, listener, 'uuid');
        this.sortListenerByPriority();
    }

    public removeListener(listener: YJTouchListener3D) {
        no.removeFromArray(this.listeners, listener, 'uuid');
    }

    private include(arr: Node[], target: Node): boolean {
        return no.indexOfArray(arr, target, 'uuid') > -1;
    }

    private async sortListenerByPriority() {
        if (await no.Throttling.ins(this).wait(.1, true)) {
            no.sortArray(this.listeners, (a, b) => {
                return a.priority - b.priority;
            }, true);
        }
    }
}
