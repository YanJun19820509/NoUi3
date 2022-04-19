
import { _decorator, Label, CacheMode } from 'cc';
import { no } from '../no';
import { DynamicTexture } from './DynamicTexture';
const { ccclass, menu } = _decorator;

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
@menu('NoUi/engine/DynamicLabelTexture(动态合图文本纹理管理)')
export class DynamicLabelTexture extends DynamicTexture {

    onLoad() {
        let label = this.getComponent(Label);
        if (!label) return;
        if (label.cacheMode == CacheMode.CHAR) {
            this.destroy();
            return;
        }
        this.afterChange();
    }

    public async afterChange() {
        let label = this.getComponent(Label);
        await no.waitFor(() => { return label.ttfSpriteFrame != null; });
        this.dynamicAtlas?.packToDynamicAtlas(label, label.ttfSpriteFrame)
    }

    public reset(): void {
        let label = this.getComponent(Label);
        if (!label) return;
        label.ttfSpriteFrame._resetDynamicAtlasFrame();
    }
}
