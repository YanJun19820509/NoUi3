
import { EDITOR, ccclass, property, requireComponent, Component, BitmapFont, Label, executeInEditMode, v3, isValid } from '../../yj';
import { no } from '../../no';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { YJSample2DMaterialManager } from 'NoUi3/engine/YJSample2DMaterialManager';

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
        if (v == this._font || !v) return;
        this._font = v;
        this.fontName = v.name;
        this.fontUuid = v.uuid;
        no.EditorMode.getAssetUrlByUuid(v.uuid).then(url => {
            this.fontUrl = url;
        });
        const label = this.getComponent(Label);
        if (label) {
            label.fontSize = v.fontSize;
            label.lineHeight = v.fntConfig.commonHeight;
        }
        this.setSize();
        this.setFont(v);
    }
    @property
    public get size(): number {
        return this._size;
    }

    public set size(v: number) {
        this._size = v;
        this.setSize();
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
    }

    @property({ serializable: true })
    protected _packToAtlas: boolean = true;
    @property({ serializable: true })
    protected _spacingX: number = 0;
    @property({ serializable: true })
    protected _size: number = 0;
    @property({ visible() { return false; } })
    materialInfoUuid: string;


    private _font: BitmapFont = null;
    private dynamicAtlas: YJDynamicAtlas = null;

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
            if (this.packToAtlas)
                this.dynamicAtlas = YJSample2DMaterialManager.ins.getMaterialInfo(this.materialInfoUuid).dynamicAtlas;
        }
    }

    onDestroy() {
        if (this._font) no.assetBundleManager.decRef(this._font);
        this._font = null;
    }

    public resetFont() {
        if (this.fontUuid == '') return;
        no.assetBundleManager.loadByUuid<BitmapFont>(this.fontUuid, bf => {
            this.setFont(bf);
        });
        if (!this.fontUrl) {
            no.EditorMode.getAssetUrlByUuid(this.fontUuid).then(url => {
                this.fontUrl = url;
            });
        }
    }

    public async setBitmapFont(fontUuid: string, url?: string) {
        const bf = await this.loadFont(fontUuid, url);
        this.setAtlasFont(bf);
    }

    private getFontFromCache(fontUuid: string) {
        return no.assetBundleManager.getCachedAsset<BitmapFont>(fontUuid);
    }

    private setFontToCache(fontUuid: string, bf: BitmapFont) {
        if (!this.getFontFromCache(fontUuid))
            no.assetBundleManager.cacheAsset(fontUuid, bf);
    }

    private async loadFont(fontUuid: string, url: string): Promise<BitmapFont> {
        if (!url) {
            no.err('YJBitmapFont', 'loadFont', 'url is null');
            return
        }
        const bf = this.getFontFromCache(url);
        if (bf) return bf;
        else if (no.assetBundleManager.isAssetLoading(url)) {
            await no.sleep(0);
            return this.loadFont(fontUuid, url);
        }
        else {
            no.assetBundleManager.loadingAsset(url);
            return new Promise<BitmapFont>(resolve => {
                // if (!url) {
                //     no.assetBundleManager.loadByUuid<BitmapFont>(fontUuid, BitmapFont, bf => {
                //         this.setFontToCache(fontUuid, bf);
                //         resolve(bf);
                //         no.assetBundleManager.assetLoadingEnd(fontUuid);
                //     });
                // } else {
                no.assetBundleManager.loadFile(url, BitmapFont, (bf: BitmapFont) => {
                    this.setFontToCache(url, bf);
                    resolve(bf);
                    no.assetBundleManager.assetLoadingEnd(url);
                });
                // }
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
        if (!isValid(this)) return;
        const label = this.getComponent(Label);
        if (font) {
            label.useSystemFont = false;
            label.font = font;
        }
        if (!label.customMaterial)
            label.customMaterial = this.dynamicAtlas?.customMaterial;
        label.enabled = true;
    }

    private setSize() {
        if (!this.size) return;
        const label = this.getComponent(Label);
        if (!label) return;
        const scale = this.size / label.fontSize;
        no.scale(this.node, v3(scale, scale, 1));
    }

    removeFont() {
        const label = this.getComponent(Label);
        if (label.font) no.assetBundleManager.decRef(label.font);
        label.font = null;
        label.enabled = false;
    }
}
