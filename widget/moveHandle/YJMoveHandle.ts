import { no } from '../../no';
import { ccclass, Component, EventTouch, property, Size, sys, v2, Vec2, view } from '../../yj';
import { YJHandShank } from '../handShank/YJHandShank';
import { YJMoveHandleDelegate } from './YJMoveHandleDelegate';

@ccclass('YJMoveHandle')
/**
 * 移动手柄组件
 * 用于处理触摸移动事件,计算移动方向和状态
 * @example
 * // 基础使用示例：
 * // 1. 将组件挂载到操作区域节点
 * // 2. 创建实现YJMoveHandleDelegate接口的代理组件
 * // 3. 在代理组件中处理移动事件：
 * 
 * class PlayerController implements YJMoveHandleDelegate {
 *     moveHandleEvent(event: { 
 *         type: 'moveto' | 'moveby' | 'stop',
 *         pos?: Vec2,      // 目标位置（相对屏幕中心坐标）
 *         dir?: { angle: number, radian: number }, // 移动方向
 *         dt?: number      // 帧时间间隔
 *     }) {
 *         switch(event.type) {
 *             case 'moveto': // 点击移动
 *                 cc.log(`移动到:${event.pos} 方向:${event.dir.angle}度`);
 *                 break;
 *             case 'moveby': // 持续移动
 *                 const speed = 200;
 *                 const dx = Math.cos(event.dir.radian) * speed * event.dt;
 *                 const dy = Math.sin(event.dir.radian) * speed * event.dt;
 *                 this.node.x += dx;
 *                 this.node.y += dy;
 *                 break;
 *             case 'stop':   // 停止移动
 *                 cc.log('停止移动');
 *                 break;
 *         }
 *     }
 * }
 */
export class YJMoveHandle extends Component {
    /** 事件代理组件（需实现移动事件处理方法） */
    @property({ type: YJMoveHandleDelegate, displayName: '代理组件', tooltip: '移动事件回调组件，需要实现moveHandleEvent方法\n示例见类注释' })
    delegate: YJMoveHandleDelegate = null;

    /**
     * 手柄
     */
    @property({ type: YJHandShank, displayName: '手柄' })
    handShank: YJHandShank = null;

    /** 是否启用点击移动（短按150ms内松开触发moveto事件） */
    @property({ displayName: '点击移动', tooltip: '启用后短时间点击会触发moveto类型事件' })
    clickMove: boolean = false;

    /** 触摸起点坐标（相对屏幕中心坐标系） */
    private startTouchPos: Vec2;
    /** 移动方向数据（包含角度和弧度两种表示方式） */
    private _dir: { angle: number, radian: number };
    /** 移动状态标记（true表示正在持续移动） */
    private _isMoving: boolean = false;
    /** 触摸开始时间戳（用于计算点击时长） */
    private _touchTime: number = 0;
    /** 屏幕可视区域尺寸缓存 */
    private _viewSize: Size;

    private _tempVec: Vec2 = new Vec2();

    /**
     * 触摸开始事件处理
     * @param e 触摸事件对象
     * @description 初始化触摸起点坐标和时间戳
     */
    public onStart(e: EventTouch) {
        if (!this._viewSize) {
            this._viewSize = view.getVisibleSize();
        }
        this.startTouchPos = this.touchUILocationAR(e).clone();
        this._touchTime = sys.now();
        this.handShank?.onStart(this.startTouchPos);
    }

    /**
     * 触摸移动事件处理
     * @param e 触摸事件对象
     * @description 计算当前触摸点与起点的方向角度，更新移动状态
     */
    public onMove(e: EventTouch) {
        const pos = this.touchUILocationAR(e);
        // 计算当前触摸点相对于起点的方向（角度和弧度）
        this._dir = no.angleTo(this.startTouchPos, pos);
        this._isMoving = true;
        this.handShank?.onMove(this._dir.radian);
    }

    /**
     * 触摸结束事件处理
     * @param e 触摸事件对象
     * @description 根据触摸时长决定触发moveto或stop事件
     */
    public onEnd(e: EventTouch) {
        this._isMoving = false;
        const pos = this.touchUILocationAR(e);

        // 短按判定（150ms内松开）
        if (this.clickMove && sys.now() - this._touchTime < 150) {
            // 计算相对于屏幕中心的方向
            const dir = no.angleTo(v2(0, 0), pos);
            this.delegate?.moveHandleEvent({ type: 'moveto', pos, dir });
        } else {
            // 触发停止事件并传递最终方向
            this.delegate?.moveHandleEvent({ type: 'stop' });
        }
        this.handShank?.onStop();
    }

    /**
     * 转换触摸点到相对坐标
     * @param e 触摸事件对象
     * @returns 基于屏幕中心的坐标系位置
     * @description 将原始UI坐标转换为以屏幕中心为原点的坐标系：
     * - 屏幕左下角：(-width/2, -height/2)
     * - 屏幕中心：(0, 0)
     * - 屏幕右上角：(width/2, height/2)
     */
    private touchUILocationAR(e: EventTouch): Vec2 {
        const p = e.getUILocation();
        this._tempVec.set(p.x - this._viewSize.width / 2, p.y - this._viewSize.height / 2);
        return this._tempVec;
    }

    /**
     * 帧更新处理
     * @param dt 帧间隔时间（单位：秒）
     * @description 持续移动时每帧发送moveby事件，传递方向和时间差
     */
    update(dt: number) {
        if (this._isMoving) {
            this.delegate?.moveHandleEvent({ type: 'moveby', dir: this._dir, dt });
        }
    }
}


