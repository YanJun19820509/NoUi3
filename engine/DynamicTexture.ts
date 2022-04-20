
import { _decorator, Component, Node, Label, CacheMode, RichText, Sprite } from 'cc';
import { no } from '../no';
import { YJDynamicAtlas } from './YJDynamicAtlas';
const { ccclass, property } = _decorator;

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

@ccclass('DynamicTexture')
export class DynamicTexture extends Component {
    @property({ type: YJDynamicAtlas })
    dynamicAtlas: YJDynamicAtlas = null;

    onLoad() {
        let label = this.getComponent(Label);
        if (label && label.cacheMode == CacheMode.CHAR) {
            this.destroy();
            return;
        }
        if (this.dynamicAtlas) this.init();
    }

    public init() {
        this.enabledInHierarchy && this.afterChange();
    }

    public beforeChange(): void {
        // this.reset();
    }

    public async afterChange() {
        let label = this.getComponent(Label);
        if (label) {
            await no.waitFor(() => { return !label['_renderDataFlag']; });
            this.dynamicAtlas?.packToDynamicAtlas(label, label.ttfSpriteFrame);
        } else {
            let sprite = this.getComponent(Sprite);
            if (sprite) {
                // await no.waitFor(() => { return !sprite['_renderDataFlag']; });
                this.dynamicAtlas?.packToDynamicAtlas(sprite, sprite.spriteFrame);
            }
        }
    }
    public reset() {
        if (this.enabledInHierarchy && this.getComponent(Label) && this.getComponent(Label).ttfSpriteFrame && !this.getComponent(Label).ttfSpriteFrame.original) {
            console.error(this.node.name)
            return;
        }
        if (this.enabledInHierarchy && this.getComponent(Sprite) && this.getComponent(Sprite).spriteFrame && !this.getComponent(Sprite).spriteFrame.original) {
            console.error(this.node.name)
            return;
        }
        this.getComponent(Label)?.ttfSpriteFrame?._resetDynamicAtlasFrame();
        this.getComponent(Sprite)?.spriteFrame?._resetDynamicAtlasFrame();
    }
}
