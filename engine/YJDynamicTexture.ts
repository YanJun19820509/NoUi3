
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
/**
 * 本组件同时处理了sprite和label进行合图的处理，这两者处理上有一些不同。
 * 1.sprite需要在设置纹理的同时进行合图，如果纹理设置完后过段时间再进行合图就会出现异常。
 * 2.sprite在设置纹理时不需要重置动态合图纹理。
 * 3.label需要在设置string流程走完后再进行合图。
 * 4.label在设置string前需要重置动态合图纹理。
 * 5.当节点disable时需要reset label，但不需要reset sprite，所以当再次enable时又需要对label进行合图处理
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

    onEnable() {
        if (!this.enabledInHierarchy) return;
        this.addUpdateHandlerByFrame(this.check, 2);
    }

    onDisable() {
        this.resetLabel(false);
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
        this.afterChange();
    }

    public afterChange() {
        let sprite = this.getComponent(Sprite);
        if (sprite) {
            this.dynamicAtlas?.packToDynamicAtlas(sprite, sprite.spriteFrame);
        }
    }
    public reset() {
        if (this.enabledInHierarchy && this.getComponent(Sprite) && this.getComponent(Sprite).spriteFrame && !this.getComponent(Sprite).spriteFrame.original) {
            return;
        }
        this.getComponent(Sprite)?.spriteFrame?._resetDynamicAtlasFrame();
    }

    public resetLabel(needCheck = true): void {
        this.clearUpdateHandlers();
        let label = this.getComponent(Label);
        if (!label) return;
        label.ttfSpriteFrame?._resetDynamicAtlasFrame();
        needCheck && this.addUpdateHandlerByFrame(this.check, 2);
    }

}
