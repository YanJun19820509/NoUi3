
import { _decorator, Component, AudioClip } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../../no';
const { ccclass, property, menu, executeInEditMode } = _decorator;

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
@executeInEditMode()
export class YJLoadAudioClip extends Component {
    @property({ type: AudioClip, editorOnly: true })
    clip: AudioClip = null;
    @property({ readonly: true })
    clipUrl: string = '';
    @property({ readonly: true })
    clipUuid: string = '';
    @property
    autoLoad: boolean = true;

    public loadedAudioClip: AudioClip;
    public loaded: boolean = false;

    onLoad() {
        if (EDITOR) return;
        this.clipUrl = this.clipUrl.replace('db://assets/', '');
        this.autoLoad && this.loadClip();
    }

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

    ////////////EDITOR MODE//////////////////////
    update() {
        if (EDITOR) {
            if (this.clip != null) {
                this.setClipUrl();
            }
        }
    }

    private async setClipUrl() {
        no.getAssetUrlInEditorMode(this.clip._uuid, url => {
            if (!url) return;
            this.clipUrl = url;
            this.clipUuid = this.clip._uuid;
            this.clip = null;
        });
    }
}
