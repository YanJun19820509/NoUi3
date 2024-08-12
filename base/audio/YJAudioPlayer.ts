
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
export class YJAudioPlayer extends Component {
    @property({ type: AudioClip })
    public get clip(): AudioClip {
        return null;
    }

    public set clip(v: AudioClip) {
        no.EditorMode.getAssetUrlByUuid(v.uuid).then(url => {
            if (!url) return;
            this.clipUrl = url;
            this.clipUuid = v.uuid;
        });
    }
    @property({ readonly: true })
    clipUrl: string = '';
    @property({ readonly: true })
    clipUuid: string = '';
    @property({ displayName: '是否循环播放' })
    loop: boolean = true;
    @property({ displayName: '是否自动播放' })
    autoPlay: boolean = true;

    onLoad() {
        this.autoPlay && this.a_play();
    }

    public async a_play() {
        const b = YJAudioManager.ins;
        if (!this.loop) {
            b.playEffect(this.clipUrl);
        } else {
            b.playBGM(this.clipUrl);
        }
    }

    public a_stop() {
        YJAudioManager.ins.stopBGM();
    }
}
