
import { _decorator, Component, Node, Animation } from 'cc';
import { no } from '../../no';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = YJPlayAnimation
 * DateTime = Thu Aug 11 2022 12:14:03 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPlayAnimation.ts
 * FileBasenameNoExtension = YJPlayAnimation
 * URL = db://assets/NoUi3/base/ani/YJPlayAnimation.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJPlayAnimation')
@requireComponent(Animation)
export class YJPlayAnimation extends Component {
    @property
    playOnNodeActive: boolean = false;
    @property({ visible() { return this.playOnNodeActive; } })
    playOnce: boolean = false;

    @property({ displayName: '播放完成后回到第0帧' })
    backOnEnd: boolean = false;

    @property({ type: no.EventHandlerInfo, displayName: '播放开始前的回调' })
    beforeStartHandlers: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo, displayName: '播放完成后的回调' })
    afterEndHandlers: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo, displayName: '帧事件触发的回调' })
    eventHandlers: no.EventHandlerInfo[] = [];

    private _played: boolean = false;

    onEnable() {
        if (this.playOnNodeActive) {
            if (!this.playOnce || (this.playOnce && !this._played)) {
                this._played = true;
                this.play();
            }
        }
    }

    public play() {
        let ani = this.getComponent(Animation);
        ani.on(Animation.EventType.PLAY, this.onPlay, this);
        ani.on(Animation.EventType.FINISHED, this.onFinished, this);
        ani.play(ani.clips[0].name);
    }

    public stop() {
        this.getComponent(Animation)?.stop();
        this.backTo0();
    }

    public setTime(t: number) {
        let ani = this?.getComponent(Animation);
        let state = ani?.getState(ani.defaultClip.name);
        state?.setTime(t);
        state?.sample();
    }

    public backTo0() {
        this.setTime(0);
    }

    private onPlay() {
        no.EventHandlerInfo.execute(this.beforeStartHandlers);
    }

    private onFinished() {
        if (this.backOnEnd) this.backTo0();
        no.EventHandlerInfo.execute(this.afterEndHandlers);
        console.log('Animation onFinished', this.getComponent(Animation).clips[0].name);
    }

    public onFrameEvent(v: any): void {
        no.EventHandlerInfo.execute(this.eventHandlers, v);
        console.log('Animation onFrameEvent', this.getComponent(Animation).clips[0].name);
    }
}
