
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
 * URL = db://assets/common/base/audio/YJSoundEffectManager.ts
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
 * @特性
 * - 提供音效别名系统，解耦资源路径与业务逻辑
 * - 支持编辑器快速解析音频资源
 * - 预置通用界面音效快捷调用
 * - 与YJAudioManager协同工作实现完整音频管理
 */
export class YJSoundEffectManager extends Component {
    /**
     * 编辑器属性,用于解析项目中的音频资源
     * @机制
     * - 在编辑器中点击属性复选框触发解析
     * - 异步获取所有AudioClip类型资源信息
     * - 自动生成音效信息列表
     * @示例
     * // 在编辑器界面操作：
     * 1. 选中YJSoundEffectManager组件
     * 2. 勾选"开始解析"复选框
     * 3. 自动填充soundEffects列表
     */
    @property({ displayName: '开始解析' })
    public get parse(): boolean {
        return false;
    }

    /**
     * 解析项目中的音频资源,生成音效信息列表
     * @实现流程
     * 1. 通过编辑器接口获取所有音频资源信息
     * 2. 创建SoundEffectInfo对象并填充元数据
     * 3. 使用UUID进行重复项检查
     * 4. 更新或添加音效信息条目
     * @注意
     * - 仅编辑器模式下生效
     * - 文件名将作为默认别名（自动去除扩展名）
     */
    public set parse(v: boolean) {
        no.EditorMode.getAssetInfosByCCType('cc.AudioClip').then(infos => {
            if (!infos.length) {
                return;
            }
            for (let j = 0; j < infos.length; j++) {
                let info = infos[j];
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
            }
        });
    }

    /** 
     * 音效信息列表
     * @结构
     * - alias: 资源别名（显示名称）
     * - assetUrl: 资源完整路径
     * - assetUuid: 资源唯一标识
     * @示例
     * [
     *   {alias: "button_click", assetUrl: "db://assets/audio/ui/click.mp3", assetUuid: "xxxx"},
     *   {alias: "door_open", assetUrl: "db://assets/audio/sfx/door.mp3", assetUuid: "yyyy"}
     * ]
     */
    @property(SoundEffectInfo)
    soundEffects: SoundEffectInfo[] = [];

    /** 
     * 通用点击音效的别名
     * @配置说明
     * - 对应soundEffects中的某个alias
     * - 用于按钮等通用点击反馈
     * @示例值 "ui_click"
     */
    @property({ displayName: '通用点击音效', tooltip: '音效资源别名' })
    clickAtlas: string = '';

    /** 
     * 通用界面打开音效的别名
     * @使用场景
     * - 弹窗打开
     * - 菜单展开
     * - 场景切换
     * @示例值 "window_open"
     */
    @property({ displayName: '通用界面打开音效', tooltip: '音效资源别名' })
    openAtlas: string = '';

    /** 
     * 通用界面关闭音效的别名
     * @注意
     * - 与打开音效形成听觉闭环
     * - 建议使用短促的闭合音
     * @示例值 "window_close"
     */
    @property({ displayName: '通用界面关闭音效', tooltip: '音效资源别名' })
    closeAtlas: string = '';

    /** 
     * 音效资源映射表
     * @结构
     * - key: 音效别名
     * - value: 资源路径（去除'db://assets/'前缀）
     * @示例
     * {
     *   "sword_attack": "audio/combat/sword.mp3",
     *   "item_pickup": "audio/item/coin.mp3"
     * }
     */
    private _map: any;

    /** 单例实例 */
    private static _ins: YJSoundEffectManager;

    /** 
     * 获取单例实例
     * @使用示例
     * // 播放角色升级音效
     * YJSoundEffectManager.ins.playEffectByAlias('level_up');
     */
    public static get ins(): YJSoundEffectManager {
        return this._ins;
    }

    /**
     * 组件加载时初始化单例和音效映射表
     * @初始化流程
     * 1. 建立单例引用
     * 2. 过滤编辑器模式
     * 3. 构建alias到路径的映射
     * @注意
     * - 资源路径会自动去除'db://assets/'前缀
     * - 仅保留有效别名（alias不为空）的条目
     */
    onLoad() {
        YJSoundEffectManager._ins = this;
        if (EDITOR) return;
        this._map = {};
        for (let i = 0; i < this.soundEffects.length; i++) {
            let info = this.soundEffects[i];
            if (info.alias) this._map[info.alias] = info.assetUrl.replace('db://assets/', '');
        }
    }

    /**
     * 组件销毁时清理单例
     * @安全措施
     * - 防止单例失效后仍被访问
     * - 避免内存泄漏
     */
    onDestroy() {
        YJSoundEffectManager._ins = null;
    }

    /**
     * 根据别名播放背景音乐
     * @param alias 音乐别名
     * @实现逻辑
     * 1. 通过别名获取资源路径
     * 2. 委托YJAudioManager播放BGM
     * @示例
     * // 播放主菜单背景音乐
     * playMainMenuBGM() {
     *   this.playMusicByAlias('menu_bgm');
     * }
     */
    public playMusicByAlias(alias: string): void {
        let url = this._map[alias];
        if (url) YJAudioManager.ins.playBGM(url);
    }

    /**
     * 根据别名播放音效
     * @param alias 音效别名
     * @注意
     * - 实际播放受音效总开关控制
     * - 支持同时播放多个音效
     * @示例
     * // 播放武器切换音效
     * playWeaponSwitchSFX() {
     *   this.playEffectByAlias('weapon_switch');
     * }
     */
    public playEffectByAlias(alias: string): void {
        let url = this._map[alias];
        if (url) YJAudioManager.ins.playEffect(url);
    }

    /**
     * 播放通用界面打开音效
     * @使用场景
     * - 弹窗/面板打开时
     * - 菜单展开时
     * @示例
     * // 在窗口组件中调用
     * onWindowOpen() {
     *   YJSoundEffectManager.ins.playOpenSoundEffect();
     * }
     */
    public playClickSoundEffect(): void {
        if (this.clickAtlas) this.playEffectByAlias(this.clickAtlas);
    }

    /**
     * 播放通用点击音效
     * @适用控件
     * - 按钮
     * - 可交互UI元素
     * - 列表项
     * @示例
     * // 绑定到按钮点击事件
     * button.node.on(Button.EventType.CLICK, () => {
     *   YJSoundEffectManager.ins.playClickSoundEffect();
     * });
     */
    public playOpenSoundEffect(): void {
        if (this.openAtlas) this.playEffectByAlias(this.openAtlas);
    }

    /**
     * 播放通用界面关闭音效
     * @设计建议
     * - 与打开音效形成听觉闭环
     * - 使用短促的闭合音效
     * @示例
     * // 在关闭按钮回调中调用
     * onCloseButtonClick() {
     *   this.playCloseSoundEffect();
     *   this.closeWindow();
     * }
     */
    public playCloseSoundEffect(): void {
        if (this.closeAtlas) this.playEffectByAlias(this.closeAtlas);
    }
}
