
import { ccclass, EDITOR, executeInEditMode, type, Component, Node, Sprite, SpriteFrame } from '../yj';
import { SetSpriteFrameInSampler2D } from '../fuckui/SetSpriteFrameInSampler2D';

/**
 * Predefined variables
 * Name = YJSprite
 * DateTime = Wed Mar 01 2023 11:09:20 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSprite.ts
 * FileBasenameNoExtension = YJSprite
 * URL = db://assets/NoUi3/engine/YJSprite.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//给sprite设置spriteframe时直接走SetSpriteFrameInSampler2D
@ccclass('YJSprite')
@executeInEditMode()
export class YJSprite extends Sprite {
    private setSpriteFrameInSampler2D: SetSpriteFrameInSampler2D;

    @type(SpriteFrame)
    get spriteFrame2() {
        return this.spriteFrame;
    }
    set spriteFrame2(value) {
        if (EDITOR) {
            this.spriteFrame = value;
            return;
        }
        if (!value) return;
        if (this.setSpriteFrameInSampler2D) {
            this.setSpriteFrameInSampler2D.setSpriteFrame(value.name);
        } else this.spriteFrame = value;
    }

    onLoad() {
        if (EDITOR) return;
        this.setSpriteFrameInSampler2D = this.getComponent(SetSpriteFrameInSampler2D);
    }
}
