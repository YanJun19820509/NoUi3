
import { ccclass, property, menu, executeInEditMode, Sprite, EDITOR } from '../yj';
import { YJJobManager } from '../base/YJJobManager';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetEffect } from './SetEffect';

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

    @property({ tooltip: 'disable时清除' })
    clearOnDisable: boolean = false;

    onDisable() {
        this.clearOnDisable && this.a_setEmpty();
    }

    protected onDataChange(data: any) {
        this.lateSet(data);
    }

    private packSpriteFrame() {
        YJJobManager.ins.execute(() => {
            if (!this.getComponent(YJDynamicTexture)) return false;
            this.getComponent(YJDynamicTexture).packSpriteFrame();
            this.checkShader();
            return false;
        }, this)
    }

    private checkShader() {
        this.getComponent(SetEffect)?.work();
    }

    private lateSet(data: any): void {
        this.sprite = this.sprite || this.getComponent(Sprite);
        if (this.sprite == null) return;

        if (!this.sprite.spriteAtlas && !data.atlas) {
            if (this.path != '' && data.indexOf(this.path) == -1) data = this.path + '/' + data;
            let path = `${data}/spriteFrame`;
            let uuid = no.assetBundleManager.getUuidFromPath(path);
            if (this.sprite.spriteFrame?._uuid == uuid) return;

            if (!uuid || !this.getComponent(YJDynamicTexture)?.setSpriteFrameWithUuid(uuid, this.sprite))
                no.assetBundleManager.loadSprite(path, spriteFrame => {
                    if (this.sprite?.isValid) {
                        this.sprite.spriteFrame = spriteFrame;
                        this.packSpriteFrame();
                    }
                });
        } else {
            if (data.atlas) {
                no.assetBundleManager.loadAtlas(data.atlas, item => {
                    this.sprite.spriteAtlas = item;
                    this.sprite.spriteFrame = this.sprite.spriteAtlas.getSpriteFrame(data.frame);
                    this.packSpriteFrame();
                });
            } else if (this.sprite.spriteAtlas?.spriteFrames) {
                let name = String(data).split('/').pop();
                this.sprite.spriteFrame = this.sprite.spriteAtlas.getSpriteFrame(name);
                this.packSpriteFrame();
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
