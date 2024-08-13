
import { ccclass, property, menu, executeInEditMode, Sprite, EDITOR, SpriteFrame } from '../yj';
import { YJJobManager } from '../base/YJJobManager';
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
    @property
    defaultSpriteFrameUuid: string = '';
    @property
    defaultName: string = '';

    @property({ tooltip: 'disable时清除' })
    clearOnDisable: boolean = false;

    onEnable() {
        if (EDITOR) return;
        this.setSpriteFrameByDefaultSpriteFrameUuid();
    }

    onDisable() {
        this.clearOnDisable && this.a_setEmpty();
    }

    onDestroy() {
        this.a_setEmpty();
    }

    protected onDataChange(data: any) {
        this.lateSet(data);
    }

    private lateSet(data: any): void {
        this.sprite = this.sprite || this.getComponent(Sprite);
        if (this.sprite == null) return;

        if (!this.sprite.spriteAtlas && !data.atlas) {
            if (this.path != '' && data.indexOf(this.path) == -1) data = this.path + '/' + data;
            let path = `${data}/spriteFrame`;
            let uuid = no.assetBundleManager.getUuidFromPath(path);
            if (this.sprite.spriteFrame?._uuid == uuid) return;

            if (!uuid)
                no.assetBundleManager.loadSprite(path, spriteFrame => {
                    if (this.sprite?.isValid) {
                        this.sprite.spriteFrame = spriteFrame;
                    }
                });
        } else {
            if (data.atlas) {
                no.assetBundleManager.loadAtlas(data.atlas, item => {
                    this.sprite.spriteAtlas = item;
                    this.sprite.spriteFrame = this.sprite.spriteAtlas.getSpriteFrame(data.frame);
                });
            } else if (this.sprite.spriteAtlas?.spriteFrames) {
                let name = String(data).split('/').pop();
                this.sprite.spriteFrame = this.sprite.spriteAtlas.getSpriteFrame(name);
            }
        }
    }

    private setSpriteFrameByDefaultSpriteFrameUuid() {
        if (this.defaultSpriteFrameUuid) {
            no.log('setSpriteFrameByDefaultSpriteFrameUuid', this.defaultSpriteFrameUuid, this.defaultName);
            const sprite = this.getComponent(Sprite);
            no.assetBundleManager.loadByUuid<SpriteFrame>(this.defaultSpriteFrameUuid, (file) => {
                if (!file) {
                    no.err('setSpriteFrameByDefaultSpriteFrameUuid no file', this.defaultSpriteFrameUuid)
                } else
                    sprite.spriteFrame = file;
            });
        }
    }

    public a_setEmpty(): void {
        if (this.sprite)
            no.assetBundleManager.release(this.sprite.spriteFrame);
    }

    public resetSprite() {
        this.setSpriteFrameByDefaultSpriteFrameUuid();
    }

    public removeSprite() {
        const sprite = this.getComponent(Sprite);
        if (!sprite) return;
        sprite.spriteFrame = null;
        sprite.spriteAtlas = null;
        if (EDITOR && this.bind_keys) {
            this.defaultName = '';
            this.defaultSpriteFrameUuid = '';
        }
    }

    ///////EDITOR
    onLoad() {
        super.onLoad();
        if (EDITOR)
            this.sprite = this.getComponent(Sprite);
    }
    update() {
        if (!EDITOR) return;
        this.initSpriteFrameInfo();
        if (this.path == '' || this.path.indexOf('db://assets/') == -1) return;
        this.path = this.path.replace('db://assets/', '');
    }

    private initSpriteFrameInfo() {
        let name = this.getComponent(Sprite).spriteFrame?.name;
        if (!!name && this.defaultName != name) {
            this.defaultName = name;
        }
        if (this.getComponent(Sprite).spriteFrame && (!this.defaultSpriteFrameUuid || this.getComponent(Sprite).spriteFrame.uuid != this.defaultSpriteFrameUuid))
            this.defaultSpriteFrameUuid = this.getComponent(Sprite).spriteFrame.uuid;
    }
}
