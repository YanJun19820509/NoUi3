
import { _decorator, Component, Node, Toggle, Sprite } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJToggle
 * DateTime = Mon Jul 18 2022 16:59:22 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJToggle.ts
 * FileBasenameNoExtension = YJToggle
 * URL = db://assets/NoUi3/widget/toggle/YJToggle.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJToggle')
export class YJToggle extends Toggle {
    @property(Sprite)
    uncheckMark: Sprite = null;

    public playEffect() {
        super.playEffect();
        if (this.uncheckMark)
            this.uncheckMark.node.active = !this.isChecked;
    }
}
