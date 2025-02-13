import { no } from 'NoUi3/no';
import { ccclass, Component, EventTouch, property, Vec2 } from 'NoUi3/yj';

@ccclass('YJMoveHandle')
/**
 * 移动手柄组件
 * 用于处理触摸移动事件,计算移动方向和状态
 */
export class YJMoveHandle extends Component {
    /** 移动事件回调数组 */
    @property({ type: no.EventHandlerInfo, displayName: '移动事件' })
    moveHandlers: no.EventHandlerInfo[] = [];

    /** 触摸开始时的坐标 */
    private startTouchPos: Vec2;
    /** 移动方向,包含角度和弧度 */
    private _dir: { angle: number, radian: number };
    /** 是否正在移动 */
    private _isMoving: boolean = false;

    /**
     * 触摸开始回调
     * @param e 触摸事件对象
     */
    public onStart(e: EventTouch) {
        this.startTouchPos = this.touchUILocationAR(e);
    }

    /**
     * 触摸移动回调
     * @param e 触摸事件对象
     */
    public onMove(e: EventTouch) {
        const pos = this.touchUILocationAR(e);
        //与第一次点击坐标的夹角
        this._dir = no.angleTo(this.startTouchPos, pos);
        this._isMoving = true;
    }

    /**
     * 触摸结束回调
     * @param e 触摸事件对象
     */
    public onEnd(e: EventTouch) {
        const pos = this.touchUILocationAR(e);
        //与第一次点击坐标的夹角
        this._dir = no.angleTo(this.startTouchPos, pos);
        this._isMoving = false;
        no.EventHandlerInfo.execute(this.moveHandlers, { type: 'stop' });
    }

    /**
     * 获取触摸点在UI坐标系下的位置
     * @param e 触摸事件对象
     * @returns UI坐标系下的位置
     */
    private touchUILocationAR(e: EventTouch): Vec2 {
        return e.getUILocation();
    }

    /**
     * 每帧更新
     * @param dt 帧间隔时间
     */
    update(dt: number) {
        if (this._isMoving) {
            no.EventHandlerInfo.execute(this.moveHandlers, { type: 'move', dir: this._dir, dt });
        }
    }
}


