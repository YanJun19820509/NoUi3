
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

    @property({ type: no.EventHandlerInfo, displayName: '播放开始前的回调' })
    beforeStartHandlers: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo, displayName: '播放完成后的回调' })
    afterEndHandlers: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo, displayName: '帧事件触发的回调' })
    eventHandlers: no.EventHandlerInfo[] = [];

    onEnable() {
        if (this.playOnNodeActive) {
            this.play();
        }
    }

    private play() {
        let ani = this.getComponent(Animation);
        ani.on(Animation.EventType.PLAY, this.onPlay, this);
        ani.on(Animation.EventType.FINISHED, this.onFinished, this);
        ani.play(ani.clips[0].name);
    }

    private onPlay() {
        no.EventHandlerInfo.execute(this.beforeStartHandlers);
    }

    private onFinished() {
        no.EventHandlerInfo.execute(this.afterEndHandlers);
    }

    public onFrameEvent(v: any): void {
        no.EventHandlerInfo.execute(this.eventHandlers, v);
    }
}
