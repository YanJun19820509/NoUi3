
import { _decorator, Component, Node, ParticleSystem, ParticleSystem2D } from './yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { EDITOR } from 'cc/env';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetPlayParticle
 * DateTime = Mon Jan 17 2022 12:03:10 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPlayParticle.ts
 * FileBasenameNoExtension = SetPlayParticle
 * URL = db://assets/Script/NoUi3/fuckui/SetPlayParticle.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetPlayParticle')
@menu('NoUi/ui/SetPlayParticle(粒子播放控制:bool)')
export class SetPlayParticle extends FuckUi {

    @property
    playOnEnable: boolean = false;

    @property({ type: no.EventHandlerInfo, displayName: '播放完回调' })
    endCalls: no.EventHandlerInfo[] = [];

    // private isParticleEnable: boolean = null;

    // onLoad(): void {
    //     super.onLoad();
    //     if (!EDITOR) {
    //         let p = this.getComponent(ParticleSystem2D) || this.getComponent(ParticleSystem);
    //         this.isParticleEnable = p.enabled;
    //     }
    // }

    onEnable() {
        this.playOnEnable && this._play();
    }

    protected onDataChange(data: any) {
        if (Boolean(data)) this._play();
        else this._stop();
    }

    private _play() {
        let p: ParticleSystem2D | ParticleSystem = this.getComponent(ParticleSystem2D);
        if (p) {
            p.resetSystem();
        } else {
            p = this.getComponent(ParticleSystem);
            p.play();
        }
        if (p.duration > -1) {
            this.scheduleOnce(this._onEnd, p.duration);
        }
    }

    private _stop() {
        let p: ParticleSystem2D | ParticleSystem = this.getComponent(ParticleSystem2D);
        if (p) {
            p.stopSystem();
        } else {
            p = this.getComponent(ParticleSystem);
            p.stop();
        }
        this.unschedule(this._onEnd);
    }

    private _onEnd() {
        no.EventHandlerInfo.execute(this.endCalls);
    }

    public a_play() {
        this._play();
    }

    //todo 对循环播放的考虑按需暂停
    // public setParticleEnable(v: boolean) {
    //     let p = this.getComponent(ParticleSystem2D) || this.getComponent(ParticleSystem);
    //     if (v) {
    //         p.enabled = this.isParticleEnable;
    //     } else {
    //         this.isParticleEnable = p.enabled;
    //         p.enabled = false;
    //     }
    // }
}
