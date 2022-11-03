
import { _decorator, Label, CacheMode, Sprite, RichText, BitmapFont, RenderComponent, Material, Component, SpriteFrame, LabelOutline, rect, UITransform } from 'cc';
import { EDITOR } from 'cc/env';
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
    @property
    canRotate: boolean = true;

    // private _needInit: boolean = true;

    onLoad() {
        if (!this.enabled) return;
        if (EDITOR) {
            if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);

            let label = this.getComponent(Label) || this.getComponent(RichText);
            if (label && label.cacheMode != CacheMode.BITMAP) {
                label.cacheMode = CacheMode.BITMAP;
            }
            this.setCommonMaterial();
        }
    }

    start() {
        // this._needInit = true;

        this.scheduleOnce(() => {
            this.init();
        }, 0.2);
    }

    // lateUpdate() {
    //     // if (this._needInit) {
    //     //     this._needInit = false;
    //     //     this.init();
    //     // }
    // }

    public init() {
        if (!this.enabledInHierarchy) return;
        this.packSpriteFrame();
    }

    public packSpriteFrame(frame?: SpriteFrame) {
        let sprite = this.getComponent(Sprite);
        if (!sprite) return;
        if (!this.enabled || !this.dynamicAtlas?.isWork) {
            if (frame) {
                console.error('dynamicAtlas 为null，未做合图', frame);
                sprite.spriteFrame = frame;
            }
            return;
        }
        frame = frame || sprite?.spriteFrame;
        if (!frame) return;
        if (this.dynamicAtlas?.needWait()) {
            this.scheduleOnce(() => {
                this.packSpriteFrame(frame);
            });
            return;
        }
        this.dynamicAtlas?.packToDynamicAtlas(sprite, frame, this.canRotate, () => {
            sprite.spriteFrame = frame;
        });
    }

    public removeFrameFromDynamicAtlas(frame?: SpriteFrame): void {
        if (!frame) return;
        if (this.needClear)
            this.dynamicAtlas.removeFromDynamicAtlas(frame);
    }

    public packLabelFrame(text: string) {
        let label = this.getComponent(Label);
        if (!label) return;
        if (!this.enabled || !this.dynamicAtlas?.isWork) {
            label.string = text;
            return;
        }
        if (this.dynamicAtlas?.needWait()) {
            this.scheduleOnce(() => {
                this.packLabelFrame(text);
            });
            return;
        }

        if (this.needClear)
            this.dynamicAtlas?.removeFromDynamicAtlas(label.ttfSpriteFrame);
        else if (label.ttfSpriteFrame) {
            label.ttfSpriteFrame?._resetDynamicAtlasFrame();
            label.ttfSpriteFrame._uuid = '';
        }
        label.string = text;
    }


    public pack(): void {
        if (!this.enabled) return;
        if (!this.dynamicAtlas?.isWork) return;
        let label = this.getComponent(Label);
        if (!label || label.string == '') return;

        if (label.font instanceof BitmapFont)
            return;

        let frame = label.ttfSpriteFrame;
        if (!frame || frame.original)
            return;

        frame._uuid = this.createLabelFrameUuid(label);
        frame.rotated = false;

        this.dynamicAtlas?.packToDynamicAtlas(label, frame, this.canRotate);
    }

    public createLabelFrameUuid(label: Label, str?: string): string {
        let a = (str || label.string) + "_" + label.getComponent(RenderComponent).color + "_" + label.fontSize + "_" + (label.font?.name || label.fontFamily);
        let ol = label.getComponent(LabelOutline);
        if (ol) {
            a += "_" + ol.color + '_' + ol.width;
        }
        return a;
    }

    public setCommonMaterial(): void {
        let renderComp = this.getComponent(RenderComponent);
        if (!renderComp) return;
        if (this.dynamicAtlas?.commonMaterial && this.dynamicAtlas?.commonMaterial != renderComp.customMaterial)
            renderComp.customMaterial = this.dynamicAtlas?.commonMaterial;
    }

    public setSpriteFrameWithUuid(uuid: string, comp: Sprite | Label): boolean {
        if (!this.enabled) return false;
        if (!this.dynamicAtlas?.isWork) return false;
        let spriteFrame = this.dynamicAtlas.getSpriteFrameInstance(uuid);
        if (!spriteFrame) return false;
        if (comp instanceof Sprite)
            comp.spriteFrame = spriteFrame;
        else {
            if (comp.font instanceof BitmapFont) {
                (comp.font as BitmapFont).spriteFrame = spriteFrame;
                comp['_texture'] = spriteFrame;
            } else {
                comp['_ttfSpriteFrame'] = spriteFrame;
            }
        }
        return true;
    }
}
