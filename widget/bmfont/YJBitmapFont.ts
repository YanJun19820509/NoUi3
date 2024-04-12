
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
        no.getAssetUrlInEditorMode(v.uuid, url => {
            this.fontUrl = url;
        });
        const label = this.getComponent(Label);
        if (label) {
            label.fontSize = v.fontSize;
            label.lineHeight = v.fntConfig.commonHeight;
        }
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
    @property({ readonly: true })
    fontUrl: string = '';

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

    private static fontMap: { [uuid: string]: BitmapFont } = {};
    private static fontLoading: { [uuid: string]: boolean } = {};

    onLoad() {
        if (EDITOR) {
            const label = this.getComponent(Label),
                font = label.font;
            if (font && font instanceof BitmapFont) {
                this.font = font;
                this.spacingX = label.spacingX;
                label.font = null;
                label.enabled = false;
            }
            this.getComponent('YJDynamicTexture')?.destroy();
        } else {
            if (this._spacingX != 0)
                this.getComponent(Label).spacingX = this._spacingX;
            if (this.fontUuid)
                this.setBitmapFont(this.fontUuid, this.fontUrl);
        }
    }

    onDestroy() {
        if (this._font) no.assetBundleManager.decRef(this._font);
        this._font = null;
    }

    public resetFont() {
        if (this.fontUuid == '') return;
        no.assetBundleManager.loadByUuid<BitmapFont>(this.fontUuid, BitmapFont, bf => {
            this.setFont(bf);
        });
        if (!this.fontUrl) {
            no.getAssetUrlInEditorMode(this.fontUuid, url => {
                this.fontUrl = url;
            });
        }
    }

    public async setBitmapFont(fontUuid: string, url?: string) {
        const bf = await this.loadFont(fontUuid, url);
        this.setAtlasFont(bf);
    }

    private getFontFromCache(fontUuid: string) {
        return YJBitmapFont.fontMap[fontUuid];
    }

    private setFontToCache(fontUuid: string, bf: BitmapFont) {
        if (!this.getFontFromCache(fontUuid))
            YJBitmapFont.fontMap[fontUuid] = bf;
    }

    private async loadFont(fontUuid: string, url?: string): Promise<BitmapFont> {
        const bf = this.getFontFromCache(fontUuid);
        if (bf) return bf;
        else if (YJBitmapFont.fontLoading[fontUuid]) {
            await no.sleep(0);
            return this.loadFont(fontUuid, url);
        }
        else {
            YJBitmapFont.fontLoading[fontUuid] = true;
            return new Promise<BitmapFont>(resolve => {
                if (!url) {
                    no.assetBundleManager.loadByUuid<BitmapFont>(fontUuid, BitmapFont, bf => {
                        this.setFontToCache(fontUuid, bf);
                        resolve(bf);
                    });
                } else {
                    no.assetBundleManager.loadFile(url, BitmapFont, (bf: BitmapFont) => {
                        this.setFontToCache(fontUuid, bf);
                        resolve(bf);
                    });
                }
            });
        }
    }

    private setAtlasFont(bf: BitmapFont) {
        if (!EDITOR && bf && this.dynamicAtlas) {
            this.dynamicAtlas.packBitmapFontSpriteFrameToDynamicAtlas(bf, false, (nbf) => {
                this._font = nbf;
                this.setFont(nbf);
            }, () => {
                this.setFont(bf);
            });
        } else
            this.setFont(bf);
    }

    private setFont(font: BitmapFont) {
        const label = this.getComponent(Label);
        if (font) {
            label.font = font;
        }
        if (!label.customMaterial)
            label.customMaterial = this.dynamicAtlas?.customMaterial;
        label.enabled = true;
    }

    removeFont() {
        const label = this.getComponent(Label);
        if (label.font) no.assetBundleManager.decRef(label.font);
        label.font = null;
        label.enabled = false;
    }
}
