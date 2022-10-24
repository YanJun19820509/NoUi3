
import { _decorator, Component, Node, v3, Vec2, Vec3, math } from 'cc';
import { FuckUi } from './FuckUi';
import { YJMoveAlongWithPathDelegate } from './YJMoveAlongWithPathDelegate';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetMoveAlongWithPath
 * DateTime = Mon Jan 17 2022 11:49:21 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetMoveAlongWithPath.ts
 * FileBasenameNoExtension = SetMoveAlongWithPath
 * URL = db://assets/Script/NoUi3/fuckui/SetMoveAlongWithPath.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
/**
* 沿路线移动的代理
*/
@ccclass('SetMoveAlongWithPath')
@menu('NoUi/ui/SetMoveAlongWithPath(设置沿路线移动:{speed:number, paths:[Vec2]})')
export class SetMoveAlongWithPath extends FuckUi {

    @property({ displayName: '是否循环' })
    circular: boolean = false;

    @property(YJMoveAlongWithPathDelegate)
    delegate: YJMoveAlongWithPathDelegate = null;

    private paths: Vec2[];
    public speed: number;
    private originSpeed: number;
    private step: number;
    private paused: boolean = false;
    private moveDuration: number = 0;//移动耗时
    private moveVector: Vec3;//移动时向量速度
    public speedChanged: boolean = false;

    protected onDataChange(data: any) {
        if (data.speed != null) {
            this.speed = data.speed;
            this.originSpeed = data.speed;
        }
        if (data.paths != null) {
            let pks = Object.keys(data.paths);
            //如果有多条路径则随机选择一条
            this.paths = data.paths[pks[Math.floor(Math.random() * pks.length)]] as Vec2[];
            this.startMove();
        }
    }

    private aa = 0;
    private move(): void {
        let p1 = this.node.position,
            p = this.paths[this.step];
        if (this.aa == 0 && this.step == 1) this.aa++;
        else if (this.aa > 0 && this.step == 1) {
            console.error(this.uuid, this.step);
        }
        if (p == null) {
            this.delegate?.onEnd();
            if (this.circular) {
                this.scheduleOnce(() => {
                    this.startMove();
                }, 1);
            }
            return;
        }
        if (this.delegate?.onSpecialStep(p)) return;
        let p2 = v3(p.x, p.y);
        this.moveDuration = Vec3.distance(p1, p2) / this.speed;
        this.moveVector = p2.subtract(p1).divide3f(this.moveDuration, this.moveDuration, this.moveDuration);
        this.delegate?.onChangeDirection(p1, p2);
    }

    private startMove() {
        this.paused = false;
        this.node.position = v3(this.paths[0].x, this.paths[0].y);
        this.step = 1;
        this.move();
        this.paths[1] != null && this.delegate?.onStart(this);
    }

    public a_pauseMove(): void {
        this.paused = true;
        this.delegate?.onPause();
    }

    public a_resumeMove(): void {
        this.paused = false;
        this.delegate?.onResume();
    }

    /**
     * 一段时间内改变速度
     * @param sub 速度增量
     * @param duration 时长
     */
    public a_changeSpeedForDuration(sub: number, duration: number) {
        if (this.speedChanged) {
            this.speedChangeDuration = duration;
            return;
        }
        this.speedChanged = true;
        let s = sub;
        this.speed = this.originSpeed * s;
        if (this.moveDuration > 0) {
            this.moveDuration *= 1 / s;
            this.moveVector.multiplyScalar(s);
        }
        this.speedChangeDuration = duration;
        this.speedChangeScale = s;
    }

    private speedChangeDuration: number = 0;
    private speedChangeScale: number;
    private checkSpeedChangeEnd(dt: number) {
        if (!this.speedChanged) return;
        if (this.speedChangeDuration > 0) {
            this.speedChangeDuration -= dt;
            return;
        }
        this.speed = this.originSpeed;
        if (this.moveDuration > 0) {
            this.moveDuration *= this.speedChangeScale;
            this.moveVector.multiplyScalar(1 / this.speedChangeScale);
        }
        this.speedChanged = false;
    }

    update(dt: number) {
        this.checkSpeedChangeEnd(dt);
        if (this.paused || this.moveDuration <= 0) return;
        this.node.position = this.node.position.clone().add(this.moveVector.clone().multiplyScalar(dt));
        this.delegate?.onMoving(this);
        this.moveDuration -= dt;
        if (this.moveDuration <= 0) {
            this.delegate?.onReach(this.paths[this.step]);
            this.step++;
            this.move();
        }
    }

    public a_clear() {
        this.moveDuration = 0;
        this.moveVector = null;
        this.speedChanged = false;
        this.paths = [];
        this.aa = 0;
    }

    public a_toNextStep() {
        this.step++;
    }
}