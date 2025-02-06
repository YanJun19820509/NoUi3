
import { EDITOR, ccclass, property, Component } from '../../yj';
import { no } from '../../no';
import { YJAudioManager } from './YJAudioManager';

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
    @property({ displayName: '别名', tooltip: '默认为文件名，可自定义，播放时指定别名即可，不用关心实际播放的是哪个文件' })
    alias: string = '';
    @property({ readonly: true })
    assetUrl: string = '';
    @property({ readonly: true })
    assetUuid: string = '';
}

@ccclass('YJSoundEffectManager')
/**
 * 音效管理类,用于管理游戏中的音效播放
 */
export class YJSoundEffectManager extends Component {
    /**
     * 编辑器属性,用于解析项目中的音频资源
     */
    @property({ displayName: '开始解析' })
    public get parse(): boolean {
        return false;
    }

    /**
     * 解析项目中的音频资源,生成音效信息列表
     */
    public set parse(v: boolean) {
        no.EditorMode.getAssetInfosByCCType('cc.AudioClip').then(infos => {
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
        });
    }

    /** 音效信息列表 */
    @property(SoundEffectInfo)
    soundEffects: SoundEffectInfo[] = [];

    /** 通用点击音效的别名 */
    @property({ displayName: '通用点击音效', tooltip: '音效资源别名' })
    clickAtlas: string = '';

    /** 通用界面打开音效的别名 */
    @property({ displayName: '通用界面打开音效', tooltip: '音效资源别名' })
    openAtlas: string = '';

    /** 通用界面关闭音效的别名 */
    @property({ displayName: '通用关闭打开音效', tooltip: '音效资源别名' })
    closeAtlas: string = '';

    /** 音效资源映射表 */
    private _map: any;

    /** 单例实例 */
    private static _ins: YJSoundEffectManager;

    /** 获取单例实例 */
    public static get ins(): YJSoundEffectManager {
        return this._ins;
    }

    /**
     * 组件加载时初始化单例和音效映射表
     */
    onLoad() {
        YJSoundEffectManager._ins = this;
        if (EDITOR) return;
        this._map = {};
        this.soundEffects.forEach(info => {
            if (info.alias) this._map[info.alias] = info.assetUrl.replace('db://assets/', '');
        });
    }

    /**
     * 组件销毁时清理单例
     */
    onDestroy() {
        YJSoundEffectManager._ins = null;
    }

    /**
     * 根据别名播放背景音乐
     * @param alias 音乐别名
     */
    public playMusicByAlias(alias: string): void {
        let url = this._map[alias];
        if (url) YJAudioManager.ins.playBGM(url);
    }

    /**
     * 根据别名播放音效
     * @param alias 音效别名
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
}
