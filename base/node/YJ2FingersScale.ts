
import { _decorator, Component, Node, EventTouch, math, Touch } from './yj';
import { YJFitScreen } from '../YJFitScreen';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJ2FingersScale
 * DateTime = Mon Jul 18 2022 11:59:25 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJ2FingersScale.ts
 * FileBasenameNoExtension = YJ2FingersScale
 * URL = db://assets/NoUi3/base/node/YJ2FingersScale.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJ2FingersScale')
export class YJ2FingersScale extends Component {
    @property(Node)
    target: Node = null;
    @property({ min: .1 })
    minScale: number = .5;
    @property({ min: 1 })
    maxScale: number = 1.5;

    private touched: boolean = false;
    private startDis: number;
    private startScale: number;

    onEnable() {
        this.target = this.target || this.node;
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this, true);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this, true);
    }

    onDisable() {
        this.node.targetOff(this);
    }

    private onTouchStart(e: EventTouch) {
        let touches = e.getAllTouches();
        if (touches.length < 2) {
            e.preventSwallow = true;
            return;
        }
        e.propagationStopped = true;
        this.touched = true;
        this.startDis = this.touchesDistance(touches);
        this.startScale = this.target.scale.x;
    }

    private onTouchMove(e: EventTouch) {
        if (!this.touched) {
            e.preventSwallow = true;
            return;
        }
        e.propagationStopped = true;
        let dis = this.touchesDistance(e.getAllTouches());
        let scale = math.clamp(this.startScale + (dis - this.startDis) / this.startDis, this.minScale, this.maxScale);
        if (scale == this.minScale || scale == this.maxScale) {
            this.startScale = scale;
            this.startDis = dis;
        }
        this.target.setScale(scale, scale);
    }

    private onTouchEnd(e: EventTouch) {
        e.preventSwallow = true;
        this.touched = false;
    }

    private touchesDistance(touches: Touch[]): number {
        return math.Vec2.distance(YJFitScreen.fitTouchPoint(touches[0]), YJFitScreen.fitTouchPoint(touches[1]));
    }
}
