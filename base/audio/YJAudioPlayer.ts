
import { no } from '../../no';
import { ccclass, property, menu, Component, AudioClip } from '../../yj';
import { YJAudioManager } from './YJAudioManager';

/**
 * Predefined variables
 * Name = YJAudioPlayer
 * DateTime = Thu Feb 10 2022 15:50:17 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJAudioPlayer.ts
 * FileBasenameNoExtension = YJAudioPlayer
 * URL = db://assets/NoUi3/base/audio/YJAudioPlayer.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJAudioPlayer')
@menu('NoUi/audio/YJAudioPlayer(音频播放)')
/**
 * 音频播放组件,用于播放音频剪辑
 */
export class YJAudioPlayer extends Component {
    /**
     * 音频剪辑
     */
    @property({ type: AudioClip })
    public get clip(): AudioClip {
        return null;
    }

    /**
     * 设置音频剪辑,会自动获取音频文件的url和uuid
     */
    public set clip(v: AudioClip) {
        no.EditorMode.getAssetUrlByUuid(v.uuid).then(url => {
            if (!url) return;
            this.clipUrl = url;
            this.clipUuid = v.uuid;
        });
    }
    /**
     * 音频文件的url
     */
    @property({ readonly: true })
    clipUrl: string = '';
    /**
     * 音频文件的uuid
     */
    @property({ readonly: true })
    clipUuid: string = '';
    /**
     * 是否循环播放
     */
    @property({ displayName: '是否循环播放' })
    loop: boolean = true;
    /**
     * 是否自动播放
     */
    @property({ displayName: '是否自动播放' })
    autoPlay: boolean = true;

    /**
     * 组件加载时如果设置了自动播放则播放音频
     */
    onLoad() {
        this.autoPlay && this.a_play();
    }

    /**
     * 播放音频
     * 如果loop为false则播放音效,否则播放背景音乐
     */
    public async a_play() {
        const b = YJAudioManager.ins;
        if (!this.loop) {
            b.playEffect(this.clipUrl);
        } else {
            b.playBGM(this.clipUrl);
        }
    }

    /**
     * 停止播放背景音乐
     */
    public a_stop() {
        YJAudioManager.ins.stopBGM();
    }
}
