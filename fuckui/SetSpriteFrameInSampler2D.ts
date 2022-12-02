
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

    public setDynamicAtlas() {
        if (EDITOR) {
            if (!this.loadAsset) this.loadAsset = no.getComponentInParents(this.node, YJLoadAssets);
            if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
            if (this.getComponent(Sprite).spriteAtlas)
                this.getComponent(Sprite).spriteAtlas = null;
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
            // sprite.spriteFrame = spriteFrame;
            return;
        }
        let t = `${this.defineIndex}-${i + 1}00`;
        const defines: any = {};
        defines[t] = true;
        if (this.lastDefine && this.lastDefine != t) {
            defines[this.lastDefine] = false;
        }
        this.lastDefine = t;
        this.resize(spriteFrame.width, spriteFrame.height);
        this.dynamicAtlas.setSpriteFrameInSample2D(sprite, spriteFrame);
        this.getComponent(YJVertexColorTransition).setEffect(defines);
    }

    private resize(width: number, height: number) {
        const sprite = this.getComponent(Sprite);
        if (sprite.sizeMode == Sprite.SizeMode.CUSTOM) return;
        let ut = this.getComponent(UITransform);
        ut.setContentSize(width, height);
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
        this.getComponent(Sprite).spriteAtlas = null;
    }
}