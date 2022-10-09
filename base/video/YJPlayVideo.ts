
import { _decorator, Component, Node, VideoPlayer, EventHandler, js } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../../no';
const { ccclass, property, requireComponent, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJPlayVideo
 * DateTime = Sun Oct 09 2022 17:34:38 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPlayVideo.ts
 * FileBasenameNoExtension = YJPlayVideo
 * URL = db://assets/NoUi3/base/video/YJPlayVideo.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJPlayVideo')
@requireComponent(VideoPlayer)
@executeInEditMode()
export class YJPlayVideo extends Component {
    @property({ type: no.EventHandlerInfo, tooltip: '视频的元信息已加载完成，你可以调用 getDuration 来获取视频总时长' })
    onLoaded: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, tooltip: '视频准备好了，可以开始播放了' })
    onReady: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, tooltip: '视频正在播放中' })
    onPlaying: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, tooltip: '视频暂停播放' })
    onPaused: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, tooltip: '视频已经停止播放' })
    onStopped: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, tooltip: '视频播放完成' })
    onCompleted: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, tooltip: '处理视频时触发的错误' })
    onError: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, tooltip: '视频被用户点击了。（只支持 Web 平台）' })
    onClicked: no.EventHandlerInfo[] = [];

    onLoad() {
        if (EDITOR) {
            let a = new EventHandler();
            a.target = this.node;
            a._componentId = js._getClassId(YJPlayVideo);
            a.handler = 'onEvent';
            this.getComponent(VideoPlayer).videoPlayerEvent = [a];
        }
    }

    private onEvent(player: VideoPlayer, type: string, customEventData: string) {
        let handler: no.EventHandlerInfo[];
        switch (type) {
            case VideoPlayer.EventType.META_LOADED:
                handler = this.onLoaded;
                break;
            case VideoPlayer.EventType.READY_TO_PLAY:
                handler = this.onReady;
                break;
            case VideoPlayer.EventType.PLAYING:
                handler = this.onPlaying;
                break;
            case VideoPlayer.EventType.PAUSED:
                handler = this.onPaused;
                break;
            case VideoPlayer.EventType.STOPPED:
                handler = this.onStopped;
                break;
            case VideoPlayer.EventType.COMPLETED:
                handler = this.onCompleted;
                break;
            case VideoPlayer.EventType.ERROR:
                handler = this.onError;
                break;
            case VideoPlayer.EventType.CLICKED:
                handler = this.onClicked;
                break;
        }
        no.EventHandlerInfo.execute(handler, player, customEventData);
    }

    public a_play() {
        this.getComponent(VideoPlayer).play();
    }

    public a_pause() {
        this.getComponent(VideoPlayer).pause();
    }

    public a_stop() {
        this.getComponent(VideoPlayer).stop();
    }

    public a_mute() {
        this.getComponent(VideoPlayer).mute = !this.getComponent(VideoPlayer).mute;
    }

    public a_loop() {
        this.getComponent(VideoPlayer).loop = !this.getComponent(VideoPlayer).loop;
    }

    public a_rate(v: number) {
        this.getComponent(VideoPlayer).playbackRate = v;
    }

    public a_volume(v: number) {
        this.getComponent(VideoPlayer).volume = v;
    }

}
