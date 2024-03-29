
import { _decorator, Component, Node } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../../no';
import { YJAudioManager } from './YJAudioManager';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJSoundEffectManager
 * DateTime = Thu Apr 28 2022 09:23:03 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSoundEffectManager.ts
 * FileBasenameNoExtension = YJSoundEffectManager
 * URL = db://assets/NoUi3/base/audio/YJSoundEffectManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SoundEffectInfo')
export class SoundEffectInfo {
    @property({ displayName: '别名' })
    alias: string = '';
    @property({ readonly: true })
    assetUrl: string = '';
    @property({ readonly: true })
    assetUuid: string = '';
}

@ccclass('YJSoundEffectManager')
@executeInEditMode()
export class YJSoundEffectManager extends Component {
    @property({ displayName: '音效目录', editorOnly: true })
    folder: string = '';
    @property({ displayName: '开始解析' })
    isParse: boolean = false;
    @property(SoundEffectInfo)
    soundEffects: SoundEffectInfo[] = [];

    @property({ displayName: '通用点击音效', tooltip: '音效资源别名' })
    clickAtlas: string = '';

    @property({ displayName: '通用界面打开音效', tooltip: '音效资源别名' })
    openAtlas: string = '';

    @property({ displayName: '通用关闭打开音效', tooltip: '音效资源别名' })
    closeAtlas: string = '';

    private _map: any;

    private static _ins: YJSoundEffectManager;

    public static get ins(): YJSoundEffectManager {
        return this._ins;
    }

    onLoad() {
        YJSoundEffectManager._ins = this;
        if (EDITOR) return;
        this._map = {};
        this.soundEffects.forEach(info => {
            if (info.alias) this._map[info.alias] = info.assetUrl.replace('db://assets/', '');
        });
    }

    onDestroy() {
        YJSoundEffectManager._ins = null;
    }

    public playMusicByAlias(alias: string): void {
        let url = this._map[alias];
        if (url) YJAudioManager.ins.playBGM(url);
    }


    /**
     * 根据别名播放音效
     * @param alias 
     */
    public playEffectByAlias(alias: string): void {
        let url = this._map[alias];
        if (url) YJAudioManager.ins.playEffect(url);
    }

    /**
     * 播放通用界面打开音效
     */
    public playClickSoundEffect(): void {
        if (this.clickAtlas) this.playEffectByAlias(this.clickAtlas);
    }

    /**
     * 播放通用点击音效
     */
    public playOpenSoundEffect(): void {
        if (this.openAtlas) this.playEffectByAlias(this.openAtlas);
    }

    /**
     * 播放通用关闭打开音效
     */
    public playCloseSoundEffect(): void {
        if (this.closeAtlas) this.playEffectByAlias(this.closeAtlas);
    }


    //////////EDITOR//////////
    update() {
        if (!EDITOR) return;
        if (this.isParse) {
            this.isParse = false;
            this.parse();
        }
    }

    private async parse() {
        if (!EDITOR || !this.folder) return;
        console.log(this.folder);
        no.assetBundleManager.loadAssetInfosInEditorModeUnderFolder(this.folder, 'cc.AudioClip', infos => {
            console.log(infos);
            if (!infos.length) {
                return;
            }
            infos.forEach(info => {
                let effectInfo = new SoundEffectInfo();
                let name = info.name.split('.')[0];
                effectInfo.alias = name;
                effectInfo.assetUrl = info.url;
                effectInfo.assetUuid = info.uuid;
                let i = no.indexOfArray(this.soundEffects, effectInfo, 'assetUuid');
                if (i > -1) {
                    effectInfo.alias = this.soundEffects[i].alias;
                    this.soundEffects.splice(i, 1, effectInfo);
                } else this.soundEffects[this.soundEffects.length] = effectInfo;
            });
            console.log('YJSoundEffectManager解析完成，请刷新组件！')
        });
    }
}
