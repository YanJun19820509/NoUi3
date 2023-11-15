
import {
    EDITOR, ccclass, property, disallowMultiple, executeInEditMode, Component, SpriteFrame, Label, UIRenderer, Texture2D,
    Sprite, BitmapFont, Node, rect, SpriteAtlas, Material, size, director, dynamicAtlasManager, Skeleton, v2
} from '../yj';
import { PackedFrameData, SpriteFrameDataType } from '../types';
import { Atlas, DynamicAtlasTexture } from './atlas';
import { YJShowDynamicAtlasDebug } from './YJShowDynamicAtlasDebug';
import { no } from '../no';

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
export class YJDynamicAtlas extends UIRenderer {
    @property({ min: 1, max: 2048, step: 1 })
    width: number = 64;
    @property({ min: 1, max: 2048, step: 1 })
    height: number = 64;
    @property({ visible() { return EDITOR; } })
    autoSetSubMaterial: boolean = false;
    @property({ tooltip: '文本是否合图' })
    packLabel: boolean = true;

    public atlas: Atlas;

    private spriteFrameMap: any = {};

    //控制合图是否旋转的总开关
    private canRotate = false;

    private thisNodeName: string;

    private _spriteTexture: DynamicAtlasTexture;

    onLoad() {
        this.thisNodeName = this.node.name;
    }

    onDestroy() {
        for (const uuid in this.spriteFrameMap) {
            (this.spriteFrameMap[uuid] as SpriteFrame).destroy();
        }
        YJShowDynamicAtlasDebug.ins.remove(this.thisNodeName);
        this.atlas?.destroy();
        this.atlas = null;
        this._spriteTexture?.destroy();
    }

    public get texture() {
        this.initAtlas();
        return this.atlas._texture;
    }

    public get spriteTexture() {
        this.initAtlas();
        return this._spriteTexture;
    }

    private initAtlas() {
        if (!this.atlas) {
            this.atlas = new Atlas(this.width, this.height);
            YJShowDynamicAtlasDebug.ins.add(this.atlas, this.thisNodeName);
            this._spriteTexture = new DynamicAtlasTexture();
            this._spriteTexture.initWithSize(1, 1);
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
        if (!this.isWork || !spriteFrame) return null;
        let uuid = spriteFrame.uuid;
        if (!this.insertSpriteFrame(spriteFrame, this.canRotate && canRotate)) return null;
        return this.getSpriteFrameInstance(uuid);
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
            const packedFrame = this.insertSpriteFrame(frame, this.canRotate && canRotate);
            if (packedFrame)
                this.setPackedFrame(comp, frame, packedFrame);
            else onFail?.();
        }
    }

    public packCanvasToDynamicAtlas(comp: UIRenderer, uuid: string, canvas: HTMLCanvasElement, onFail?: () => void) {
        if (!this.isWork) {
            onFail?.();
            return;
        }
        this.initAtlas();
        const p = this.atlas.drawCanvas(canvas, uuid);
        if (p) {
            this.setPackedFrame(comp, null, p, uuid);
        } else onFail?.();
    }

    public packBitmapFontSpriteFrameToDynamicAtlas(font: BitmapFont, frame: SpriteFrame, canRotate?: boolean, onFail?: () => void) {
        if (!this.isWork) {
            onFail?.();
            return;
        }
        if (frame && frame.original && frame.texture._uuid == this.atlas?._texture._uuid) {
            onFail?.();
            return;
        }
        const packedFrame = this.insertSpriteFrame(frame, this.canRotate && canRotate);
        if (packedFrame) {
            let ff = frame.clone();
            ff._uuid = frame.uuid;
            ff.rotated = packedFrame.rotate;
            ff._setDynamicAtlasFrame(packedFrame);
            font.spriteFrame = ff;
            no.setValueSafely(this.spriteFrameMap, { [frame.uuid]: ff });
        } else onFail?.();
    }

    public removeFromDynamicAtlas(frame: SpriteFrame): void {
        if (!this.isWork || !this.atlas || !frame) return;
        this.atlas.clearTexture(frame);
        frame._resetDynamicAtlasFrame();
    }

    private setPackedFrame(comp: UIRenderer, frame: SpriteFrame, packedFrame: PackedFrameData, _uuid?: string) {
        if (!this.spriteFrameMap) return;
        if (packedFrame) {
            const uuid = _uuid || frame._uuid;
            if (comp instanceof Label) {
                if (!comp.customMaterial)
                    comp.customMaterial = this.customMaterial;
                if (comp.font instanceof BitmapFont) {
                    let ff = frame.clone();
                    ff.rotated = packedFrame.rotate;
                    ff._setDynamicAtlasFrame(packedFrame);
                    (comp.font as BitmapFont).spriteFrame = ff;
                    // comp['_texture'] = ff;
                    // comp['_ttfSpriteFrame'] = null;
                    // const renderData = comp['_renderData'];
                    // renderData.textureDirty = true;
                    comp.markForUpdateRenderData(true);
                    comp['_assembler'].updateRenderData(comp);
                    // renderData.updateRenderData(comp, ff);
                    director.root.batcher2D.forceMergeBatches(comp.customMaterial, ff, comp);
                    no.setValueSafely(this.spriteFrameMap, { [uuid]: ff });
                } else {
                    frame.rotated = packedFrame.rotate;
                    frame._setDynamicAtlasFrame(packedFrame);
                    const renderData = comp['_renderData'];
                    const vData = renderData.chunk.vb;
                    const uv = comp['_ttfSpriteFrame'].uv;
                    vData[3] = uv[0];
                    vData[4] = uv[1];
                    vData[12] = uv[2];
                    vData[13] = uv[3];
                    vData[21] = uv[4];
                    vData[22] = uv[5];
                    vData[30] = uv[6];
                    vData[31] = uv[7];
                    renderData.textureDirty = true;
                    comp.markForUpdateRenderData(false);
                    renderData.updateRenderData(comp, comp['_ttfSpriteFrame']);

                    director.root.batcher2D.forceMergeBatches(comp.customMaterial, frame, comp);
                    no.setValueSafely(this.spriteFrameMap, { [uuid]: frame });
                }
            } else if (comp instanceof Sprite) {
                let ff = frame?.clone() || new SpriteFrame();
                ff._uuid = uuid;
                ff.rotated = packedFrame.rotate;
                if (!ff.rect.width || !ff.rect.height) {
                    ff.rect = rect(0, 0, packedFrame.w, packedFrame.h);
                }
                ff._setDynamicAtlasFrame(packedFrame);
                comp.spriteFrame = ff;
                no.setValueSafely(this.spriteFrameMap, { [uuid]: ff });
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
            console.log(`${this.thisNodeName}动态图集无空间！`);
        });
        return frame;
    }

    /**
     * 是否生效，当dynamicAtlasManager.enabled为true时不生效，否则生效。
     */
    public get isWork(): boolean {
        let a = !dynamicAtlasManager.enabled && this.enabled && !EDITOR;
        return a;
    }

    public setSpriteFrameInSample2D(sprite: Sprite, spriteFrame: SpriteFrameDataType) {
        sprite.spriteFrame = this.getSpriteFrameInSample2D(spriteFrame);
        sprite['_updateUVs']();
    }

    public getSpriteFrameInSample2D(spriteFrame: SpriteFrameDataType): SpriteFrame {
        let newSpriteFrame: SpriteFrame = this.spriteFrameMap[spriteFrame.uuid];
        if (!newSpriteFrame) {
            newSpriteFrame = new SpriteFrame();
            newSpriteFrame.texture = this.spriteTexture;
            newSpriteFrame.originalSize = size(spriteFrame.width, spriteFrame.height);
            newSpriteFrame.rect = rect(spriteFrame.x, spriteFrame.y, spriteFrame.width, spriteFrame.height);
            newSpriteFrame.uv = spriteFrame.uv;
            newSpriteFrame.uvSliced = spriteFrame.uvSliced;
            newSpriteFrame['_capInsets'] = spriteFrame.capInsets;
            this.spriteFrameMap[spriteFrame.uuid] = newSpriteFrame;
            newSpriteFrame['_rotated'] = spriteFrame.rotated;
        }
        return newSpriteFrame;
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
            if (!b.dynamicAtlas)
                b.dynamicAtlas = dynamicAtlas;
        });

        let r: UIRenderer[] = [].concat(node.getComponentsInChildren(Sprite));
        r.forEach(rr => {
            if (!rr.customMaterial) {
                rr.customMaterial = dynamicAtlas.customMaterial;
            }
        });
    }


    //////////////EDITOR/////////////
    update() {
        if (!EDITOR) {
            return;
        }
        if (!this.autoSetSubMaterial) return;
        this.autoSetSubMaterial = false;
        let renderComps = this.getComponentsInChildren(UIRenderer);
        renderComps.forEach(comp => {
            if (comp instanceof Skeleton) return;
            if (this.customMaterial != comp.customMaterial)
                comp.customMaterial = this.customMaterial;
        });
    }
}
