
import { ccclass, property, requireComponent, executeInEditMode, Component, VideoPlayer } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJPlayVideo
 * DateTime = Sun Oct 09 2022 17:34:38 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPlayVideo.ts
 * FileBasenameNoExtension = YJPlayVideo
 * URL = db://assets/common/base/video/YJPlayVideo.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJPlayVideo')
@executeInEditMode()
/**
 * 视频播放组件
 * @desc 
 * - 封装Cocos VideoPlayer组件功能
 * - 提供完整的视频生命周期事件管理
 * - 支持自动资源释放和常用播放控制
 * 
 * @example
 * // 编辑器配置：
 * // 1. 将组件挂载到带有VideoPlayer的节点
 * // 2. 在属性检查器中配置各事件回调：
 * //   - 绑定节点上的其他组件方法
 * //   - 或通过代码动态绑定：videoComp.onLoaded.push(new no.EventHandlerInfo().setTarget(node).setHandler('onVideoLoaded'))
 * 
 * // 代码示例：
 * const videoComp = node.getComponent(YJPlayVideo);
 * videoComp.a_play();
 * videoComp.a_volume(0.5);
 */
export class YJPlayVideo extends Component {
    /** 播放完成后自动释放视频资源（避免内存泄漏） */
    @property({ tooltip: '播放完成后释放资源' })
    releaseOnCompleted: boolean = true;

    /** 元数据加载完成事件（可获取视频时长等信息） */
    @property({ type: no.EventHandlerInfo, tooltip: '视频的元信息已加载完成，你可以调用 getDuration 来获取视频总时长' })
    onLoaded: no.EventHandlerInfo[] = [];
    
    /** 视频准备就绪事件（可开始播放） */
    @property({ type: no.EventHandlerInfo, tooltip: '视频准备好了，可以开始播放了' })
    onReady: no.EventHandlerInfo[] = [];
    
    /** 播放中持续触发事件 */
    @property({ type: no.EventHandlerInfo, tooltip: '视频正在播放中' })
    onPlaying: no.EventHandlerInfo[] = [];
    
    /** 视频暂停事件 */
    @property({ type: no.EventHandlerInfo, tooltip: '视频暂停播放' })
    onPaused: no.EventHandlerInfo[] = [];
    
    /** 视频停止事件 */
    @property({ type: no.EventHandlerInfo, tooltip: '视频已经停止播放' })
    onStopped: no.EventHandlerInfo[] = [];
    
    /** 播放完成事件 */
    @property({ type: no.EventHandlerInfo, tooltip: '视频播放完成' })
    onCompleted: no.EventHandlerInfo[] = [];
    
    /** 错误处理事件 */
    @property({ type: no.EventHandlerInfo, tooltip: '处理视频时触发的错误' })
    onError: no.EventHandlerInfo[] = [];
    
    /** 视频点击事件（仅Web平台支持） */
    @property({ type: no.EventHandlerInfo, tooltip: '视频被用户点击了。（只支持 Web 平台）' })
    onClicked: no.EventHandlerInfo[] = [];

    /**
     * 事件绑定快捷方式
     * @desc 用于编辑器快速绑定点击事件的语法糖
     * @example
     * // 在编辑器中将bind属性打勾即可自动绑定点击事件
     */
    @property
    public get bind(): boolean {
        return false;
    }

    public set bind(v: boolean) {
        this.getComponent(VideoPlayer).videoPlayerEvent = [no.createClickEvent(this.node, YJPlayVideo, 'onEvent')];
    }

    /**
     * 统一事件处理中心
     * @param player 视频播放器实例
     * @param type 事件类型
     * @param customEventData 自定义事件数据
     * @desc 根据事件类型分发到对应的处理程序
     */
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
                this.releaseAsset();
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

    /** 开始播放视频 */
    public a_play() {
        this.getComponent(VideoPlayer).play();
    }

    /** 暂停视频播放 */
    public a_pause() {
        this.getComponent(VideoPlayer).pause();
    }

    /** 停止视频播放 */
    public a_stop() {
        this.getComponent(VideoPlayer).stop();
    }

    /** 切换静音状态 */
    public a_mute() {
        this.getComponent(VideoPlayer).mute = !this.getComponent(VideoPlayer).mute;
    }

    /** 切换循环播放模式 */
    public a_loop() {
        this.getComponent(VideoPlayer).loop = !this.getComponent(VideoPlayer).loop;
    }

    /**
     * 设置播放速率
     * @param v 播放速度（1.0为正常速度）
     * @example
     * // 设置2倍速播放
     * videoComp.a_rate(2.0);
     */
    public a_rate(v: number) {
        this.getComponent(VideoPlayer).playbackRate = v;
    }

    /**
     * 设置音量大小
     * @param v 音量值（0.0~1.0）
     */
    public a_volume(v: number) {
        this.getComponent(VideoPlayer).volume = v;
    }

    /**
     * 释放视频资源
     * @desc 根据releaseOnCompleted设置自动释放资源
     */
    private releaseAsset() {
        if (!this.releaseOnCompleted) return;
        no.assetBundleManager.release(this.getComponent(VideoPlayer).clip, true);
    }
}
