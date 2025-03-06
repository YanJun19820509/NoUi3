import { no } from 'NoUi3/no';
import { ccclass, Component, EventTouch, property, Size, sys, v2, Vec2, view } from 'NoUi3/yj';
import { YJMoveHandleDelegate } from './YJMoveHandleDelegate';

@ccclass('YJMoveHandle')
/**
 * 移动手柄组件
 * 用于处理触摸移动事件,计算移动方向和状态
 */
export class YJMoveHandle extends Component {
    @property({ type: YJMoveHandleDelegate, displayName: '代理组件', tooltip: '移动事件回调组件，需要实现moveHandleEvent方法' })
    delegate: YJMoveHandleDelegate = null;
    @property({ displayName: '点击移动' })
    clickMove: boolean = false;

    /** 触摸开始时的坐标 */
    private startTouchPos: Vec2;
    /** 移动方向,包含角度和弧度 */
    private _dir: { angle: number, radian: number };
    /** 是否正在移动 */
    private _isMoving: boolean = false;

    private _touchTime: number = 0;

    private _viewSize: Size;

    /**
     * 触摸开始回调
     * @param e 触摸事件对象
     */
    public onStart(e: EventTouch) {
        if (!this._viewSize) {
            this._viewSize = view.getVisibleSize();
        }
        this.startTouchPos = this.touchUILocationAR(e);
        this._touchTime = sys.now();
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
        this._isMoving = false;
        const pos = this.touchUILocationAR(e);
        console.log(sys.now() - this._touchTime)
        if (this.clickMove && sys.now() - this._touchTime < 150) {
            const dir = no.angleTo(v2(0, 0), pos);
            this.delegate?.moveHandleEvent({ type: 'moveto', pos, dir });
        } else {
            //与第一次点击坐标的夹角
            this.delegate?.moveHandleEvent({ type: 'stop' });
        }
    }

    /**
     * 获取触摸点在UI坐标系下的位置
     * @param e 触摸事件对象
     * @returns UI坐标系下的位置
     */
    private touchUILocationAR(e: EventTouch): Vec2 {
        const p = e.getUILocation();
        return v2(p.x - this._viewSize.width / 2, p.y - this._viewSize.height / 2);
    }

    /**
     * 每帧更新
     * @param dt 帧间隔时间
     */
    update(dt: number) {
        if (this._isMoving) {
            this.delegate?.moveHandleEvent({ type: 'moveby', dir: this._dir, dt });
        }
    }
}


