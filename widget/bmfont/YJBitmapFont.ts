
import { EDITOR, ccclass, property, executeInEditMode, requireComponent, Component, Node, BitmapFont, Label, Texture2D, SpriteFrame, director, isValid } from '../../yj';
import { no } from '../../no';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { YJJobManager } from '../../base/YJJobManager';

/**
 * Predefined variables
 * Name = YJBitmapFont
 * DateTime = Fri Jul 01 2022 00:00:58 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJBitmapFont.ts
 * FileBasenameNoExtension = YJBitmapFont
 * URL = db://assets/Script/NoUi3/engine/YJBitmapFont.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJBitmapFont')
@requireComponent([Label])
@executeInEditMode()
export class YJBitmapFont extends Component {
    @property(BitmapFont)
    public get font(): BitmapFont {
        return null;
    }

    public set font(v: BitmapFont) {
        if (v == this._font) return;
        this._font = v;
        if (!v) {
            this.fontName = '';
            this.fontUuid = '';
        } else {
            this.fontName = v.name;
            this.fontUuid = v.uuid;
            this.resetFont();
        }
    }
    @property({ readonly: true })
    fontName: string = '';
    @property({ readonly: true })
    fontUuid: string = '';
    @property({ type: YJDynamicAtlas, readonly: true })
    dynamicAtlas: YJDynamicAtlas = null;

    private _font: BitmapFont = null;

    public resetFont() {
        if (!this._font) {
            no.assetBundleManager.loadByUuid<BitmapFont>(this.fontUuid, BitmapFont, bf => {
                if (!bf) return;
                this._font = bf;
                this.resetFont();
            });
            return;
        }
        const label = this.getComponent(Label);
        if (!EDITOR && this.dynamicAtlas) {

            // let sf = this._font.spriteFrame.clone();
            // sf._uuid = this._font.spriteFrame.uuid;
            // let packedFrame = this.dynamicAtlas.insertSpriteFrame(sf);
            // sf._setDynamicAtlasFrame(packedFrame);
            // this._font.spriteFrame = sf;
            // director.root.batcher2D.forceMergeBatches(label.customMaterial, sf, label);

            // this.scheduleOnce(() => {
            //     YJJobManager.ins.execute(() => {
            //         if (!isValid(this?.node) || !this?.node?.activeInHierarchy) return false;
            //         this.dynamicAtlas?.packToDynamicAtlas(label, this._font.spriteFrame, true);
            //         return false;
            //     }, this);
            // }, 1);
        }
        label.font = this._font;
    }

    removeFont() {
        this.getComponent(Label).font = null;
    }

    ///////////////////////////EDITOR///////////////
    onLoad() {
        if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
    }

    start() {
        if (EDITOR) return;
        this.resetFont();
    }
}
