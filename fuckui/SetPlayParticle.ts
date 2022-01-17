
import { _decorator, Component, Node, ParticleSystem } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
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

    @property({ type: no.EventHandlerInfo, displayName: '播放完回调' })
    endCalls: no.EventHandlerInfo[] = [];

    protected onDataChange(data: any) {
        if (Boolean(data)) this._play();
        else this._stop();
    }

    private _play() {
        let p = this.getComponent(ParticleSystem);
        p.play();
        if (p.duration > -1) {
            this.scheduleOnce(this._onEnd, p.duration);
        }
    }

    private _stop() {
        this.getComponent(ParticleSystem).stop();
        this.unschedule(this._onEnd);
    }

    private _onEnd() {
        no.EventHandlerInfo.execute(this.endCalls);
    }
}
