import { ccclass, property, menu, Component, Node, EventTouch, Touch, Camera, input, Input, Ray, PhysicsSystem } from '../../../yj';
import { YJTouchDispatcher3D } from './YJTouchDispatcher3D';

/**
 * Predefined variables
 * Name = YJTouchController3D
 * DateTime = Fri Jan 14 2022 17:36:57 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTouchController3D.ts
 * FileBasenameNoExtension = YJTouchController3D
 * URL = db://assets/Script/NoUi3/base/touch/YJTouchController3D.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
/**
* touch控制器
*/
@ccclass('YJTouchController3D')
@menu('NoUi/touch/YJTouchController3D(控制器)')
export class YJTouchController3D extends Component {
    @property({ type: Camera })
    camera: Camera = null;
    @property(YJTouchDispatcher3D)
    dispatcher: YJTouchDispatcher3D = null;

    @property({ displayName: '多点触控' })
    multiable: boolean = false;

    protected _touched: boolean = false;
    protected currentTouch: Touch = null;
    private _ray: Ray = new Ray();
    private _allHitNodes: Node[] = [];

    onEnable() {
        input.on(Input.EventType.TOUCH_START, this.onStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onMove, this);
        input.on(Input.EventType.TOUCH_END, this.onEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onCancel, this);
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_START, this.onStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onMove, this);
        input.off(Input.EventType.TOUCH_END, this.onEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onCancel, this);
    }

    private checkTouched(event: EventTouch): boolean {
        if (this._touched && !this.multiable && this.currentTouch != null) {
            if (event.getAllTouches().length == 1) return true;
            return this.currentTouch?.getID() == event.touch.getID();
        }
        return true;
    }

    private getHitNodes(event: EventTouch) {
        const touch = event.touch!;
        this.camera.screenPointToRay(touch.getLocationX(), touch.getLocationY(), this._ray);
        let a: Node[] = [];
        if (PhysicsSystem.instance.raycast(this._ray)) {
            const raycastResults = PhysicsSystem.instance.raycastResults;
            raycastResults.forEach(b => {
                a[a.length] = b.collider.node;
                if (b.collider.node == this.node) this._touched = true;
            });
        }
        this._allHitNodes.length = 0;
        if (this._touched) this._allHitNodes = a;
    }

    protected onStart(event: EventTouch) {
        if (!this.checkTouched(event)) return;
        this.getHitNodes(event);
        if (!this._touched) return;
        this.currentTouch = event.touch;
        if (this.dispatcher)
            this.dispatcher.onStart(event, this._allHitNodes)
    }

    protected onMove(event: EventTouch) {
        if (!this._touched) return;
        if (this.dispatcher)
            this.dispatcher.onMove(event, this._allHitNodes)
    }

    protected onEnd(event: EventTouch) {
        if (!this._touched) return;
        this._touched = false;
        this.currentTouch = null;
        if (this.dispatcher)
            this.dispatcher.onEnd(event, this._allHitNodes)
    }

    protected onCancel(event: EventTouch) {
        if (!this._touched) return;
        this._touched = false;
        this.currentTouch = null;
        if (this.dispatcher)
            this.dispatcher.onCancel(event, this._allHitNodes)
    }
}
