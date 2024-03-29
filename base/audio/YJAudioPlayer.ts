
import { _decorator, Component, Node } from 'cc';
import { YJAudioManager } from './YJAudioManager';
import { YJLoadAudioClip } from './YJLoadAudioClip';
const { ccclass, property, menu, requireComponent } = _decorator;

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
@requireComponent(YJLoadAudioClip)
@menu('NoUi/audio/YJAudioPlayer(音频播放)')
export class YJAudioPlayer extends Component {

    @property
    once: boolean = false;
    @property
    autoPlay: boolean = true;

    onLoad() {
        this.autoPlay && this.a_play();
    }

    public async a_play() {
        let a = this.getComponent(YJLoadAudioClip);
        let clip = await a.loadClip();
        if (!this?.node?.isValid) return;
        let b = YJAudioManager.ins;
        b.setClip(a.clipUrl, clip);
        if (this.once) YJAudioManager.ins.playClip(clip, false);
        else YJAudioManager.ins.playBGM(a.clipUrl);
    }

    public a_stop() {
        YJAudioManager.ins.stopBGM();
    }
}
