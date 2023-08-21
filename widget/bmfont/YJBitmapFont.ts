
import { EDITOR, ccclass, property, requireComponent, Component, Node, BitmapFont, Label, isValid } from '../../yj';
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
export class YJBitmapFont extends Component {
    @property(BitmapFont)
    public get font(): BitmapFont {
        return null;
    }

    public set font(v: BitmapFont) {
        if (v == this._font) return;
        this._font = v;
        this.fontName = v.name;
        this.fontUuid = v.uuid;
        this.resetFont();
    }
    @property
    public get clearFont(): boolean {
        return false;
    }

    public set clearFont(v: boolean) {
        this.fontName = '';
        this.fontUuid = '';
        this.removeFont();
    }
    @property({ readonly: true })
    fontName: string = '';
    @property({ readonly: true })
    fontUuid: string = '';
    @property({ type: YJDynamicAtlas })
    dynamicAtlas: YJDynamicAtlas = null;

    private _font: BitmapFont = null;

    public resetFont() {
        this.setBitmapFont(this.fontUuid);
    }

    public setBitmapFont(fontUuid: string) {
        no.assetBundleManager.loadByUuid<BitmapFont>(fontUuid, BitmapFont, bf => {
            if (!bf) return;
            this.setFont(bf);
        });
    }

    private setFont(font: BitmapFont) {
        const label = this.getComponent(Label);
        if (!EDITOR && this.dynamicAtlas) {
            if (!label.customMaterial)
                label.customMaterial = this.dynamicAtlas.commonMaterial;
            // this._font.spriteFrame = this.dynamicAtlas.packSpriteFrame(this._font.spriteFrame);


            // this.scheduleOnce(() => {
            // YJJobManager.ins.execute(() => {
            //     if (!isValid(this?.node) || !this?.node?.activeInHierarchy) return false;
            //     const label: any = this.getComponent(Label);
            //     this.dynamicAtlas?.packToDynamicAtlas(label, label['_texture'], true, () => {
            //         label.updateRenderData(true);
            //     });
            //     return false;
            // }, this);
            // }, 1);
        }
        label.font = this._font;
        label.materials.length = 0;
        label.enabled = true;
    }

    removeFont() {
        const label = this.getComponent(Label);
        label.font = null;
        label.enabled = false;
    }

    ///////////////////////////EDITOR///////////////
    onLoad() {
        // if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
    }

    start() {
        this.resetFont();
    }
}
