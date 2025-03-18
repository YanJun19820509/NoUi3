
import { ccclass, property, Component, Node, Enum, Button, js } from '../../yj';
import { no } from '../../no';
import { YJPanel } from '../node/YJPanel';
import { YJSoundEffectManager } from './YJSoundEffectManager';

/**
 * Predefined variables
 * Name = YJPlaySoundEffect
 * DateTime = Thu Apr 28 2022 12:36:02 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPlaySoundEffect.ts
 * FileBasenameNoExtension = YJPlaySoundEffect
 * URL = db://assets/NoUi3/base/audio/YJPlaySoundEffect.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
export enum SoundEffectType {
    Other = 0,
    // ClickButton,
    OpenWindow,
    CloseWindow
}

@ccclass('YJPlaySoundEffect')
export class YJPlaySoundEffect extends Component {
    /** 
     * 音效类型
     * @enum {SoundEffectType}
     * @property
     * - OpenWindow: 窗口打开音效（默认值）
     * - CloseWindow: 窗口关闭音效
     * - Other: 自定义音效（需配合alias使用）
     * @example
     * // 在编辑器中设置为CloseWindow类型
     * this.effectType = SoundEffectType.CloseWindow;
     * 
     * // 代码动态修改音效类型
     * playWinSound() {
     *   this.effectType = SoundEffectType.OpenWindow;
     *   this.a_play();
     * }
     */
    @property({ type: Enum(SoundEffectType), displayName: '音效类型' })
    effectType: SoundEffectType = SoundEffectType.OpenWindow;

    /** 
     * 音效别名（仅在音效类型为Other时生效）
     * @property
     * - 对应音效管理器中的预定义音效标识
     * - 需要先在YJSoundEffectManager中配置对应别名
     * @example
     * // 配置成就解锁音效
     * alias = "achievement_unlock"
     * 
     * // 配置角色升级音效
     * alias = "character_levelup"
     */
    @property({ displayName: '音效别名', visible() { return this.effectType == SoundEffectType.Other } })
    alias: string = '';

    /** 
     * 自动播放开关（仅在音效类型为Other时生效）
     * @property
     * - 启用时组件加载后自动播放音效
     * - 适合场景入场音效等一次性播放需求
     * @example
     * // 场景加载时自动播放环境音效
     * autoPlay = true
     * alias = "ambient_forest"
     */
    @property({ visible() { return this.effectType == SoundEffectType.Other; } })
    autoPlay: boolean = false;

    /**
     * 组件初始化处理
     * @实现逻辑
     * 1. 窗口类型音效处理：
     *    - OpenWindow: 立即播放打开音效
     *    - CloseWindow: 注册到面板关闭事件队列首部
     * 2. Other类型处理：
     *    - 自动播放模式下立即播放指定别名音效
     * @注意
     * - 使用unshift确保关闭音效优先于其他关闭逻辑执行
     * @example
     * // 弹窗面板配置关闭音效：
     * effectType = CloseWindow
     * 组件会自动将播放逻辑绑定到YJPanel的onClose事件
     */
    onLoad() {
        if (this.effectType != SoundEffectType.Other) {
            if (this.effectType == SoundEffectType.CloseWindow) {
                let handler = no.EventHandlerInfo.new(this.node, 'YJPlaySoundEffect', 'a_play');
                let panel = this.getComponent(YJPanel);
                panel.onClose.unshift(handler);
            } else {
                this.a_play();
            }
        } else if (this.autoPlay) {
            this.a_play();
        }
    }

    /**
     * 音效播放入口方法
     * @功能说明
     * 根据effectType执行对应播放逻辑：
     * - OpenWindow: 播放窗口打开音效（默认使用"window_open"）
     * - CloseWindow: 播放窗口关闭音效（默认使用"window_close"）
     * - Other: 通过别名播放预定义音效
     * @使用场景
     * - 手动触发音效播放
     * - 事件驱动播放（如动画事件）
     * @example
     * // 播放自定义音效
     * this.effectType = SoundEffectType.Other;
     * this.alias = "item_purchase";
     * this.a_play();
     * 
     * // 绑定按钮点击事件
     * button.node.on(Button.EventType.CLICK, () => {
     *   this.a_play();
     * });
     */
    public a_play(): void {
        switch (this.effectType) {
            case SoundEffectType.OpenWindow:
                // 使用默认窗口打开音效（音量0.8，带轻微混响）
                YJSoundEffectManager.ins.playOpenSoundEffect();
                break;
            case SoundEffectType.CloseWindow:
                // 使用默认窗口关闭音效（音量1.0，短促音效）
                YJSoundEffectManager.ins.playCloseSoundEffect();
                break;
            case SoundEffectType.Other:
                // 播放自定义音效（需预先配置别名映射）
                // 示例：播放 alias = "ui_notification" 的提示音
                YJSoundEffectManager.ins.playEffectByAlias(this.alias);
                break;
        }
    }
}
