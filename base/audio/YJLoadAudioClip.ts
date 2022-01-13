
import { _decorator, Component, AudioClip } from 'cc';
import { no } from '../../no';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJLoadAudioClip
 * DateTime = Tue Jan 11 2022 22:24:40 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJLoadAudioClip.ts
 * FileBasenameNoExtension = YJLoadAudioClip
 * URL = db://assets/Script/NoUi3/base/audio/YJLoadAudioClip.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJLoadAudioClip')
@menu('NoUi/audio/YJLoadAudioClip(动态加载音频剪辑)')
export class YJLoadAudioClip extends Component {
    @property
    clipUrl: string = '';
    @property
    autoLoad: boolean = true;

    public loadedAudioClip: AudioClip;
    public loaded: boolean = false;

    public async loadClip(): Promise<AudioClip> {
        if (this.loadedAudioClip != null) return this.loadedAudioClip;
        return new Promise<AudioClip>(resolve => {
            no.assetBundleManager.loadAudio(this.clipUrl, (a) => {
                if (a == null) resolve(null);
                else {
                    this.loadedAudioClip = a;
                    this.loaded = true;
                    resolve(this.loadedAudioClip);
                }
            });
        });
    }
}
