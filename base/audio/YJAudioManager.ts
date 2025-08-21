
import { ccclass, menu, requireComponent, Component, AudioSource, AudioClip } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJAudioManager
 * DateTime = Mon Jan 10 2022 23:56:58 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJAudioManager.ts
 * FileBasenameNoExtension = YJAudioManager
 * URL = db://assets/Script/common/base/YJAudioManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJAudioManager')
@menu('NoUi/audio/YJAudioManager(音频管理组件)')
@requireComponent(AudioSource)
/**
 * 音频管理组件,用于管理游戏中的音频播放
 */
export class YJAudioManager extends Component {
    /** 
     * 背景音乐开关的本地存储key 
     * @存储格式 '1'表示开启，'0'表示关闭
     * @示例 
     * // 玩家设置界面保存音乐开关状态
     * localStorage.setItem(this.musicOn, isOn ? '1' : '0');
     */
    private musicOn: string = '__musicOn';
    /** 
     * 音效开关的本地存储key
     * @注意 与背景音乐使用独立开关控制
     * @示例
     * // 战斗场景中根据设置决定是否播放打击音效
     * if(this.isEffectOn) this.playEffect('hit');
     */
    private effectOn: string = '__effectOn';
    /** 
     * 上一次播放的背景音乐路径
     * @使用场景 恢复播放/场景切换后继续播放
     * @示例
     * // 从战斗场景返回主菜单时自动恢复主界面BGM
     * this._lastBGM = 'audio/bgm/main';
     */
    private _lastBGM: string;

    /** 
     * 音频源组件 
     * @实现说明 通过getComponent(AudioSource)获取
     * @注意 需确保节点已挂载AudioSource组件
     */
    private audioSource: AudioSource = null;

    /** 
     * 单例实例 
     * @设计模式 使用单例模式确保全局音频控制唯一性
     * @安全访问 通过ins属性获取实例
     */
    private static _ins: YJAudioManager;

    /** 
     * 获取单例实例
     * @使用示例
     * // 在任何脚本中控制音乐播放
     * YJAudioManager.ins.playBGM('audio/bgm/battle');
     */
    public static get ins(): YJAudioManager {
        return this._ins;
    }

    /** 
     * 组件初始化
     * @流程说明
     * 1. 建立单例引用
     * 2. 获取音频组件
     * 3. 加载本地存储设置
     * @示例
     * // 游戏启动时自动加载玩家上次的音效设置
     * this.setEffectOn(localStorage.getItem('effect') === '1');
     */
    onLoad() {
        YJAudioManager._ins = this;
        this.audioSource = this.getComponent(AudioSource);
        let a = localStorage.getItem(this.musicOn) || '1'; // 默认开启音乐
        let b = localStorage.getItem(this.effectOn) || '1'; // 默认开启音效
        this.setBGMOn(a == '1');
        this.setEffectOn(b == '1');
    }

    /** 
     * 组件销毁处理
     * @安全措施 防止单例实例失效后仍被访问
     * @示例
     * // 场景切换时自动清理音频管理器
     * this.node.destroy();
     */
    onDestroy() {
        YJAudioManager._ins = null;
    }

    /** 
     * 音频剪辑缓存Map
     * @优化设计 避免重复加载音频资源
     * @示例
     * // 缓存已加载的UI音效
     * this.clips.set('audio/ui/click', clickClip);
     */
    private clips: Map<string, AudioClip> = new Map();

    private loopEffectMap: Map<string, any> = new Map();

    /**
     * 获取背景音乐开关状态
     * @使用场景
     * - 设置界面显示当前音乐状态
     * - 播放新BGM前检查是否允许播放
     */
    public get isBGMOn(): boolean {
        return this._isBGMOn;
    }

    /**
     * 设置音乐开关
     * @param v true开启,false关闭
     * @副作用
     * - 立即停止当前播放中的背景音乐（当关闭时）
     * - 自动恢复最后播放的BGM（当开启时）
     * @示例
     * // 游戏暂停时关闭背景音乐
     * YJAudioManager.ins.setBGMOn(false);
     */
    public setBGMOn(v: boolean) {
        localStorage.setItem(this.musicOn, v ? '1' : '0');
        this._isBGMOn = v;
        if (!v) this.stopBGM();
        else this.playBGM();
    }

    /**
     * 获取音效开关状态
     * @returns 当前音效开关状态 true=开启/false=关闭
     * @使用场景
     * - 设置界面显示音效状态
     * - 播放音效前检查是否允许播放
     * @示例
     * // 更新音效开关UI显示
     * toggle.isChecked = YJAudioManager.ins.isEffectOn;
     */
    public get isEffectOn(): boolean {
        return this._isEffectOn;
    }

    /**
     * 设置音效开关
     * @param v true开启,false关闭
     * @副作用
     * - 立即更新本地存储设置
     * - 影响后续所有音效播放
     * @实现逻辑
     * 1. 将布尔值转换为'1'/'0'存储
     * 2. 更新内存中的开关状态
     * @示例
     * // 点击音效开关按钮
     * YJAudioManager.ins.setEffectOn(toggle.isChecked);
     */
    public setEffectOn(v: boolean) {
        localStorage.setItem(this.effectOn, v ? '1' : '0');
        this._isEffectOn = v;
    }

    /** 背景音乐开关状态 默认true开启 */
    private _isBGMOn = true;

    /** 音效开关状态 默认true开启 */
    private _isEffectOn = true;

    public getEffectDuration(path: string): number {
        if (this.clips.has(path)) {
            let c = this.clips.get(path);
            return c.getDuration();
        }
        return 0;
    }

    /**
     * 播放背景音乐
     * @param path 音频剪辑路径,不传则播放上一次的背景音乐
     * @实现逻辑
     * 1. 记录/获取背景音乐路径
     * 2. 检查音乐开关状态
     * 3. 从缓存获取或加载音频资源
     * @注意
     * - 背景音乐使用循环播放模式
     * - 同一时间只能播放一首BGM
     * @示例
     * // 播放主界面背景音乐
     * YJAudioManager.ins.playBGM('audio/bgm/main');
     * 
     * // 继续播放上次中断的BGM
     * YJAudioManager.ins.playBGM();
     */
    public playBGM(path?: string): void {
        if (path) this._lastBGM = path;
        else path = this._lastBGM;
        if (!path) return;
        if (!this.isBGMOn) return;
        if (this.clips.has(path)) {
            let c = this.clips.get(path);
            this._playClip(c);
        } else {
            this.loadAndPlay(path, true);
        }
    }

    /**
     * 播放音效
     * @param path 音频剪辑路径 格式：'目录/文件名'（无扩展名）
     * @实现逻辑
     * 1. 检查音效总开关
     * 2. 使用缓存或加载音频资源
     * 3. 播放一次非循环音效
     * @注意
     * - 支持同时播放多个音效
     * - 音量受主音量设置影响
     * @示例
     * // 播放按钮点击音效
     * YJAudioManager.ins.playEffect('audio/ui/click');
     * 
     * // 播放技能音效
     * YJAudioManager.ins.playEffect('audio/skill/fireball');
     */
    public playEffect(path: string): void {
        if (!this.isEffectOn) return;
        if (this.clips.has(path)) {
            let c = this.clips.get(path);
            this._playClip(c, false);
        } else {
            this.loadAndPlay(path, false);
        }
    }

    public playLoopEffect(path: string): void {
        if (!this.isEffectOn) return;
        if (this.loopEffectMap.has(path)) return;
        if (this.clips.has(path)) {
            const duration = this.getEffectDuration(path);
            const timer = setInterval(() => {
                this.playEffect(path);
            }, duration * 1000);
            this.playEffect(path);
            this.loopEffectMap.set(path, timer);
        }
        else {
            this.loadAudioClip(path, (clip) => {
                this.playLoopEffect(path);
            });
        }
    }

    public stopLoopEffect(path: string): void {
        if (this.loopEffectMap.has(path)) {
            clearInterval(this.loopEffectMap.get(path));
            this.loopEffectMap.delete(path);
        }
    }

    /**
     * 异步播放音效一次（支持自动加载）
     * @param path 音频路径 格式：'目录/文件名'（无扩展名）
     * @returns Promise 在音效播放完成后resolve
     * @实现逻辑
     * 1. 检查音效开关状态
     * 2. 存在缓存时直接播放
     * 3. 无缓存时先加载再播放
     * 4. 监听音频结束事件触发Promise
     * @注意
     * - 自动缓存已加载的音效资源
     * - 支持异步等待播放完成
     * @示例
     * // 播放攻击音效并等待结束
     * await YJAudioManager.ins.playOnceAsync('audio/combat/sword');
     * console.log('剑击音效播放完毕');
     */
    public async playOnceAsync(path: string): Promise<void> {
        if (!this.isEffectOn) return;
        if (this.clips.has(path)) {
            return new Promise<void>(resolve => {
                let clip = this.clips.get(path);
                this.audioSource.playOneShot(clip, 1);
                this.audioSource.node.once(AudioSource.EventType.ENDED, resolve);
            }).catch(e => {
                console.error('音效播放失败:', e);
            });
        }
        return new Promise<void>(resolve => {
            this.loadAudioClip(path, clip => {
                this.clips.set(path, clip);
                this.audioSource.playOneShot(clip, 1);
                this.audioSource.node.once(AudioSource.EventType.ENDED, resolve);
            });
        }).catch(e => {
            console.error('音效加载失败:', e);
        });
    }

    /**
     * 停止背景音乐播放
     * @特性
     * - 立即停止当前播放的BGM
     * - 不会清空_lastBGM记录
     * @使用场景
     * - 游戏暂停时
     * - 场景切换过渡时
     * @示例
     * // 停止当前背景音乐
     * YJAudioManager.ins.stopBGM();
     * 
     * // 战斗胜利后停止BGM
     * onBattleWin() {
     *   YJAudioManager.ins.stopBGM();
     * }
     */
    public stopBGM() {
        this.audioSource.stop();
    }

    /**
     * 暂停所有音效播放
     * @实现说明
     * - 设置内部标记阻止新音效播放
     * - 不会停止已播放的音效
     * @注意
     * - 与stopBGM不同，不会停止正在播放的音效
     * - 需要恢复时调用resumeEffect()
     * @示例
     * // 游戏暂停时冻结音效
     * onGamePause() {
     *   YJAudioManager.ins.pauseEffect();
     * }
     */
    public pauseEffect() {
        this._isEffectOn = false;
    }

    /**
     * 设置全局音量（同时影响BGM和音效）
     * @param n 音量值 范围0-1
     * @特性
     * - 立即生效
     * - 影响后续所有音频播放
     * @示例
     * // 设置50%音量
     * YJAudioManager.ins.setVolume(0.5);
     * 
     * // 淡出效果
     * for(let v = 1; v > 0; v -= 0.1) {
     *   YJAudioManager.ins.setVolume(v);
     *   await new Promise(r => setTimeout(r, 100));
     * }
     */
    public setVolume(n: number) {
        this.audioSource.volume = n;
    }

    /**
     * 恢复音效播放
     * @实现说明
     * - 从本地存储读取音效开关状态
     * - 需要与pauseEffect()配合使用
     * @注意
     * - 不会自动恢复已暂停的音效
     * - 仅影响后续音效播放
     * @示例
     * // 游戏恢复时重新启用音效
     * onGameResume() {
     *   YJAudioManager.ins.resumeEffect();
     * }
     */
    public resumeEffect() {
        this._isEffectOn = localStorage.getItem(this.effectOn) == '1';
    }

    /**
     * 播放音频剪辑
     * @param clip 音频剪辑
     * @param loop 是否循环，默认true
     * @实现逻辑
     * - 循环播放时检查BGM开关状态
     * - 单次播放时检查音效开关状态
     * - 实际播放委托给内部方法
     * @示例
     * // 播放背景音乐
     * playBGM() {
     *   YJAudioManager.ins.playClip(bgmClip);
     * }
     * 
     * // 播放按钮音效（单次）
     * playButtonSound() {
     *   YJAudioManager.ins.playClip(btnClip, false);
     * }
     */
    public playClip(clip: AudioClip, loop = true): void {
        if (loop && !this.isBGMOn) return;
        if (!loop && !this.isEffectOn) return;
        this._playClip(clip, loop);
    }

    /**
     * 异步播放音频剪辑一次
     * @param clip 音频剪辑
     * @returns 播放结束的Promise
     * @特性
     * - 自动绑定ENDED事件监听
     * - 内置错误捕获
     * @注意
     * - 需要音效开关处于开启状态
     * @示例
     * // 播放过场音效并等待结束
     * async playCutscene() {
     *   await YJAudioManager.ins.playClipOnceAsync(cutsceneClip);
     *   // 继续后续逻辑...
     * }
     */
    public async playClipOnceAsync(clip: AudioClip): Promise<void> {
        if (!this.isEffectOn) return;
        return new Promise<void>(resolve => {
            this.audioSource.playOneShot(clip, 1);
            this.audioSource.node.once(AudioSource.EventType.ENDED, resolve);
        }).catch(e => {
            console.error(e);
        });
    }

    /**
     * 缓存音频剪辑
     * @param path 音频剪辑路径
     * @param clip 音频剪辑
     * @注意
     * - 相同路径的音频只会缓存一次
     * - 建议在预加载阶段使用
     * @示例
     * // 预加载常用音效
     * preloadSounds() {
     *   this.audioManager.setClip('sfx/click', clickClip);
     *   this.audioManager.setClip('sfx/coin', coinClip);
     * }
     */
    public setClip(path: string, clip: AudioClip): void {
        if (path && !this.clips.has(path))
            this.clips.set(path, clip);
    }

    /**
     * 播放音频剪辑核心方法
     * @param clip 要播放的音频剪辑对象
     * @param loop 是否循环播放，默认为true
     * 
     * @实现说明
     * 1. 循环播放时：
     *    - 先停止当前正在播放的音频
     *    - 设置新的音频剪辑
     *    - 开启循环模式
     *    - 开始播放
     * 2. 非循环播放时：
     *    - 使用playOneShot立即播放（允许多个音效叠加）
     * 
     * @示例
     * // 循环播放背景音乐
     * this._playClip(bgmClip, true);
     * 
     * // 单次播放音效
     * this._playClip(sfxClip, false);
     */
    private _playClip(clip: AudioClip, loop = true): void {
        if (loop) {
            this.audioSource.stop();
            this.audioSource.clip = clip;
            this.audioSource.loop = true;
            this.audioSource.play();
        } else {
            this.audioSource.playOneShot(clip, 1);
        }
    }

    /**
     * 加载并播放音频文件的完整流程
     * @param path 音频资源路径（基于assets目录的相对路径）
     * @param loop 是否循环播放
     * 
     * @实现流程
     * 1. 调用加载方法获取音频剪辑
     * 2. 加载完成后通过回调执行播放
     * 
     * @示例
     * // 加载并播放UI点击音效
     * this.loadAndPlay('audio/sfx/click', false);
     * 
     * // 加载并循环播放环境音效
     * this.loadAndPlay('audio/ambient/forest', true);
     */
    private loadAndPlay(path: string, loop: boolean): void {
        this.loadAudioClip(path, clip => {
            this._playClip(clip, loop);
        });
    }

    /**
     * 音频资源加载核心方法
     * @param path 音频资源路径
     * @param callback 加载完成回调函数
     * 
     * @实现流程
     * 1. 使用assetBundleManager加载音频资源
     * 2. 加载成功时缓存音频剪辑
     * 3. 通过回调返回加载结果
     * 4. 加载失败时输出错误日志
     * 
     * @注意
     * - 使用自定义资源加载系统（no.assetBundleManager）
     * - 自动缓存已加载资源避免重复加载
     * 
     * @示例
     * // 预加载战斗背景音乐
     * this.loadAudioClip('audio/bgm/battle', (clip) => {
     *   console.log('BGM预加载完成');
     * });
     */
    private loadAudioClip(path: string, callback: (clip: AudioClip) => void) {
        no.assetBundleManager.loadAudio(path, (clip) => {
            if (clip) {
                this.setClip(path, clip);  // 缓存到clip集合
                callback && callback(clip);
            } else {
                no.err('loadAudioClip fail', path)
            }
        });
    }

    public pauseAll(): void {
        this.audioSource.enabled = false;
    }

    public resumeAll(): void {
        this.audioSource.enabled = true;
    }

    public stopAll(): void {
        this.audioSource.stop();
        this.loopEffectMap.forEach(timer => {
            clearInterval(timer);
        });
        this.loopEffectMap.clear();
    }
}
