
import { _decorator, Component, Sprite, dynamicAtlasManager } from 'cc';
const { ccclass, property, requireComponent, menu } = _decorator;

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
export class DynamicSpriteTexture extends Component {

    public beforeChange() {
        this.deleteSpriteFrame();
    }

    onDisable() {
        this.deleteSpriteFrame();
    }

    private deleteSpriteFrame() {
        if (!dynamicAtlasManager.enabled) return;
        let sprite = this.getComponent(Sprite);
        if (!sprite.spriteFrame || !sprite.spriteFrame['_original']) return;
        dynamicAtlasManager.deleteAtlasSpriteFrame(sprite.spriteFrame);
        sprite.spriteFrame._resetDynamicAtlasFrame();
    }
}
