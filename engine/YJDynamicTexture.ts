
import { _decorator, Label, CacheMode, Sprite, RichText, BitmapFont, RenderComponent, Material, Component, SpriteFrame } from 'cc';
import { EDITOR } from 'cc/env';
import { YJVertexColorTransition } from '../effect/YJVertexColorTransition';
import { no } from '../no';
import { YJDynamicAtlas } from './YJDynamicAtlas';
const { ccclass, property, disallowMultiple, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = DynamicTexture
 * DateTime = Tue Apr 19 2022 17:16:03 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = DynamicTexture.ts
 * FileBasenameNoExtension = DynamicTexture
 * URL = db://assets/NoUi3/engine/DynamicTexture.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 本组件同时处理了sprite和label进行合图的处理，这两者处理上有一些不同。
 * 1.sprite需要在设置纹理的同时进行合图，如果纹理设置完后过段时间再进行合图就会出现异常。
 * 2.sprite在设置纹理时不需要重置动态合图纹理。
 * 3.label需要在设置string流程走完后再进行合图。
 * 4.label在设置string前需要重置动态合图纹理。
 * 5.当节点disable时需要reset label，但不需要reset sprite，所以当再次enable时又需要对label进行合图处理
 */
@ccclass('YJDynamicTexture')
@disallowMultiple()
@executeInEditMode()
export class YJDynamicTexture extends Component {
    @property({ type: YJDynamicAtlas })
    dynamicAtlas: YJDynamicAtlas = null;
    @property
    needClear: boolean = false;

    private static commonMaterial: Material;

    public static hasCommonMaterial(): boolean {
        return !!this.commonMaterial;
    }

    public static loadCommonMaterial(url: string) {
        no.assetBundleManager.loadMaterial(url, item => {
            this.commonMaterial = item;
        });
    }

    public static setCommonMaterial(comp: RenderComponent) {
        if (comp && this.commonMaterial) {
            if (!comp.getComponent(YJVertexColorTransition)) comp.addComponent(YJVertexColorTransition);
            if (!comp.customMaterial && this.commonMaterial.effectName != comp.customMaterial?.effectName)
                comp.customMaterial = this.commonMaterial;
        }
    }

    onLoad() {
        if (!this.enabled || EDITOR) return;
        let renderComp = this.getComponent(RenderComponent);
        YJDynamicTexture.setCommonMaterial(renderComp);

        let label = this.getComponent(Label) || this.getComponent(RichText);
        // if (label && label.font instanceof BitmapFont) {
        //     let bf = this.dynamicAtlas.getBitmapFont(label.font.name);
        //     if (bf) label.font = bf;
        //     return;
        // }
        if (label && label.cacheMode != CacheMode.BITMAP) {
            label.cacheMode = CacheMode.BITMAP;
            return;
        }
        this.init();
    }

    onDisable() {
        // this.resetLabel();
    }

    public init() {
        if (!this.enabledInHierarchy) return;
        this.packSpriteFrame();
    }

    public packSpriteFrame(frame?: SpriteFrame) {
        let sprite = this.getComponent(Sprite);
        if (!this.dynamicAtlas?.isWork) {
            if (frame) {
                console.error('dynamicAtlas 为null，未做合图', frame);
                sprite.spriteFrame = frame;
            }
            return;
        }
        // if (this.needClear)
        //     this.dynamicAtlas.removeFromDynamicAtlas(sprite.spriteFrame);
        // if (!this.dynamicAtlas.usePackedFrame(sprite, frame, frame?._uuid))
        this.dynamicAtlas?.packToDynamicAtlas(sprite, frame || sprite?.spriteFrame, () => {
            if (frame) {
                sprite.spriteFrame = frame;
            }
        });
    }

    // public resetSprite(): void {
    //     if (!this.dynamicAtlas?.isWork) return;
    //     let sprite = this.getComponent(Sprite);
    //     if (this.needClear && sprite)
    //         this.dynamicAtlas?.removeFromDynamicAtlas(sprite.spriteFrame);
    // }

    // public checkSpriteFrame(uuid: string): boolean {
    //     if (!this.enabledInHierarchy) return false;
    //     if (!this.dynamicAtlas?.isWork) return false;
    //     let sprite = this.getComponent(Sprite);
    //     return this.dynamicAtlas.usePackedFrame(sprite, sprite.spriteFrame, uuid);
    // }


    // public resetLabel(): void {
    //     if (!this.dynamicAtlas?.isWork) return;
    //     let label = this.getComponent(Label);
    //     if (!label || !label.ttfSpriteFrame) return;
    //     if (label.font instanceof BitmapFont)
    //         label.font.spriteFrame._resetDynamicAtlasFrame();
    //     else if (this.needClear)
    //         this.dynamicAtlas?.removeFromDynamicAtlas(label.ttfSpriteFrame);
    //     else label.ttfSpriteFrame._resetDynamicAtlasFrame();
    //     label.ttfSpriteFrame._uuid = '';
    // }

    public packLabelFrame(text: string) {
        if (!this.dynamicAtlas?.isWork) return;
        if (!this.enabledInHierarchy) return;
        let label = this.getComponent(Label);
        if (!label) return;
        // let uuid = this.createLabelFrameUuid(label, text);
        // label.ttfSpriteFrame._uuid = uuid;
        if (this.needClear)
            this.dynamicAtlas?.removeFromDynamicAtlas(label.ttfSpriteFrame);
        else if (label.ttfSpriteFrame) {
            label.ttfSpriteFrame?._resetDynamicAtlasFrame();
            label.ttfSpriteFrame._uuid = '';
        }
        label.string = text;
    }


    public pack(): void {
        if (!this.enabledInHierarchy) return;
        if (!this.dynamicAtlas?.isWork) return;
        let label = this.getComponent(Label);
        if (!label || label.string == '') return;
        let frame = label.ttfSpriteFrame;

        if (label.font instanceof BitmapFont)
            frame = label.font.spriteFrame;
        if (!frame || frame.original)
            return;

        if (frame._uuid == '')
            frame._uuid = this.createLabelFrameUuid(label);

        this.dynamicAtlas?.packToDynamicAtlas(label, frame);
    }

    private createLabelFrameUuid(label: Label, str?: string): string {
        return (str || label.string) + "_" + label.getComponent(RenderComponent).color + "_" + label.fontSize + "_" + label.fontFamily;
    }

    update() {
        if (!EDITOR) return;

        let label = this.getComponent(Label) || this.getComponent(RichText);
        if (label && label.cacheMode != CacheMode.BITMAP) {
            label.cacheMode = CacheMode.BITMAP;
        }
    }
}
