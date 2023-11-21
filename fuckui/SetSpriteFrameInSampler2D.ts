
import { ccclass, property, requireComponent, disallowMultiple, EDITOR, Material, Sprite, SpriteFrame, UITransform, JSB, sys, size, rect } from '../yj';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { YJVertexColorTransition } from '../effect/YJVertexColorTransition';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetSpriteFrameInSampler2D
 * DateTime = Tue Nov 15 2022 22:25:51 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpriteFrameInSampler2D.ts
 * FileBasenameNoExtension = SetSpriteFrameInSampler2D
 * URL = db://assets/Script/NoUi3/fuckui/SetSpriteFrameInSampler2D.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 用于设置材质中挂载的纹理采样的区域
 * data:string,为指定spriteFrame的名称
 */

@ccclass('SetSpriteFrameInSampler2D')
@requireComponent([Sprite, YJVertexColorTransition])
@disallowMultiple()
export class SetSpriteFrameInSampler2D extends FuckUi {
    @property
    defaultSpriteFrameUuid: string = '';
    @property
    defaultName: string = '';
    @property({ type: YJLoadAssets, readonly: true })
    loadAsset: YJLoadAssets = null;
    @property({ type: YJDynamicAtlas, readonly: true })
    dynamicAtlas: YJDynamicAtlas = null;

    private lastDefine: string;

    private defineIndex: number = 0;

    onLoad() {
        super.onLoad();
        this.setDynamicAtlas();
    }

    update() {
        this.initSpriteFrameInfo();
    }

    onEnable() {
        if (this.defaultName) this.setSpriteFrame(this.defaultName);
    }

    onDisable() {
        this.a_setEmpty();
    }

    public setDynamicAtlas() {
        if (EDITOR) {
            if (!this.loadAsset) this.loadAsset = no.getComponentInParents(this.node, YJLoadAssets);
            if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
            if (this.getComponent(Sprite).spriteAtlas)
                this.getComponent(Sprite).spriteAtlas = null;
        } else if (!this.getComponent(Sprite).customMaterial) {
            this.getComponent(Sprite).customMaterial = this.dynamicAtlas?.customMaterial;
        }
    }

    public initSpriteFrameInfo() {
        if (!EDITOR) return;
        let name = this.getComponent(Sprite).spriteFrame?.name;
        if (!!name && this.defaultName != name) {
            this.defaultName = name;
        }
        if (this.getComponent(Sprite).spriteFrame && (!this.defaultSpriteFrameUuid || this.getComponent(Sprite).spriteFrame._uuid != this.defaultSpriteFrameUuid))
            this.defaultSpriteFrameUuid = this.getComponent(Sprite).spriteFrame._uuid;
    }

    onDataChange(data: any) {
        let name = String(data).split('/').pop();
        this.setSpriteFrame(name);
    }

    public setSpriteFrame(name: string) {
        if (!this.enabled || !this.dynamicAtlas) return;
        if (!this.loadAsset) {
            this.resetSprite();
            return;
        }
        if (name == '') {
            this.a_setEmpty();
            return;
        }
        if (this.defaultName != name) this.defaultName = name;
        const sprite = this.getComponent(Sprite);
        if (sprite.type == Sprite.Type.FILLED) {
            // sprite.spriteFrame = spriteFrame;
            return;
        }
        if (!sprite.customMaterial) {
            sprite.customMaterial = this.dynamicAtlas?.customMaterial;
        }
        if (sys.platform != sys.Platform.DESKTOP_BROWSER) {
            this.setSpriteFrameForNotWeb(name)
            return;
        }
        const [i, spriteFrame] = this.loadAsset.getSpriteFrameInAtlas(name);
        if (!spriteFrame) {
            no.err('setSpriteFrame not get', name);
            this.resetSprite();
            return;
        }
        let t = `${this.defineIndex}-${i + 1}00`;
        const defines: any = {};
        defines[t] = true;
        if (this.lastDefine && this.lastDefine != t) {
            defines[this.lastDefine] = false;
        }
        this.lastDefine = t;
        this.dynamicAtlas.setSpriteFrameInSample2D(sprite, spriteFrame);
        this.getComponent(YJVertexColorTransition).setEffect(defines);
    }

    private setSpriteFrameForNotWeb(name: string) {
        const sprite = this.getComponent(Sprite);
        this.loadAsset.getSpriteFrame(name, sf => {
            sprite.spriteFrame = sf;
        });
    }

    public a_setEmpty(): void {
        this.removeSprite();
    }

    public resetSprite() {
        if (this.defaultSpriteFrameUuid)
            no.assetBundleManager.loadByUuid<SpriteFrame>(this.defaultSpriteFrameUuid, SpriteFrame, (file) => {
                this.getComponent(Sprite).spriteFrame = file;
            });
        else this.removeSprite();
    }

    public removeSprite() {
        this.getComponent(Sprite).spriteFrame = null;
        this.getComponent(Sprite).spriteAtlas = null;
    }

    public setSpriteEnable(v: boolean) {
        if (!this.enabled) return;
        this.getComponent(Sprite).enabled = v;
    }

    public setSpriteMaterial(material: Material) {
        this.getComponent(Sprite).customMaterial = material;
    }
}