
import { _decorator, Sprite, SpriteFrame, UITransform, view, isValid } from 'cc';
import { EDITOR } from 'cc/env';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetEffect } from './SetEffect';
const { ccclass, property, menu, executeInEditMode } = _decorator;

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
@executeInEditMode()
export class SetSpriteFrame extends FuckUi {

    @property(Sprite)
    sprite: Sprite = null;
    @property
    path: string = '';

    protected onDataChange(data: any) {
        this.lateSet(data);
    }

    private setSpriteFrame(sf: SpriteFrame) {
        if (!sf || !isValid(this, true)) return;
        if (!this.getComponent(YJDynamicTexture))
            this.sprite.spriteFrame = sf;
        else
            this.getComponent(YJDynamicTexture).packSpriteFrame(sf);
        this.checkShader();
    }

    private checkShader() {
        this.getComponent(SetEffect)?.work();
    }

    private lateSet(data: any): void {
        // let rect = this.node.getComponent(UITransform)?.getBoundingBoxToWorld();
        // let viewSize = view.getVisibleSize();

        // if (rect.xMax < 0 || rect.yMax < 0 || rect.xMin > viewSize.width || rect.yMin > viewSize.height) {
        //     this.scheduleOnce(() => {
        //         this.lateSet(data);
        //     });
        //     return;
        // }

        this.sprite = this.sprite || this.getComponent(Sprite);
        if (this.sprite == null) return;

        if (!this.sprite.spriteAtlas && !data.atlas) {
            if (this.path != '' && data.indexOf(this.path) == -1) data = this.path + '/' + data;
            let path = `${data}/spriteFrame`;
            let uuid = no.assetBundleManager.getUuidFromPath(path);
            if (this.sprite.spriteFrame?._uuid == uuid) return;

            this?.getComponent(YJDynamicTexture)?.removeFrameFromDynamicAtlas(this.sprite.spriteFrame);
            if (!uuid || !this.getComponent(YJDynamicTexture)?.setSpriteFrameWithUuid(uuid, this.sprite))
                no.assetBundleManager.loadSprite(path, spriteFrame => {
                    this.setSpriteFrame(spriteFrame);
                });
        } else {
            this?.getComponent(YJDynamicTexture)?.removeFrameFromDynamicAtlas(this.sprite.spriteFrame);
            if (data.atlas) {
                no.assetBundleManager.loadAtlas(data.atlas, item => {
                    this.sprite.spriteAtlas = item;
                    this.setSpriteFrame(this.sprite.spriteAtlas.getSpriteFrame(data.frame));
                });
            } else if (this.sprite.spriteAtlas?.spriteFrames) {
                this.setSpriteFrame(this.sprite.spriteAtlas.getSpriteFrame(String(data)));
            }
        }
    }

    public a_setEmpty(): void {
        if (this.sprite == null) return;
        this.sprite.spriteFrame = null;
    }

    ///////EDITOR
    onLoad() {
        super.onLoad();
        if (EDITOR)
            this.sprite = this.getComponent(Sprite);
    }
    update() {
        if (!EDITOR) return;
        if (this.path == '' || this.path.indexOf('db://assets/') == -1) return;
        this.path = this.path.replace('db://assets/', '');
    }
}
