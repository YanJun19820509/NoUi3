import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { no } from '../../no';
import { BitmapFont, EDITOR, Rect, Sprite, Texture2D, ccclass, isValid, math, property, v3 } from '../../yj';

@ccclass('YJBitmapLabel')
export class YJBitmapLabel extends Sprite {
    //文本内容
    @property({ multiline: true })
    set string(v: string) {
        if (v == this._string) return;
        this._string = v;
        this.setLabel();
    }
    get string() {
        return this._string;
    }

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
        this._lineHeight = v.fntConfig.commonHeight;
        this.setSize();
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
    }
    @property
    public get clearFont(): boolean {
        return false;
    }

    public set clearFont(v: boolean) {
        this.fontName = '';
        this.fontUuid = '';
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
    protected _string: string = '';
    @property({ serializable: true })
    protected _packToAtlas: boolean = true;
    @property({ serializable: true })
    protected _spacingX: number = 0;
    @property({ serializable: true })
    protected _size: number = 0;
    @property({ serializable: true })
    protected _lineHeight: number = 0;
    @property({ serializable: true })
    private _needSetLabel: boolean = false;

    private _font: BitmapFont = null;
    private _needSet: boolean = true;

    onLoad() {
        if (EDITOR) {
            this.getComponent('YJDynamicTexture')?.destroy();
        }
        // else {
        //     if (this.fontUuid)
        //         this.setBitmapFont(this.fontUuid, this.fontUrl);
        // }
    }

    onDestroy() {
        if (this._font) no.assetBundleManager.decRef(this._font);
        this._font = null;
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
        const bf = this.getFontFromCache(fontUuid);
        if (bf) return bf;
        else if (no.assetBundleManager.isAssetLoading(fontUuid)) {
            await no.sleep(0);
            return this.loadFont(fontUuid, url);
        }
        else {
            no.assetBundleManager.loadingAsset(fontUuid);
            return new Promise<BitmapFont>(resolve => {
                // no.assetBundleManager.loadFile(url, BitmapFont, (bf: BitmapFont) => {
                //     this.setFontToCache(url, bf);
                //     no.assetBundleManager.assetLoadingEnd(url);
                //     resolve(bf);
                // });

                no.assetBundleManager.loadByUuid<BitmapFont>(fontUuid, BitmapFont, file => {
                    if (file) {
                        this.setFontToCache(fontUuid, file);
                        no.assetBundleManager.assetLoadingEnd(fontUuid);
                    }
                    resolve(file);
                });
            });
        }
    }

    private setAtlasFont(bf: BitmapFont) {
        if (!EDITOR && bf && this.dynamicAtlas) {
            this.dynamicAtlas.packBitmapFontSpriteFrameToDynamicAtlas(bf, false, (nbf) => {
                this.setFont(nbf);
            }, () => {
                this.setFont(bf);
            });
        }
    }

    private setFont(bf: BitmapFont) {
        this._font = bf;
        this.spriteFrame = bf.spriteFrame;
        if (!this.customMaterial)
            this.customMaterial = this.dynamicAtlas?.customMaterial;
    }

    private setSize() {
        if (!this.size) return;
        const scale = this.size / this._font.fontSize;
        no.scale(this.node, v3(scale, scale, 1));
    }

    public removeLabel() {
        this.spriteFrame = null;
        this._font = null;
        this._needSetLabel = false;
    }

    public resetLabel() {
        this._needSetLabel = true;
        no.assetBundleManager.loadByUuid<BitmapFont>(this.fontUuid, BitmapFont, bf => {
            this._font = bf;
            this.setLabel();
        });
    }

    private clearString() {
        no.size(this.node, math.size(0, this._lineHeight));
        this.spriteFrame = null;
    }

    private setLabel() {
        if (EDITOR && !this._needSetLabel) return;
        if (!isValid(this.node)) {
            return;
        }
        this._needSet = false;
        if (this._string == '') {
            this.clearString();
            return;
        } else {
            this.setBitmapFont(this.fontUuid, this.fontUrl).then(() => {
                this.toDraw();
            });
        }
    }

    private async toDraw() {

    }

    private _updateQuads() {
        if (!isValid(this)) {
            return false;
        }

        const renderData = this.renderData!;
        renderData.dataLength = 0;
        renderData.resize(0, 0);
        const anchorPoint = no.anchor(this.node);
        const contentSize = no.size(this.node);
        const appX = anchorPoint.x * contentSize.width;
        const appY = anchorPoint.y * contentSize.height;
        const _bmfontScale = no.scale(this.node).x;

        let ret = true;
        for (let ctr = 0, l = this._string.length; ctr < l; ++ctr) {
            const letterInfo = _lettersInfo[ctr];
            if (!letterInfo.valid) { continue; }
            const letterDef = shareLabelInfo.fontAtlas!.getLetter(letterInfo.hash);
            if (!letterDef) {
                console.warn('Can\'t find letter in this bitmap-font');
                continue;
            }

            _tmpRect.height = letterDef.h;
            _tmpRect.width = letterDef.w;
            _tmpRect.x = letterDef.u;
            _tmpRect.y = letterDef.v;

            let py = letterInfo.y + _letterOffsetY;

            if (_labelHeight > 0) {
                if (py > _tailoredTopY) {
                    const clipTop = py - _tailoredTopY;
                    _tmpRect.y += clipTop;
                    _tmpRect.height -= clipTop;
                    py -= clipTop;
                }

                if ((py - _tmpRect.height * _bmfontScale < _tailoredBottomY) && _overflow === Overflow.CLAMP) {
                    _tmpRect.height = (py < _tailoredBottomY) ? 0 : (py - _tailoredBottomY) / _bmfontScale;
                }
            }

            const lineIndex = letterInfo.line;
            const px = letterInfo.x + letterDef.w / 2 * _bmfontScale + _linesOffsetX[lineIndex];

            if (_labelWidth > 0) {
                if (this._isHorizontalClamped(px, lineIndex)) {
                    if (_overflow === Overflow.CLAMP) {
                        _tmpRect.width = 0;
                    } else if (_overflow === Overflow.SHRINK) {
                        if (_contentSize.width > letterDef.w) {
                            ret = false;
                            break;
                        } else {
                            _tmpRect.width = 0;
                        }
                    }
                }
            }

            if (_tmpRect.height > 0 && _tmpRect.width > 0) {
                const isRotated = this._determineRect();
                const letterPositionX = letterInfo.x + _linesOffsetX[letterInfo.line];
                this.appendQuad(_tmpRect, isRotated, letterPositionX - appX, py - appY, _bmfontScale);
            }
        }
        const indexCount = renderData.indexCount;
        this.createQuadIndices(indexCount);
        renderData.chunk.setIndexBuffer(this.QUAD_INDICES);
        return ret;
    }

    private QUAD_INDICES: any;
    private createQuadIndices(indexCount) {
        if (indexCount % 6 !== 0) {
            console.error('illegal index count!');
            return;
        }
        const quadCount = indexCount / 6;
        this.QUAD_INDICES = null;
        this.QUAD_INDICES = new Uint16Array(indexCount);
        let offset = 0;
        for (let i = 0; i < quadCount; i++) {
            this.QUAD_INDICES[offset++] = 0 + i * 4;
            this.QUAD_INDICES[offset++] = 1 + i * 4;
            this.QUAD_INDICES[offset++] = 2 + i * 4;
            this.QUAD_INDICES[offset++] = 1 + i * 4;
            this.QUAD_INDICES[offset++] = 3 + i * 4;
            this.QUAD_INDICES[offset++] = 2 + i * 4;
        }
    }

    private appendQuad(rect: Rect, rotated: boolean, x: number, y: number, scale: number) {
        const renderData = this.renderData;
        if (!renderData) {
            return;
        }

        const dataOffset = renderData.dataLength;

        renderData.dataLength += 4;
        renderData.resize(renderData.dataLength, renderData.dataLength / 2 * 3);

        const dataList = renderData.data;
        const texW = this.spriteFrame.width;
        const texH = this.spriteFrame.height;

        const rectWidth = rect.width;
        const rectHeight = rect.height;

        let l = 0;
        let b = 0;
        let t = 0;
        let r = 0;
        if (!rotated) {
            l = (rect.x) / texW;
            r = (rect.x + rectWidth) / texW;
            b = (rect.y + rectHeight) / texH;
            t = (rect.y) / texH;

            dataList[dataOffset].u = l;
            dataList[dataOffset].v = b;
            dataList[dataOffset + 1].u = r;
            dataList[dataOffset + 1].v = b;
            dataList[dataOffset + 2].u = l;
            dataList[dataOffset + 2].v = t;
            dataList[dataOffset + 3].u = r;
            dataList[dataOffset + 3].v = t;
        } else {
            l = (rect.x) / texW;
            r = (rect.x + rectHeight) / texW;
            b = (rect.y + rectWidth) / texH;
            t = (rect.y) / texH;

            dataList[dataOffset].u = l;
            dataList[dataOffset].v = t;
            dataList[dataOffset + 1].u = l;
            dataList[dataOffset + 1].v = b;
            dataList[dataOffset + 2].u = r;
            dataList[dataOffset + 2].v = t;
            dataList[dataOffset + 3].u = r;
            dataList[dataOffset + 3].v = b;
        }

        dataList[dataOffset].x = x;
        dataList[dataOffset].y = y - rectHeight * scale;
        dataList[dataOffset + 1].x = x + rectWidth * scale;
        dataList[dataOffset + 1].y = y - rectHeight * scale;
        dataList[dataOffset + 2].x = x;
        dataList[dataOffset + 2].y = y;
        dataList[dataOffset + 3].x = x + rectWidth * scale;
        dataList[dataOffset + 3].y = y;
    }
}


