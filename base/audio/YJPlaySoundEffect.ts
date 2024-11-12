
import { ccclass, property, Component, Node, Enum, Button } from '../../yj';
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
    ClickButton,
    OpenWindow,
    CloseWindow
}

@ccclass('YJPlaySoundEffect')
export class YJPlaySoundEffect extends Component {
    /** 音效类型 */
    @property({ type: Enum(SoundEffectType), displayName: '音效类型' })
    effectType: SoundEffectType = SoundEffectType.Other;
    
    /** 音效别名,仅在音效类型为Other时可见 */
    @property({ displayName: '音效别名', visible() { return this.effectType == SoundEffectType.Other } })
    alias: string = '';
    
    /** 是否自动播放,仅在音效类型为Other时可见 */
    @property({ visible() { return this.effectType == SoundEffectType.Other; } })
    autoPlay: boolean = false;

    /**
     * 组件加载时根据音效类型进行初始化
     * - 如果是按钮点击音效,则为所有子节点中的按钮添加点击音效
     * - 如果是窗口打开/关闭音效,则为面板添加对应的音效处理
     * - 如果是其他类型且设置了自动播放,则直接播放音效
     */
    onLoad() {
        if (this.effectType == SoundEffectType.ClickButton) {
            let btns = this.getComponentsInChildren(Button);
            btns.forEach(btn => {
                if (!btn.getComponent(YJPlaySoundEffect))
                    btn.node.on(Node.EventType.TOUCH_START, this.a_play, this);
            });
        } else if (this.effectType != SoundEffectType.Other) {
            let handler = no.EventHandlerInfo.new(this.node, 'YJPlaySoundEffect', 'a_play');
            let panel = this.getComponent(YJPanel);
            if (this.effectType == SoundEffectType.OpenWindow) {
                panel.onOpen.unshift(handler)
            } else panel.onClose.unshift(handler);
        } else if (this.autoPlay) {
            this.a_play();
        }
    }

    /**
     * 根据音效类型播放对应的音效
     * - ClickButton: 播放按钮点击音效
     * - OpenWindow: 播放窗口打开音效
     * - CloseWindow: 播放窗口关闭音效
     * - Other: 根据别名播放指定音效
     */
    public a_play(): void {
        switch (this.effectType) {
            case SoundEffectType.ClickButton:
                YJSoundEffectManager.ins.playClickSoundEffect();
                break;
            case SoundEffectType.OpenWindow:
                YJSoundEffectManager.ins.playOpenSoundEffect();
                break;
            case SoundEffectType.CloseWindow:
                YJSoundEffectManager.ins.playCloseSoundEffect();
                break;
            case SoundEffectType.Other:
                YJSoundEffectManager.ins.playEffectByAlias(this.alias);
                break;
        }
    }

}
