
import { _decorator, Sprite } from 'cc';
import { DynamicTexture } from '../engine/DynamicTexture';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetEffect } from './SetEffect';
const { ccclass, property, menu, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = SetSpriteFrame
 * DateTime = Mon Jan 17 2022 14:34:00 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpriteFrame.ts
 * FileBasenameNoExtension = SetSpriteFrame
 * URL = db://assets/Script/NoUi3/fuckui/SetSpriteFrame.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetSpriteFrame')
@menu('NoUi/ui/SetSpriteFrame(设置精灵:string|{atlas:string,frame:string})')
@requireComponent(DynamicTexture)
export class SetSpriteFrame extends FuckUi {

    @property(Sprite)
    sprite: Sprite = null;

    protected onDataChange(data: any) {
        this.sprite = this.sprite || this.getComponent(Sprite);
        if (this.sprite == null) return;
        this.getComponent(DynamicTexture).beforeChange();
        if (data.atlas) {
            no.assetBundleManager.loadAtlas(data.atlas, item => {
                this.sprite.spriteAtlas = item;
                this.sprite.spriteFrame = this.sprite.spriteAtlas.getSpriteFrame(data.frame);
                this.checkShader();
            });
        } else if (!this.sprite.spriteAtlas) {
            no.assetBundleManager.decRef(this.sprite.spriteFrame);
            this.sprite.spriteFrame = null;
            no.assetBundleManager.loadSprite(String(data), spriteFrame => {
                this.sprite.spriteFrame = spriteFrame;
                this.checkShader();
            });
        } else {
            this.sprite.spriteFrame = this.sprite.spriteAtlas.getSpriteFrame(String(data));
            this.checkShader();
        }
    }

    private checkShader() {
        this.getComponent(DynamicTexture).afterChange();
        this.getComponent(SetEffect)?.work();
    }
}
