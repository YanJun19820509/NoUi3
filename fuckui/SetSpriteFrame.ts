
import { _decorator, Sprite } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetShader } from './SetShader';
const { ccclass, property, menu } = _decorator;

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
@menu('NoUi/ui/SetSpriteFrame(设置精灵:string)')
export class SetSpriteFrame extends FuckUi {

    @property(Sprite)
    sprite: Sprite = null;

    onLoad() {
        super.onLoad();
        this.sprite = this.sprite || this.getComponent(Sprite);
    }

    protected onDataChange(data: any) {
        if (this.sprite == null) return;
        if (!this.sprite.spriteAtlas) {
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
        this.scheduleOnce(() => {
            this.getComponent(SetShader)?.work();
        }, 0);
    }
}
