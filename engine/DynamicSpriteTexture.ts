
import { _decorator, Sprite } from 'cc';
import { DynamicTexture } from './DynamicTexture';
const { ccclass, requireComponent, menu } = _decorator;

/**
 * Predefined variables
 * Name = DynamicSpriteTexture
 * DateTime = Thu Mar 17 2022 15:06:20 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = DynamicSpriteTexture.ts
 * FileBasenameNoExtension = DynamicSpriteTexture
 * URL = db://assets/NoUi3/engine/DynamicSpriteTexture.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('DynamicSpriteTexture')
@requireComponent(Sprite)
@menu('NoUi/engine/DynamicSpriteTexture(动态合图纹理管理)')
export class DynamicSpriteTexture extends DynamicTexture {

    onLoad() {
        this.afterChange();
    }

    public afterChange() {
        let sprite = this.getComponent(Sprite);
        this.dynamicAtlas?.packToDynamicAtlas(sprite, sprite.spriteFrame)
    }
    public reset() {
        let sprite = this.getComponent(Sprite);
        sprite.spriteFrame._resetDynamicAtlasFrame();
    }
}
