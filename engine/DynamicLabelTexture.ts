
import { _decorator, Component, Node, Label, CacheMode, dynamicAtlasManager } from 'cc';
const { ccclass, property, requireComponent, menu } = _decorator;

/**
 * Predefined variables
 * Name = DynamicLabelTexture
 * DateTime = Thu Mar 17 2022 15:06:07 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = DynamicLabelTexture.ts
 * FileBasenameNoExtension = DynamicLabelTexture
 * URL = db://assets/NoUi3/engine/DynamicLabelTexture.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('DynamicLabelTexture')
@requireComponent(Label)
@menu('NoUi/engine/DynamicLabelTexture(动态合图文本纹理管理)')
export class DynamicLabelTexture extends Component {
    onLoad() {
        let label = this.getComponent(Label);
        if (label.cacheMode == CacheMode.CHAR) {
            this.destroy();
            return;
        }
        label.cacheMode = CacheMode.BITMAP;
    }

    public beforeContentChange() {
        this.deleteSpriteFrame();
    }

    onDisable() {
        this.deleteSpriteFrame();
    }

    private deleteSpriteFrame() {
        if (!dynamicAtlasManager.enabled) return;
        let label = this.getComponent(Label);
        if (!label['_texture'] || !label['_texture']['_original']) return;
        dynamicAtlasManager.deleteAtlasSpriteFrame(label['_texture']);
        label.spriteFrame['_resetDynamicAtlasFrame']();
    }
}
