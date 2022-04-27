
import { _decorator, Component, AudioSource, AudioClip } from 'cc';
import { no } from '../../no';
const { ccclass, property, menu, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = YJAudioManager
 * DateTime = Mon Jan 10 2022 23:56:58 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJAudioManager.ts
 * FileBasenameNoExtension = YJAudioManager
 * URL = db://assets/Script/NoUi3/base/YJAudioManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJAudioManager')
@menu('NoUi/audio/YJAudioManager(音频管理组件)')
@requireComponent(AudioSource)
export class YJAudioManager extends Component {
    private musicMute: string = '__musicMute';
    private effectMute: string = '__effectMute';

    private audioSource: AudioSource = null;

    private static _ins: YJAudioManager;

    public static get ins(): YJAudioManager {
        return this._ins;
    }

    onLoad() {
        YJAudioManager._ins = this;
        this.audioSource = this.getComponent(AudioSource);
        this.setBGMMute(JSON.parse(localStorage.getItem(this.musicMute) || 'true'));
        this.setEffectMute(JSON.parse(localStorage.getItem(this.effectMute) || 'true'));
    }

    onDestroy() {
        YJAudioManager._ins = null;
    }

    private clips: Map<string, AudioClip> = new Map();

    public get isBGMMute(): boolean {
        return this._isBGMMute;
    }
    public setBGMMute(v: boolean) {
        localStorage.setItem(this.musicMute, JSON.stringify(v));
        this._isBGMMute = v;
    }

    public get isEffectMute(): boolean {
        return this._isEffectMute;
    }
    public setEffectMute(v: boolean) {
        localStorage.setItem(this.effectMute, JSON.stringify(v));
        this._isEffectMute = v;
    }

    /**
     * 背景音乐静音
     */
    private _isBGMMute = false;

    /**
     * 音效静音
     */
    private _isEffectMute = false;

    /**
     * 播放背景音乐
     * @param path 音频剪辑路径
     */
    public playBGM(path: string): void {
        if (this.isBGMMute) return;
        if (this.clips.has(path)) {
            let c = this.clips.get(path);
            this._playClip(c, path);
        } else {
            this.loadAndPlay(path, true);
        }
    }

    /**
     * 播放音效
     * @param path 音频剪辑路径
     */
    public playEffect(path: string): void {
        if (this.isEffectMute) return;
        if (this.clips.has(path)) {
            let c = this.clips.get(path);
            this._playClip(c, path, false);
        } else {
            this.loadAndPlay(path, false);
        }
    }

    /**
     * 异步播放
     * @param path 音频剪辑路径
     * @returns
     */
    public async playOnceAsync(path: string): Promise<void> {
        if (this.isEffectMute) return;
        if (this.clips.has(path)) {
            return new Promise<void>(resolve => {
                let clip = this.clips.get(path);
                this.audioSource.playOneShot(clip, 1);
                this.audioSource.node.once(AudioSource.EventType.ENDED, resolve);
            });
        }
        return new Promise<void>(resolve => {
            this.loadAudioClip(path, clip => {
                this.clips.set(path, clip);
                this.audioSource.playOneShot(clip, 1);
                this.audioSource.node.once(AudioSource.EventType.ENDED, resolve);
            });
        });
    }

    /**
     * 停止背景音乐
     */
    public stopBGM() {
        this.audioSource.stop();
    }

    /**
     * 播放音频剪辑
     * @param clip 音频剪辑
     * @param loop 是否循环，默认true
     */
    public playClip(clip: AudioClip, loop = true): void {
        this._playClip(clip, null, loop);
    }

    /**
     * 异步播放音频剪辑
     * @param clip 音频剪辑
     */
    public async playClipOnceAsync(clip: AudioClip): Promise<void> {
        if (this.isEffectMute) return;
        return new Promise<void>(resolve => {
            this.audioSource.playOneShot(clip, 1);
            this.audioSource.node.once(AudioSource.EventType.ENDED, resolve);
        });
    }

    public _playClip(clip: AudioClip, path?: string, loop = true): void {
        if (path && !this.clips.has(path))
            this.clips.set(path, clip);
        this.audioSource.stop()
        if (loop) {
            this.audioSource.clip = clip;
            this.audioSource.loop = true;
            this.audioSource.play();
        } else {
            this.audioSource.playOneShot(clip, 1);
        }
    }

    private loadAndPlay(path: string, loop: boolean): void {
        this.loadAudioClip(path, clip => {
            this._playClip(clip, path, loop);
        });
    }

    private loadAudioClip(path: string, callback: (clip: AudioClip) => void) {
        no.assetBundleManager.loadAudio(path, (clip) => {
            callback && callback(clip);
        });
    }
}
