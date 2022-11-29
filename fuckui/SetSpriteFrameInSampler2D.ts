
import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, math } from 'cc';
import { EDITOR } from 'cc/env';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { YJVertexColorTransition } from '../effect/YJVertexColorTransition';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, requireComponent, disallowMultiple } = _decorator;

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
    @property({ editorOnly: true })
    defaultSpriteFrameUuid: string = '';
    @property
    defaultName: string = '';
    @property({ readonly: true, tooltip: '用于判断顶点数据类型，0为color类型，1为坐标类型。而shader中具体使用哪个贴图，需要通过atlases的下标+1来判断', visible() { return false; } })
    defineIndex: number = 0;
    @property({ type: YJLoadAssets, readonly: true })
    loadAsset: YJLoadAssets = null;
    @property({ type: YJDynamicAtlas, readonly: true })
    dynamicAtlas: YJDynamicAtlas = null;

    private lastDefine: string;

    onLoad() {
        super.onLoad();
        if (EDITOR) {
            if (!this.loadAsset) this.loadAsset = no.getComponentInParents(this.node, YJLoadAssets);
            if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
        }
    }

    update() {
        if (EDITOR) {
            let name = this.getComponent(Sprite).spriteFrame?.name;
            if (!!name && this.defaultName != name) {
                this.defaultName = name;
            }
            if (this.getComponent(Sprite).spriteFrame && (!this.defaultSpriteFrameUuid || this.getComponent(Sprite).spriteFrame._uuid != this.defaultSpriteFrameUuid))
                this.defaultSpriteFrameUuid = this.getComponent(Sprite).spriteFrame._uuid;
        }
    }

    start() {
        if (EDITOR) return;
        if (!this.dynamicAtlas) return;
        if (this.defaultName) this.setSpriteFrame(this.defaultName);
    }

    onDataChange(data: any) {
        let name = String(data).split('/').pop();
        this.setSpriteFrame(name);
    }

    public async setSpriteFrame(name: string) {
        if (!this.loadAsset) return;
        const [i, spriteFrame] = await this.loadAsset.getSpriteFrameInAtlas(name);
        if (!spriteFrame) {
            no.log('setSpriteFrame not get', name);
            return;
        }
        let sprite = this.getComponent(Sprite);
        if (sprite.type == Sprite.Type.FILLED) {
            sprite.spriteFrame = spriteFrame;
            return;
        }
        this.setTexture();
        let t = `${this.defineIndex}-${i + 1}00`;
        const defines: any = {};
        defines[t] = true;
        if (this.lastDefine && this.lastDefine != t) {
            defines[this.lastDefine] = false;
        }
        this.lastDefine = t;
        // no.log('setSpriteFrame get', name, i, JSON.stringify(defines));
        let rect = spriteFrame.rect;
        this.resize(rect.width, rect.height);
        sprite.spriteFrame.unbiasUV = spriteFrame.unbiasUV;
        sprite.spriteFrame.uv = spriteFrame.uv;
        sprite.spriteFrame.uvSliced = spriteFrame.uvSliced;
        sprite.spriteFrame['_capInsets'] = spriteFrame['_capInsets'];
        sprite['_updateUVs']();
        this.getComponent(YJVertexColorTransition).setEffect(defines);
    }

    private resize(width: number, height: number) {
        const sprite = this.getComponent(Sprite);
        if (sprite.sizeMode == Sprite.SizeMode.CUSTOM) return;
        let ut = this.getComponent(UITransform);
        ut.setContentSize(width, height);
    }

    private setTexture() {
        if (this.getComponent(Sprite)?.spriteFrame?.texture?._uuid == this.dynamicAtlas.texture._uuid) return;
        let spriteFrame = new SpriteFrame();
        spriteFrame.texture = this.dynamicAtlas.texture;
        spriteFrame.rect = math.rect(0, 0, this.dynamicAtlas.width, this.dynamicAtlas.height);
        this.getComponent(Sprite).spriteFrame = spriteFrame;
    }

    public a_setEmpty(): void {
        if (this.getComponent(Sprite).spriteFrame)
            this.getComponent(Sprite).spriteFrame = null;
    }

    public resetSprite() {
        if (!EDITOR) return;
        if (this.defaultSpriteFrameUuid)
            no.assetBundleManager.loadByUuid<SpriteFrame>(this.defaultSpriteFrameUuid, SpriteFrame, (file) => {
                this.getComponent(Sprite).spriteFrame = file;
            });
    }

    public removeSprite() {
        if (!EDITOR) return;
        this.getComponent(Sprite).spriteFrame = null;
    }
}