import { YJAudioManager } from 'NoUi3/base/audio/YJAudioManager';
import { LayerType } from 'NoUi3/base/node/LayerType';
import { YJPanel } from 'NoUi3/base/node/YJPanel';
import { YJWindowManager } from 'NoUi3/base/node/YJWindowManager';
import { no } from 'NoUi3/no';
import { addPanelTo, panelPrefabPath } from 'NoUi3/types';
import { ccclass, Node, property, type, VideoClip, VideoPlayer } from 'NoUi3/yj';

/**
 * 
 * Author mqsy_yj
 * DateTime Tue Mar 18 2025 10:20:48 GMT+0800 (中国标准时间)
 * 视频播放弹窗
 */

@ccclass('YJVideoPlayer')
@addPanelTo(LayerType.Popup)
@panelPrefabPath('db://assets/GameAUG/NoUi3/widget/video_player/video_player.prefab')
export class YJVideoPlayer extends YJPanel {
    @type(VideoPlayer)
    videoPlayer: VideoPlayer = null;
    public static show(path: string, loop: boolean = true) {
        YJWindowManager.createPanel<YJVideoPlayer>(YJVideoPlayer, LayerType.Popup, null, panel => panel.setInfo(path, loop));
    }

    onDestroy(): void {
        for (const path in this._videos) {
            this._videos[path]?.decRef();
        }
        this._videos = {};
    }

    protected onClosePanel(): void {
        this.videoPlayer.stop();
    }


    private _videos: { [k: string]: VideoClip } = {};
    public setInfo(path: string, loop: boolean = true) {
        const player = this.videoPlayer;
        if (!player) {
            console.error('YJVideoPlayer: videoPlayer is null');
            this.closePanel();
            return;
        }
        player.mute = !YJAudioManager.ins.isBGMOn;
        if (this._videos[path]) {
            player.clip = this._videos[path];
            player.loop = loop;
            player.play();
            return;
        }
        no.assetBundleManager.loadVideo(path, (video) => {
            this._videos[path] = video;
            player.clip = video;
            player.loop = loop;
            player.play();
        });
    }
}