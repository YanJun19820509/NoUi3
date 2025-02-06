
import { Component, Animation, AnimationClip, ccclass, property, requireComponent, WrapMode } from '../../yj';
import { no } from '../../no';

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

    /**
     * 播放动画
     * @param wrapMode 动画播放模式
     */
    public play(wrapMode?: WrapMode) {
        let ani = this.getComponent(Animation);
        if (ani.clips.length == 0) return;
        ani.on(Animation.EventType.PLAY, this.onPlay, this);
        ani.on(Animation.EventType.FINISHED, this.onFinished, this);
        let state = ani.getState(ani.clips[0].name);
        if (!state) {
            this.scheduleOnce(() => {
                this.play(wrapMode);
            });
            return;
        }
        if (wrapMode != undefined)
            state.wrapMode = wrapMode;
        state.play();
    }

    /**
     * 停止动画播放并回到第0帧
     */
    public stop() {
        let ani = this?.getComponent(Animation);
        ani?.getState(ani?.clips[0]?.name)?.stop();
        this.backTo0();
    }

    /**
     * 设置动画播放时间
     * @param t 时间(秒)
     */
    public setTime(t: number) {
        let ani = this?.getComponent(Animation);
        let state = ani?.getState(ani.defaultClip.name);
        state?.setTime(t);
        state?.sample();
    }

    /**
     * 回到动画第0帧
     */
    public backTo0() {
        this.setTime(0);
    }

    /**
     * 正常播放一次
     */
    public normalPlay() {
        this.play(AnimationClip.WrapMode.Normal);
    }

    /**
     * 循环播放
     */
    public loopPlay() {
        this.play(AnimationClip.WrapMode.Loop);
    }

    /**
     * 循环反向播放
     */
    public loopReversePlay() {
        this.play(AnimationClip.WrapMode.LoopReverse);
    }

    /**
     * 来回循环播放
     */
    public pingPongPlay() {
        this.play(AnimationClip.WrapMode.PingPong);
    }

    /**
     * 来回循环反向播放
     */
    public pingPongReversePlay() {
        this.play(AnimationClip.WrapMode.PingPongReverse);
    }

    /**
     * 反向播放一次
     */
    public reversePlay() {
        this.play(AnimationClip.WrapMode.Reverse);
    }

    /**
     * 动画开始播放时的回调
     */
    private onPlay() {
        no.EventHandlerInfo.execute(this.beforeStartHandlers);
    }

    /**
     * 动画播放完成时的回调
     */
    private onFinished() {
        if (this.backOnEnd) this.backTo0();
        no.EventHandlerInfo.execute(this.afterEndHandlers);
    }

    /**
     * 动画帧事件回调
     * @param v 帧事件参数
     */
    public onFrameEvent(v: any): void {
        no.EventHandlerInfo.execute(this.eventHandlers, v);
    }
}
