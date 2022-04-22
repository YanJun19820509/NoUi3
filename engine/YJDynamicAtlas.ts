
import { _decorator, Component, SpriteFrame, RichText, Label, RenderComponent, Sprite, Renderable2D, dynamicAtlasManager } from 'cc';
import { EDITOR } from 'cc/env';
import { Atlas } from './atlas';
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
    autoFindDynamicTextures: boolean = false;

    private atlas: Atlas;
    private needInit: boolean = false;

    onLoad() {
        this.needInit = false;
    }

    onEnable() {
        if (!this.isWork) return;
        if (!this.needInit) return;
        this.getComponentsInChildren('YJDynamicTexture').forEach((a: any) => {
            a.init();
        });
    }

    onDisable() {
        if (!this.isWork) return;
        this.needInit = true;
        this.getComponentsInChildren('YJDynamicTexture').forEach((a: any) => {
            a.reset();
        });
    }

    public clear(): void {
        this.atlas?.destroy();
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
    public packToDynamicAtlas(comp: Renderable2D, frame: SpriteFrame) {
        if (!this.isWork) return;
        if (frame && !frame.original && frame.texture && frame.texture.width > 0 && frame.texture.height > 0) {
            if (comp instanceof Label || comp instanceof RichText) {
                if (comp.string == '') return;
                frame._uuid = comp.string + "_" + comp.node.getComponent(RenderComponent).color + "_" + comp.fontSize + comp.fontFamily;
            }
            const packedFrame = this.insertSpriteFrame(frame);
            if (packedFrame) {
                frame._setDynamicAtlasFrame(packedFrame);
                if (comp instanceof Label) {
                    comp['_assembler'].updateVertexData(comp);
                    comp['_assembler'].updateUVs(comp);
                }
                comp.setTextureDirty();
                comp.renderData.updateRenderData(comp, frame);
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
        console.log(`YJDynamicAtlas isWork::${a}`);
        return a;
    }

    //////////////EDITOR/////////////
    update() {
        if (!this.autoFindDynamicTextures) return;
        this.autoFindDynamicTextures = false;
        this.getComponentsInChildren('YJDynamicTexture').forEach((a: any) => {
            a.dynamicAtlas = this;
        });
    }
}
