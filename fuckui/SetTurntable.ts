
import { _decorator, Component, Node, game } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = SetTurntable
 * DateTime = Tue Jan 31 2023 09:25:03 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetTurntable.ts
 * FileBasenameNoExtension = SetTurntable
 * URL = db://assets/NoUi3/fuckui/SetTurntable.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 转盘旋转
 * data: number--最终转盘角度angle
 */
@ccclass('SetTurntable')
@executeInEditMode()
export class SetTurntable extends FuckUi {
    @property({ displayName: '转盘节点' })
    turntable: Node = null;
    @property({ displayName: '转速(圈/秒)', min: 1 })
    speed: number = 1;
    @property({ displayName: '转动时长(秒)', min: 0 })
    duration: number = 0;
    @property({ displayName: '减速角度', min: 0, tooltip: '剩余多少角度时开始减速' })
    slowAngle: number = 0;
    @property({ type: no.EventHandlerInfo, displayName: '转动结束回调' })
    endCall: no.EventHandlerInfo[] = [];

    private quickAnglePerSecond: number;
    private slowAnglePerSecond: number;
    private turnningAngle: number = 0;

    onLoad() {
        super.onLoad();
        if (EDITOR) {
            if (!this.turntable) this.turntable = this.node;
        } else {
            this.quickAnglePerSecond = 360 * this.speed;
            this.slowAnglePerSecond = this.quickAnglePerSecond / 3;
        }
    }

    protected onDataChange(data: any) {
        if (!this.turntable?.isValid) return;
        this.setTurnning(Number(data));
    }

    private setTurnning(stopAngle: number) {
        this.turnningAngle = stopAngle - this.turntable.angle + this.speed * this.duration * 360;
    }

    update(dt: number) {
        if (EDITOR) return;
        if (this.turnningAngle <= 0) return;
        let a: number = 0;
        if (this.turnningAngle > this.slowAngle) {
            a = this.quickAnglePerSecond * dt;
        } else {
            a = this.slowAnglePerSecond * dt;
        }
        this.turntable.angle = (this.turntable.angle + a) % 360;
        this.turnningAngle -= a;
    }
}
