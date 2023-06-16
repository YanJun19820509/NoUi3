
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
    @property({ type: Enum(SoundEffectType), displayName: '音效类型' })
    effectType: SoundEffectType = SoundEffectType.Other;
    @property({ displayName: '音效别名', visible() { return this.effectType == SoundEffectType.Other } })
    alias: string = '';
    @property({ visible() { return this.effectType == SoundEffectType.Other; } })
    autoPlay: boolean = false;

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
