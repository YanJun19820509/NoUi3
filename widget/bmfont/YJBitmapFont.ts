
import { EDITOR, ccclass, property, requireComponent, Component, BitmapFont, Label, executeInEditMode } from '../../yj';
import { no } from '../../no';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';

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
        this.fontName = v.name;
        this.fontUuid = v.uuid;
        this.resetFont();
    }
    @property
    public get spacingX(): number {
        return this._spacingX;
    }

    public set spacingX(v: number) {
        if (this._spacingX == v) return;
        this._spacingX = v;
        this.getComponent(Label).spacingX = v;
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

    @property
    public get packToAtlas(): boolean {
        return this._packToAtlas;
    }

    public set packToAtlas(v: boolean) {
        if (v == this._packToAtlas) return;
        this._packToAtlas = v;
        if (v && !this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
        else if (!v) this.dynamicAtlas = null;
    }

    @property({ type: YJDynamicAtlas, readonly: true, visible() { return this._packToAtlas; } })
    dynamicAtlas: YJDynamicAtlas = null;

    @property({ serializable: true })
    protected _packToAtlas: boolean = true;
    @property({ serializable: true })
    protected _spacingX: number = 0;

    private _font: BitmapFont = null;

    onLoad() {
        if (EDITOR) {
            const label = this.getComponent(Label),
                font = label.font;
            if (font && font instanceof BitmapFont) {
                this.font = font;
                label.font = null;
                label.enabled = false;
            }
            this.getComponent('YJDynamicTexture')?.destroy();
        }
    }

    start() {
        if (EDITOR) return;
        if (this._spacingX != 0)
            this.getComponent(Label).spacingX = this._spacingX;
        this.resetFont();
    }

    public resetFont() {
        if (EDITOR) return;
        if (this.fontUuid == '') return;
        this.setBitmapFont(this.fontUuid);
    }

    public setBitmapFont(fontUuid: string) {
        no.assetBundleManager.loadByUuid<BitmapFont>(fontUuid, BitmapFont, bf => {
            if (!bf) return;

            // if (!EDITOR && this.dynamicAtlas) {
            //     let font = new BitmapFont();
            //     font.name = bf.name;
            //     font.fntConfig = bf.fntConfig;
            //     font.fontDefDictionary = bf.fontDefDictionary;
            //     font.fontSize = bf.fontSize;
            //     this.dynamicAtlas.packBitmapFontSpriteFrameToDynamicAtlas(font, bf.spriteFrame);
            //     this.setFont(font);
            // } else 
            this.setFont(bf);
        });
    }

    private setFont(font: BitmapFont) {
        const label = this.getComponent(Label);
        label.font = font;
        if (!label.customMaterial)
            label.customMaterial = this.dynamicAtlas?.customMaterial;
        label.enabled = true;
    }

    removeFont() {
        const label = this.getComponent(Label);
        label.font = null;
        label.enabled = false;
    }
}
