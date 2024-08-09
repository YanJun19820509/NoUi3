
import {
    EDITOR, ccclass, property, disallowMultiple, SpriteFrame, Label, UIRenderer, Texture2D,
    Sprite, BitmapFont, Node, rect, SpriteAtlas, Material, size, director, dynamicAtlasManager, Skeleton,
    Graphics,
    Component
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
export class YJDynamicAtlas extends Component {
    @property({ type: Material })
    customMaterial: Material = null;
    @property({ visible() { return false; } })
    public get createMaterial(): boolean {
        return false;
    }

    public set createMaterial(v: boolean) {
        const material = this.customMaterial;
        if (!material) {
            const prefab = this.node['_prefab'].asset;
            no.EditorMode.getAssetUrlByUuid(prefab.uuid).then(url => {
                const path = url.replace('.prefab', '.mtl');
                Editor.Message.request('asset-db', 'copy-asset', 'db://assets/NoUi3/effect/_temp_material.mtl', path).then(info => {
                    no.EditorMode.loadAnyFile<Material>(path).then(m => {
                        this.customMaterial = m;
                        this.setSubMaterial = true;
                    });
                });
            });
        }
    }
    @property({ min: 1, max: 2048, step: 1 })
    width: number = 512;
    @property({ min: 1, max: 2048, step: 1 })
    height: number = 512;
    @property
    public get setSubMaterial(): boolean {
        return false;
    }

    public set setSubMaterial(v: boolean) {
        let renderComps = this.getComponentsInChildren(UIRenderer);
        renderComps.forEach(comp => {
            if (comp instanceof Skeleton) return;
            if (comp instanceof Graphics) return;
            if (!comp.customMaterial && comp.getComponent('SetSpriteFrameInSampler2D')?.['loadFromAtlas'])
                comp.customMaterial = this.customMaterial;
        });
    }
    @property
    public get clearSubMaterial(): boolean {
        return false;
    }

    public set clearSubMaterial(v: boolean) {
        let renderComps = this.getComponentsInChildren(UIRenderer);
        renderComps.forEach(comp => {
            if (comp instanceof Skeleton) return;
            if (comp instanceof Graphics) return;
            if (this.customMaterial == comp.customMaterial)
                comp.customMaterial = null;
        });
        this.customMaterial = null;
    }
    @property({ tooltip: '文本是否合图' })
    packLabel: boolean = true;

    public atlas: Atlas;

    private spriteFrameMap: any = {};

    //控制合图是否旋转的总开关
    private canRotate = false;

    private thisNodeName: string;

    onLoad() {
        this.thisNodeName = no.getPrototype(this.node.getComponent('PopuPanelContent') || this.node.getComponent('YJPanel'))?.name || this.node.name;
    }

    onDestroy() {
        for (const key in this.spriteFrameMap) {
            (this.spriteFrameMap[key] as SpriteFrame).destroy();
        }
        YJShowDynamicAtlasDebug.ins.remove(this.thisNodeName);
        this.atlas?.destroy();
        this.atlas = null;
    }

    // public get texture() {
    //     this.initAtlas();
    //     return this.atlas._texture;
    // }

    public get spriteTexture() {
        this.initAtlas();
        return this.atlas._texture;
    }

    private initAtlas() {
        if (!this.atlas) {
            this.atlas = new Atlas(this.width, this.height, this.node.name);
            YJShowDynamicAtlasDebug.ins.add(this.atlas, this.thisNodeName);
        }
    }

    private createSpriteFrame(uuid: string, packedFrame: PackedFrameData): SpriteFrame {
        let spriteFrame = new SpriteFrame();
        spriteFrame._uuid = uuid;
        spriteFrame.originalSize = size(10, 10);
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

    public packBitmapFontSpriteFrameToDynamicAtlas(bf: BitmapFont, canRotate?: boolean, onSuccess?: (bf: BitmapFont) => void, onFail?: () => void) {
        if (!this.isWork) {
            onFail?.();
            return;
        }
        const frame = bf.spriteFrame;
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
            no.setValueSafely(this.spriteFrameMap, { [frame.uuid]: ff });

            let font = new BitmapFont();
            font.name = bf.name;
            font.fntConfig = bf.fntConfig;
            font.fontDefDictionary = bf.fontDefDictionary;
            font.fontSize = bf.fontSize;
            font.spriteFrame = ff;
            onSuccess?.(font);
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
        // const sampler = spriteFrame.texture.getSamplerInfo();
        // if (sampler.minFilter !== 2 || sampler.magFilter !== 2 || sampler.mipFilter !== 0) {
        //     return null;
        // }

        this.initAtlas();

        const frame = this.atlas.insertSpriteFrame(spriteFrame, this.canRotate && canRotate, () => {
            no.err(`${this.thisNodeName}动态图集无空间！`);
        });
        return frame;
    }

    /**
     * 是否生效，当dynamicAtlasManager.enabled为true时不生效，否则生效。
     */
    public get isWork(): boolean {
        //ios微信不支持合图
        if (no.notUseDynamicAtlas) return false;
        let a = !dynamicAtlasManager.enabled && this.enabled && !EDITOR;
        return a;
    }

    public setSpriteFrameInSample2D(sprite: Sprite, spriteFrame: SpriteFrameDataType, name: string) {
        const sf = this.createSpriteFrameInSample2D(spriteFrame);
        sprite.spriteFrame = sf;
        sprite['_assembler']?.updateRenderData(sprite);
        this.spriteFrameMap[name] = sf;
    }

    public setCachedSpriteFrameInSample2D(sprite: Sprite, name: string): boolean {
        const sf = this.spriteFrameMap[name];
        if (sf) {
            sprite.spriteFrame = sf;
            sprite['_assembler']?.updateRenderData(sprite);
            // sprite['_updateUVs']();
            return true;
        }
        return false;
    }

    private createSpriteFrameInSample2D(spriteFrame: SpriteFrameDataType): SpriteFrame {
        let newSpriteFrame: SpriteFrame = new SpriteFrame();
        newSpriteFrame['_uuid'] = spriteFrame.uuid;
        newSpriteFrame.texture = this.spriteTexture;
        newSpriteFrame.originalSize = size(spriteFrame.originalSize[0], spriteFrame.originalSize[1]);
        newSpriteFrame.rect = rect(spriteFrame.rect[0], spriteFrame.rect[1], spriteFrame.rect[2], spriteFrame.rect[3]);
        newSpriteFrame.uv = spriteFrame.uv;
        newSpriteFrame['_rotated'] = spriteFrame.rotated;
        newSpriteFrame['_w'] = spriteFrame.textureSize[0];
        newSpriteFrame['_h'] = spriteFrame.textureSize[1];
        if (spriteFrame.uvSliced) {
            newSpriteFrame.uvSliced = spriteFrame.uvSliced;
            newSpriteFrame['_capInsets'] = spriteFrame.capInsets || [0, 0, 0, 0];
        } else {
            newSpriteFrame.uvSliced = this.defaultUVSliced(spriteFrame.uv, false);
            newSpriteFrame['_capInsets'] = [0, 0, 0, 0];
        }
        return newSpriteFrame;
    }

    private defaultUVSliced(uv: number[], rotated: boolean) {
        if (!rotated) {
            return [
                { u: uv[0], v: uv[1] },
                { u: uv[0], v: uv[1] },
                { u: uv[2], v: uv[3] },
                { u: uv[2], v: uv[3] },
                { u: uv[0], v: uv[1] },
                { u: uv[0], v: uv[1] },
                { u: uv[2], v: uv[3] },
                { u: uv[2], v: uv[3] },
                { u: uv[4], v: uv[5] },
                { u: uv[4], v: uv[5] },
                { u: uv[6], v: uv[7] },
                { u: uv[6], v: uv[7] },
                { u: uv[4], v: uv[5] },
                { u: uv[4], v: uv[5] },
                { u: uv[6], v: uv[7] },
                { u: uv[6], v: uv[7] }
            ];
        } else {
            return [
                { u: uv[4], v: uv[5] },
                { u: uv[4], v: uv[5] },
                { u: uv[0], v: uv[1] },
                { u: uv[0], v: uv[1] },
                { u: uv[4], v: uv[5] },
                { u: uv[4], v: uv[5] },
                { u: uv[0], v: uv[1] },
                { u: uv[0], v: uv[1] },
                { u: uv[6], v: uv[7] },
                { u: uv[6], v: uv[7] },
                { u: uv[2], v: uv[3] },
                { u: uv[2], v: uv[3] },
                { u: uv[6], v: uv[7] },
                { u: uv[6], v: uv[7] },
                { u: uv[2], v: uv[3] },
                { u: uv[2], v: uv[3] }
            ];
        }
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

        // let r: UIRenderer[] = [].concat(node.getComponentsInChildren(Sprite));
        // r.forEach(rr => {
        //     if (!rr.customMaterial) {
        //         rr.customMaterial = dynamicAtlas.customMaterial;
        //     }
        // });
    }

    public setMaterialTextures(textureUuids: string[]) {
        if (!EDITOR) return;
        const material = this.customMaterial;
        if (material) {
            let props: any = {};
            textureUuids.forEach((uuid, i) => {
                const key = `atlas${i}`;//空出atlas0，用于放多语言
                props[key] = {
                    "__uuid__": uuid,
                    "__expectedType__": "cc.Texture2D"
                };
            });
            this.setSubMaterial = true;

            const fs = require('fs');
            Editor.Message.request('asset-db', 'query-asset-info', material.uuid).then(info => {
                console.log(info);
                let json = JSON.parse(fs.readFileSync(info.file));
                json['_props'] = [props];
                fs.writeFileSync(info.file, JSON.stringify(json, null, 2));
            });
        }
    }
}
