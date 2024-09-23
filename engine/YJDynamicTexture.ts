
import { EDITOR, ccclass, property, disallowMultiple, executeInEditMode, Label, CacheMode, Sprite, RichText, BitmapFont, UIRenderer, Component, SpriteFrame, LabelOutline, UITransform, isValid, sys } from '../yj';
import { YJDynamicAtlas } from './YJDynamicAtlas';
import { YJJobManager } from '../base/YJJobManager';
import { YJSample2DMaterialManager } from './YJSample2DMaterialManager';

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
    @property
    needClear: boolean = false;
    @property
    canRotate: boolean = true;
    @property({ visible() { return false; } })
    materialInfoUuid: string;


    private dynamicAtlas: YJDynamicAtlas;

    onLoad() {
        if (!this.enabled) return;
        if (EDITOR) {

            let label = this.getComponent(Label) || this.getComponent(RichText);
            if (label && label.cacheMode != CacheMode.BITMAP) {
                label.cacheMode = CacheMode.BITMAP;
            }
        } else {
            this.dynamicAtlas = YJSample2DMaterialManager.ins.getMaterialInfo(this.materialInfoUuid).dynamicAtlas;
        }
    }

    start() {
        if (EDITOR) return;
        this.scheduleOnce(() => {
            this.init();
        }, 0.2);
    }

    public init() {
        if (!this.enabledInHierarchy) return;
        this.packSpriteFrame();
    }

    public packSpriteFrame(frame?: SpriteFrame) {
        let sprite = this.getComponent(Sprite);
        if (!sprite) return;

        if (sys.platform == sys.Platform.WECHAT_GAME) return;

        if (!this.enabled || !this.dynamicAtlas?.isWork) {
            if (frame) {
                console.error('dynamicAtlas 为null，未做合图', frame);
                sprite.spriteFrame = frame;
            }
            return;
        }
        frame = frame || sprite?.spriteFrame;
        if (!frame) return;
        this.dynamicAtlas?.packToDynamicAtlas(sprite, frame, this.canRotate, () => {
            sprite.spriteFrame = frame;
        });
    }

    public packLabelFrame(text: string) {
        let label = this.getComponent(Label);
        if (!label) return;
        if (!this.enabled || !this.dynamicAtlas?.isWork) {
            label.string = text;
            return;
        }
        if (label.ttfSpriteFrame) {
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

        this.scheduleOnce(() => {
            YJJobManager.ins.execute(this._pack, this);
        }, 1);
    }

    private _pack() {
        const label = this.getComponent(Label),
            frame = label.ttfSpriteFrame;
        if (!isValid(this?.node) || !this?.node?.activeInHierarchy) return false;
        this.dynamicAtlas?.packToDynamicAtlas(label, frame, this.canRotate);
        return false;
    }

    public createLabelFrameUuid(label: Label, str?: string): string {
        let a = (str || label.string) + "_" + label.getComponent(UIRenderer).color + "_" + label.fontSize + "_" + (label.font?.name || label.fontFamily);
        let ol = label.getComponent(LabelOutline);
        if (ol) {
            a += "_" + ol.color + '_' + ol.width;
        }
        a += '_' + label.node.getComponent(UITransform).width + '_' + (label.isBold ? '1' : '0') + '_' + (label.isItalic ? '1' : '0');
        return a;
    }
}
