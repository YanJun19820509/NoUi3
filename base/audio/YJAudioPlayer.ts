
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
 * URL = db://assets/common/base/audio/YJAudioPlayer.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJAudioPlayer')
@menu('NoUi/audio/YJAudioPlayer(音频播放)')
/**
 * 音频播放组件,用于播放音频剪辑
 * @特性
 * - 支持背景音乐与音效两种播放模式
 * - 自动管理音频资源路径信息
 * - 提供编辑器可视化配置界面
 * @示例
 * // 编辑器配置示例：
 * 1. 将音频资源拖拽到Clip属性
 * 2. 勾选Loop作为背景音乐，不勾选作为音效
 * 3. 勾选AutoPlay实现场景加载自动播放
 * 
 * // 代码控制示例：
 * // 获取组件并播放战斗音效
 * const audioPlayer = this.getComponent(YJAudioPlayer);
 * audioPlayer.loop = false;
 * audioPlayer.a_play();
 */
export class YJAudioPlayer extends Component {
    /**
     * 音频剪辑资源引用
     * @property {AudioClip} clip
     * @编辑器使用 拖拽音频资源到此属性
     * @注意 设置后会异步获取资源的URL和UUID
     * @示例
     * // 代码设置音频剪辑
     * this.audioPlayer.clip = this.battleMusicClip;
     */
    @property({ type: AudioClip })
    public get clip(): AudioClip {
        return null;
    }

    /**
     * 设置音频剪辑并获取资源信息
     * @实现逻辑
     * 1. 通过资源UUID异步获取完整资源路径
     * 2. 缓存资源URL和UUID用于后续播放
     * @param {AudioClip} v 音频剪辑资源
     */
    public set clip(v: AudioClip) {
        no.EditorMode.getAssetUrlByUuid(v.uuid).then(url => {
            if (!url) return;
            this.clipUrl = url;
            this.clipUuid = v.uuid;
        });
    }

    /**
     * 音频文件资源路径
     * @property {string} clipUrl
     * @readonly 运行时自动生成
     * @用途 用于音频管理器加载资源
     */
    @property({ readonly: true })
    clipUrl: string = '';

    /**
     * 音频文件唯一标识
     * @property {string} clipUuid
     * @readonly 运行时自动生成
     * @用途 用于资源管理系统验证
     */
    @property({ readonly: true })
    clipUuid: string = '';

    /**
     * 循环播放开关
     * @property {boolean} loop
     * @default true
     * @用法说明
     * - 开启时作为背景音乐循环播放
     * - 关闭时作为音效单次播放
     * @示例
     * // 设置为环境音效循环播放
     * this.audioPlayer.loop = true;
     * this.audioPlayer.a_play();
     */
    @property({ displayName: '是否循环播放' })
    loop: boolean = true;

    /**
     * 自动播放开关
     * @property {boolean} autoPlay
     * @default true
     * @功能 组件加载完成后自动触发播放
     * @适用场景 场景背景音乐、UI界面入场音效等
     */
    @property({ displayName: '是否自动播放' })
    autoPlay: boolean = true;

    /**
     * 组件初始化回调
     * @实现逻辑 根据autoPlay标志决定是否自动播放
     * @注意 确保在编辑器模式下不会自动播放
     */
    onLoad() {
        this.autoPlay && this.a_play();
    }

    /**
     * 执行音频播放
     * @异步方法
     * @实现逻辑
     * 1. 根据loop标志选择播放模式：
     *   - 循环模式：使用背景音乐通道播放
     *   - 单次模式：使用音效通道播放
     * 2. 依赖YJAudioManager实际执行播放
     * @示例
     * // 播放BOSS战背景音乐
     * this.bossAudioPlayer.loop = true;
     * this.bossAudioPlayer.a_play();
     * 
     * // 播放按钮点击音效
     * this.clickAudioPlayer.loop = false;
     * this.clickAudioPlayer.a_play();
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
     * 停止背景音乐播放
     * @功能 专用于停止循环播放的音频
     * @注意 对音效播放无影响
     * @使用场景
     * - 场景切换时停止当前BGM
     * - 暂停游戏时静音
     * @示例
     * // 当玩家进入设置界面时停止背景音乐
     * this.backgroundMusicPlayer.a_stop();
     */
    public a_stop() {
        YJAudioManager.ins.stopBGM();
    }
}
