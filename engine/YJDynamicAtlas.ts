
import { _decorator, Component, SpriteFrame, Label, UIRenderer, dynamicAtlasManager, Texture2D, Sprite, BitmapFont, Node, rect, SpriteAtlas, Material, size, math, Skeleton } from 'cc';
import { EDITOR } from 'cc/env';
import { PackedFrameData, SpriteFrameDataType } from '../types';
import { Atlas } from './atlas';
import { YJShowDynamicAtlasDebug } from './YJShowDynamicAtlasDebug';
const { ccclass, property, disallowMultiple, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJDynamicAtlas
 * DateTime = Tue Apr 19 2022 15:57:55 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJDynamicAtlas.ts
 * FileBasenameNoExtension = YJDynamicAtlas
 * URL = db://assets/NoUi3/engine/YJDynamicAtlas.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 将子节点Label及特定SpriteFrame添加进入动态图集
 * 【不能与原生动态合图同时使用】。
 */
@ccclass('YJDynamicAtlas')
@disallowMultiple()
@executeInEditMode()
export class YJDynamicAtlas extends Component {
    @property({ min: 128, max: 2048, step: 1 })
    width: number = 512;
    @property({ min: 128, max: 2048, step: 1 })
    height: number = 512;
    @property(Material)
    commonMaterial: Material = null;
    @property({ visible() { return EDITOR; } })
    autoSetSubMaterial: boolean = false;
    @property({ tooltip: '文本是否合图' })
    packLabel: boolean = true;

    public atlas: Atlas;

    private spriteFrameMap: any = {};

    private waitToPackCompNum: number = 0;

    //控制合图是否旋转的总开关
    private canRotate = false;

    onDestroy() {
        for (const uuid in this.spriteFrameMap) {
            (this.spriteFrameMap[uuid] as SpriteFrame).destroy();
        }
        YJShowDynamicAtlasDebug.ins.remove(this.node.name);
        this.atlas?.destroy();
        this.atlas = null;
    }

    public get texture() {
        this.initAtlas();
        return this.atlas._texture;
    }

    private initAtlas() {
        if (!this.atlas) {
            this.atlas = new Atlas(this.width, this.height);
            YJShowDynamicAtlasDebug.ins.add(this.atlas, this.node.name);
        }
    }

    private createSpriteFrame(uuid: string, packedFrame: PackedFrameData): SpriteFrame {
        let spriteFrame = new SpriteFrame();
        spriteFrame._uuid = uuid;
        spriteFrame.originalSize = size(100, 100);
        spriteFrame.texture = packedFrame.texture;
        spriteFrame.rotated = packedFrame.rotate;
        spriteFrame.rect = rect(packedFrame.x, packedFrame.y, packedFrame.w, packedFrame.h);
        this.spriteFrameMap[uuid] = spriteFrame;
        return spriteFrame;
    }

    public getSpriteFrameInstance(uuid: string): SpriteFrame | null {
        if (!this.isWork) return null;
        let spriteFrame: SpriteFrame = this.spriteFrameMap[uuid];
        if (spriteFrame) return spriteFrame;
        let packedFrame = this.getPackedFrame(uuid);
        if (!packedFrame) return null;
        return this.createSpriteFrame(uuid, packedFrame);
    }

    public packSpriteFrame(spriteFrame: SpriteFrame, canRotate = true): SpriteFrame {
        if (!this.isWork) return null;
        let uuid = spriteFrame._uuid;
        let p = this.insertSpriteFrame(spriteFrame, this.canRotate && canRotate);
        if (!p) return null;
        return this.createSpriteFrame(uuid, p);
    }

    public getPackedFrame(uuid: string): PackedFrameData | null {
        if (!this.isWork) return null;
        this.initAtlas();
        return this.atlas.getPackedFrame(uuid);
    }

    public packAtlasToDynamicAtlas(atlas: SpriteAtlas) {
        if (!this.isWork) return;
        this.initAtlas();
        let frames = atlas.getSpriteFrames();
        if (frames[0].original) return;
        let texture = frames[0].texture as Texture2D;
        const p = this.atlas.drawTexture(texture);
        if (p) {
            frames.forEach(frame => {
                let offset = frame.rect.origin;
                let pp = {
                    x: p.x + offset.x,
                    y: p.y + offset.y,
                    texture: p.texture
                };
                frame._setDynamicAtlasFrame(pp);
            });
        }
    }

    /**
     * @en
     * Pack the sprite in the dynamic atlas and update the atlas information of the sprite frame.
     *
     * @zh
     * 将图片打入动态图集，并更新该图片的图集信息。
     *
     * @method packToDynamicAtlas
     * @param frame  the sprite frame that will be packed in the dynamic atlas.
     */
    public packToDynamicAtlas(comp: UIRenderer, frame: SpriteFrame, canRotate: boolean, onFail?: () => void) {
        if (!this.isWork || (comp instanceof Label && !this.packLabel)) {
            onFail?.();
            return;
        }

        if (frame && frame.original && frame.texture._uuid == this.atlas?._texture._uuid) {
            onFail?.();
            return;
        }

        if (frame && frame.texture && frame.texture.width > 0 && frame.texture.height > 0) {
            this.waitToPackCompNum++;
            const packedFrame = this.insertSpriteFrame(frame, this.canRotate && canRotate);
            if (packedFrame)
                this.setPackedFrame(comp, frame, packedFrame);
            else onFail?.();
        }
    }

    public removeFromDynamicAtlas(frame: SpriteFrame): void {
        if (!this.isWork || !this.atlas || !frame) return;
        this.atlas.clearTexture(frame);
        frame._resetDynamicAtlasFrame();
    }

    private setPackedFrame(comp: UIRenderer, frame: SpriteFrame, packedFrame: PackedFrameData) {
        if (packedFrame) {
            if (comp instanceof Label) {
                if (comp.font instanceof BitmapFont) {
                    let ff = frame.clone();
                    ff.rotated = packedFrame.rotate;
                    ff._setDynamicAtlasFrame(packedFrame);
                    (comp.font as BitmapFont).spriteFrame = ff;
                    comp['_texture'] = ff;
                    this.spriteFrameMap[frame._uuid] = ff;
                } else {
                    frame.rotated = packedFrame.rotate;
                    frame._setDynamicAtlasFrame(packedFrame);
                    this.spriteFrameMap[frame._uuid] = frame;
                }
            } else if (comp instanceof Sprite) {
                let ff = frame.clone();
                ff._uuid = frame._uuid;
                ff.rotated = packedFrame.rotate;
                ff._setDynamicAtlasFrame(packedFrame);
                comp.spriteFrame = ff;
                // if (!frame.original && frame.name.indexOf('default_') == -1)
                //     no.assetBundleManager.release(frame);
                this.spriteFrameMap[frame._uuid] = ff;
            }
        }
    }

    public insertSpriteFrame(spriteFrame: SpriteFrame, canRotate = false) {
        if (!spriteFrame || spriteFrame.texture._uuid == this.atlas?._texture._uuid) return null;

        // hack for pixel game,should pack to different sampler atlas
        const sampler = spriteFrame.texture.getSamplerInfo();
        if (sampler.minFilter !== 2 || sampler.magFilter !== 2 || sampler.mipFilter !== 0) {
            return null;
        }

        this.initAtlas();

        const frame = this.atlas.insertSpriteFrame(spriteFrame, this.canRotate && canRotate, () => {
            console.log(`${this.node.name}动态图集无空间！`);
        });
        return frame;
    }

    /**
     * 是否生效，当dynamicAtlasManager.enabled为true时不生效，否则生效。
     */
    public get isWork(): boolean {
        let a = !dynamicAtlasManager.enabled && this.enabled;
        return a;
    }

    public needWait(): boolean {
        return this.waitToPackCompNum == 1000;
    }

    public setSpriteFrameInSample2D(sprite: Sprite, spriteFrame: SpriteFrameDataType) {
        let newSpriteFrame = this.spriteFrameMap[spriteFrame.uuid];
        if (!newSpriteFrame) {
            newSpriteFrame = new SpriteFrame();
            newSpriteFrame.texture = this.texture;
            newSpriteFrame.originalSize = math.size(spriteFrame.width, spriteFrame.height);
            newSpriteFrame.rect = math.rect(spriteFrame.x, spriteFrame.y, spriteFrame.width, spriteFrame.height);
            newSpriteFrame.unbiasUV = spriteFrame.unbiasUV;
            newSpriteFrame.uv = spriteFrame.uv;
            newSpriteFrame.uvSliced = spriteFrame.uvSliced;
            newSpriteFrame['_capInsets'] = spriteFrame.capInsets;
            this.spriteFrameMap[spriteFrame.uuid] = newSpriteFrame;
        }
        sprite.spriteFrame = newSpriteFrame;
        sprite['_updateUVs']();
    }


    public static setDynamicAtlas(node: Node, dynamicAtlas: YJDynamicAtlas): void {
        let bs = [].concat(
            node.getComponentsInChildren('YJCreateNode'),
            node.getComponentsInChildren('SetSpriteFrameInSampler2D'),
            node.getComponentsInChildren('SetCreateCacheNode'),
            node.getComponentsInChildren('SetCreateNode'),
            node.getComponentsInChildren('SetCreateNodeByUrl'),
            node.getComponentsInChildren('SetList'),
            node.getComponentsInChildren('SetPage'),
            node.getComponentsInChildren('YJCharLabel'),
            node.getComponentsInChildren('YJDynamicTexture'),
            node.getComponentsInChildren('YJBitmapFont')
        );
        bs.forEach(b => {
            b.dynamicAtlas = dynamicAtlas;
        });

        let r = [].concat(node.getComponentsInChildren(Sprite), node.getComponentsInChildren(Label));
        r.forEach(rr => {
            if (dynamicAtlas.commonMaterial != rr.customMaterial)
                rr.customMaterial = dynamicAtlas.commonMaterial;
        });
    }


    //////////////EDITOR/////////////
    update() {
        if (!EDITOR) {
            this.waitToPackCompNum = 0;
            return;
        }
        if (!this.autoSetSubMaterial) return;
        this.autoSetSubMaterial = false;
        let renderComps = this.getComponentsInChildren(UIRenderer);
        renderComps.forEach(comp => {
            if (comp instanceof Skeleton) return;
            if (this.commonMaterial != comp.customMaterial)
                comp.customMaterial = this.commonMaterial;
        });
    }
}
