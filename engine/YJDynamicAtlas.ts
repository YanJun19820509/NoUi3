
import { _decorator, Component, SpriteFrame, RichText, Label, Renderable2D, dynamicAtlasManager, Texture2D, Sprite, BitmapFont, Node } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../no';
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
    @property({ visible() { return EDITOR; } })
    autoSetDynamicTextures: boolean = false;

    private atlas: Atlas;

    onDestroy() {
        YJShowDynamicAtlasDebug.ins.remove(this.node.name);
        this.atlas?.destroy();
        this.atlas = null;
    }

    public usePackedFrame(comp: Renderable2D, frame: SpriteFrame, uuid: string): boolean {
        // return false;
        if (!comp || !frame) return false;
        const packedFrame = this.atlas.getPackedFrame(uuid);
        if (!packedFrame) return false;
        frame._resetDynamicAtlasFrame();
        frame._setDynamicAtlasFrame(packedFrame);
        let rect = frame.rect;
        rect.width = packedFrame.w;
        rect.height = packedFrame.h;
        frame.rect = rect;
        // if (comp instanceof Label)
        //     comp.updateRenderData(true);
        // else 
        if (comp instanceof Sprite)
            comp.markForUpdateRenderData(true);
        return true;
    }


    public packAtlasToDynamicAtlas(frames: SpriteFrame[]) {
        if (!this.isWork) return;
        if (!this.atlas) {
            this.atlas = new Atlas(this.width, this.height);
            YJShowDynamicAtlasDebug.ins.add(this.atlas, this.node.name);
        }
        let texture = frames[0].texture as Texture2D;
        const p = this.atlas.drawAtlasTexture(texture);
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
    public packToDynamicAtlas(comp: Renderable2D, frame: SpriteFrame, onFail?: () => void) {
        if (!this.isWork) return;
        if (!this.atlas) {
            this.atlas = new Atlas(this.width, this.height);
            YJShowDynamicAtlasDebug.ins.add(this.atlas, this.node.name);
        }

        if (frame && !frame.original && frame.texture && frame.texture.width > 0 && frame.texture.height > 0) {
            const packedFrame = this.insertSpriteFrame(frame);
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

    private setPackedFrame(comp: Renderable2D, frame: SpriteFrame, packedFrame: any) {
        if (packedFrame) {
            if (comp instanceof Label) {
                if (comp.font instanceof BitmapFont) {
                    let ff = frame.clone();
                    ff._setDynamicAtlasFrame(packedFrame);
                    (comp.font as BitmapFont).spriteFrame = ff;
                    comp['_texture'] = ff;
                } else frame._setDynamicAtlasFrame(packedFrame);
            } else if (comp instanceof Sprite) {
                let ff = frame.clone();
                ff._setDynamicAtlasFrame(packedFrame);
                comp.spriteFrame = ff;
                // comp.setTextureDirty();
                // comp.renderData.updateRenderData(comp, ff);
                if (frame.name.indexOf('default_') == -1)
                    no.assetBundleManager.release(frame);
            }
        }
    }

    private insertSpriteFrame(spriteFrame: SpriteFrame) {
        if (!spriteFrame || spriteFrame.original) return null;

        // hack for pixel game,should pack to different sampler atlas
        const sampler = spriteFrame.texture.getSamplerInfo();
        if (sampler.minFilter !== 2 || sampler.magFilter !== 2 || sampler.mipFilter !== 0) {
            return null;
        }
        if (!this.atlas) this.atlas = new Atlas(this.width, this.height);

        const frame = this.atlas.insertSpriteFrame(spriteFrame, () => {
            console.log(`${this.node.name}动态图集无空间！`);
        });
        return frame;
    }

    /**
     * 是否生效，当dynamicAtlasManager.enabled为true时不生效，否则生效。
     */
    public get isWork(): boolean {
        let a = !dynamicAtlasManager.enabled;
        return a;
    }

    public static setDynamicAtlasToRenderComponent(node: Node, dynamicAtlas: YJDynamicAtlas): void {
        let comps = [].concat(node.getComponentsInChildren(Label), node.getComponentsInChildren(Sprite), node.getComponentsInChildren(RichText));
        comps.forEach(comp => {
            let a: any = comp.getComponent('YJDynamicTexture') || comp.addComponent('YJDynamicTexture');
            a.dynamicAtlas = dynamicAtlas;
        });
    }

    public static setDynamicAtlas(node: Node, dynamicAtlas: YJDynamicAtlas): void {
        let bs = [].concat(
            node.getComponentsInChildren('YJCreateNode'),
            node.getComponentsInChildren('SetCreateCacheNode'),
            node.getComponentsInChildren('SetCreateNode'),
            node.getComponentsInChildren('SetCreateNodeByUrl'),
            node.getComponentsInChildren('SetList'),
            node.getComponentsInChildren('SetPage'),
            node.getComponentsInChildren('YJCharLabel'),
            node.getComponentsInChildren('YJDynamicTexture')
        );
        bs.forEach(b => {
            b.dynamicAtlas = dynamicAtlas;
        });
    }


    //////////////EDITOR/////////////
    update() {
        if (!EDITOR) return;
        if (!this.autoSetDynamicTextures) return;
        this.autoSetDynamicTextures = false;
        YJDynamicAtlas.setDynamicAtlasToRenderComponent(this.node, this);
        YJDynamicAtlas.setDynamicAtlas(this.node, this);
    }
}
