
import {  ccclass,  menu, requireComponent, Component, AudioSource, AudioClip } from '../../yj';
import { no } from '../../no';

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
    private musicOn: string = '__musicOn';
    private effectOn: string = '__effectOn';
    private _lastBGM: string;

    private audioSource: AudioSource = null;

    private static _ins: YJAudioManager;

    public static get ins(): YJAudioManager {
        return this._ins;
    }

    onLoad() {
        YJAudioManager._ins = this;
        this.audioSource = this.getComponent(AudioSource);
        let a = localStorage.getItem(this.musicOn);
        if (a == null) a = '1';
        let b = localStorage.getItem(this.effectOn);
        if (b == null) b = '1';
        this.setBGMOn(a == '1');
        this.setEffectOn(b == '1');
    }

    onDestroy() {
        YJAudioManager._ins = null;
    }

    private clips: Map<string, AudioClip> = new Map();

    /**
     * 音乐开
     */
    public get isBGMOn(): boolean {
        return this._isBGMOn;
    }
    /**
     * 设置音乐开关
     */
    public setBGMOn(v: boolean) {
        localStorage.setItem(this.musicOn, v ? '1' : '0');
        this._isBGMOn = v;
        if (!v) this.stopBGM();
        else this.playBGM();
    }

    /**
     * 音效开关
     */
    public get isEffectOn(): boolean {
        return this._isEffectOn;
    }
    /**
     * 设置音效开关
     */
    public setEffectOn(v: boolean) {
        localStorage.setItem(this.effectOn, v ? '1' : '0');
        this._isEffectOn = v;
    }

    /**
     * 背景音乐开关
     */
    private _isBGMOn = true;

    /**
     * 音效开关
     */
    private _isEffectOn = true;

    /**
     * 播放背景音乐
     * @param path 音频剪辑路径
     */
    public playBGM(path?: string): void {
        if (path) this._lastBGM = path;
        else path = this._lastBGM;
        if (!path) return;
        if (!this.isBGMOn) return;
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
        if (!this.isEffectOn) return;
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
        if (!this.isEffectOn) return;
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
     * 暂停音效
     */
    public pauseEffect() {
        this._isEffectOn = false;
    }

    /**
     *设置音量
     *
     * @param {number} n
     */
    public setVolume(n: number) {
        this.audioSource.volume = n;
    }

    /**
     * 恢复音效
     */
    public resumeEffect() {
        this._isEffectOn = localStorage.getItem(this.effectOn) == '1';
    }

    /**
     * 播放音频剪辑
     * @param clip 音频剪辑
     * @param loop 是否循环，默认true
     */
    public playClip(clip: AudioClip, loop = true): void {
        if (loop && !this.isBGMOn) return;
        if (!loop && !this.isEffectOn) return;
        this._playClip(clip, null, loop);
    }

    /**
     * 异步播放音频剪辑
     * @param clip 音频剪辑
     */
    public async playClipOnceAsync(clip: AudioClip): Promise<void> {
        if (!this.isEffectOn) return;
        return new Promise<void>(resolve => {
            this.audioSource.playOneShot(clip, 1);
            this.audioSource.node.once(AudioSource.EventType.ENDED, resolve);
        });
    }

    public setClip(path: string, clip: AudioClip): void {
        if (path && !this.clips.has(path))
            this.clips.set(path, clip);
    }


    private _playClip(clip: AudioClip, path?: string, loop = true): void {
        this.setClip(path, clip);
        if (loop) {
            this.audioSource.stop();
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
