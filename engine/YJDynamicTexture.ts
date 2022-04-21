
import { _decorator, Label, CacheMode, Sprite } from 'cc';
import { YJComponent } from '../base/YJComponent';
import { no } from '../no';
import { YJDynamicAtlas } from './YJDynamicAtlas';
const { ccclass, property, disallowMultiple } = _decorator;

/**
 * Predefined variables
 * Name = DynamicTexture
 * DateTime = Tue Apr 19 2022 17:16:03 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = DynamicTexture.ts
 * FileBasenameNoExtension = DynamicTexture
 * URL = db://assets/NoUi3/engine/DynamicTexture.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJDynamicTexture')
@disallowMultiple()
export class YJDynamicTexture extends YJComponent {
    @property({ type: YJDynamicAtlas })
    dynamicAtlas: YJDynamicAtlas = null;

    onLoad() {
        let label = this.getComponent(Label);
        if (label && label.cacheMode == CacheMode.CHAR) {
            this.destroy();
            return;
        }
        this.init();
    }

    private async check(): Promise<boolean> {
        if (!this.dynamicAtlas) return false;
        if (!this.enabledInHierarchy) return true;
        let label = this.getComponent(Label);
        if (!label) return false;
        if (label.string != '' && !label.ttfSpriteFrame.original) {
            await no.waitFor(() => { return !label['_renderDataFlag']; });
            this.dynamicAtlas.packToDynamicAtlas(label, label.ttfSpriteFrame);
        }
        return false;
    }

    public init() {
        if (!this.enabledInHierarchy) return;
        this.addUpdateHandlerByFrame(this.check, 2);
        this.afterChange();
    }

    public afterChange() {
        let sprite = this.getComponent(Sprite);
        if (sprite) {
            this.dynamicAtlas?.packToDynamicAtlas(sprite, sprite.spriteFrame);
        }
    }
    public reset() {
        this.clearUpdateHandlers();
        if (this.enabledInHierarchy && this.getComponent(Label) && this.getComponent(Label).ttfSpriteFrame && !this.getComponent(Label).ttfSpriteFrame.original) {
            return;
        }
        if (this.enabledInHierarchy && this.getComponent(Sprite) && this.getComponent(Sprite).spriteFrame && !this.getComponent(Sprite).spriteFrame.original) {
            return;
        }
        this.getComponent(Label)?.ttfSpriteFrame?._resetDynamicAtlasFrame();
        this.getComponent(Sprite)?.spriteFrame?._resetDynamicAtlasFrame();
    }

    public resetLabel(): void {
        this.clearUpdateHandlers();
        let label = this.getComponent(Label);
        if (!label) return;
        label.ttfSpriteFrame?._resetDynamicAtlasFrame();
        this.addUpdateHandlerByFrame(this.check, 2);
    }

}
