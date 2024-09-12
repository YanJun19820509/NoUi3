import { YJRenderBase } from '../../base/render/YJRenderBase';
import { no } from '../../no';
import { EDITOR, ccclass, isValid, math, property, size, JsonAsset, Attribute, UIVertexFormat, color } from '../../yj';

@ccclass('YJBitmapLabel')
export class YJBitmapLabel extends YJRenderBase {
    @property
    public get atlasJson(): string {
        return this._atlasJson;
    }

    public set atlasJson(v: string) {
        if (this._atlasJson == v) return;
        this._atlasJson = v;
        this._atlasConfig = null;
        this.loadJson();
    }
    @property
    public get fontType(): string {
        return this._fontType;
    }

    public set fontType(v: string) {
        this._fontType = v;
        this.setLabel();
    }
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
    @property
    public get size(): number {
        return this._size;
    }

    public set size(v: number) {
        this._size = v;
        this.setLabel();
    }
    @property
    public get lineHeight(): number {
        return this._lineHeight;
    }

    public set lineHeight(v: number) {
        this._lineHeight = v;
        this.setLabel();
    }
    @property
    public get spacingX(): number {
        return this._spacingX;
    }

    public set spacingX(v: number) {
        if (this._spacingX == v) return;
        this._spacingX = v;
        this.setLabel();
    }


    @property({ serializable: true })
    protected _atlasJson: string = '';
    @property({ serializable: true })
    protected _fontType: string = '';
    @property({ serializable: true })
    protected _string: string = '';
    @property({ serializable: true })
    protected _spacingX: number = 0;
    @property({ serializable: true })
    protected _size: number = 0;
    @property({ serializable: true })
    protected _lineHeight: number = 0;

    private _atlasConfig: any;

    onLoad() {
        this.loadJson();
    }

    public a_text(v: any) {
        this.string = v.string;
    }

    private loadJson() {
        if (this._atlasConfig) {
            this.setLabel();
            return;
        }
        if (EDITOR) {
            no.EditorMode.loadAnyFile<JsonAsset>(this.atlasJson).then(file => {
                this._atlasConfig = file.json;
                this.setLabel();
            })
        } else {
            no.assetBundleManager.loadJSON(this.atlasJson, item => {
                this._atlasConfig = item.json;
                this.setLabel();
            });
        }
    }

    public resetLabel() {
        this.setLabel();
    }

    private clearString() {
        no.size(this.node, math.size(0, this._lineHeight));
    }

    private setLabel() {
        if (!isValid(this.node)) {
            return;
        }
        if (this._string == '') {
            this.renderable = false;
            this.clearString();
            return;
        } else {
            this.renderable = true;
            this.initRenderData(this._string.length, 4);
            this.toDraw();
            this._assembler.updateRenderData(this); // 更新渲染数据，以显示文本内容。
        }
    }

    private toDraw() {
        const arr = this.getCharConfigs();
        const anchorPoint = no.anchor(this.node);
        let width = 0, height = 0;
        for (let i = 0, n = arr.length; i < n; i++) {
            const letterInfo = arr[i];
            if (!letterInfo) continue;
            width += letterInfo.width + this.spacingX;
            if (letterInfo.height > height) height = letterInfo.height;
        }
        width -= this.spacingX;
        height = Math.max(height, this.lineHeight);
        no.size(this.node, size(width, height));
        let appX = -anchorPoint.x * width;
        let appY = height * anchorPoint.y;
        for (let i = 0, n = arr.length; i < n; i++) {
            const letterInfo = arr[i],
                x = appX,
                y = letterInfo.height / 2,
                uv = letterInfo.uv;
            this.appendQuad(uv, letterInfo.rotated, x, y, letterInfo.width, letterInfo.height);
            appX += letterInfo.width + this.spacingX;
        }
    }

    private getCharConfigs() {
        let arr: any[] = [];
        for (let i = 0, n = this._string.length; i < n; i++) {
            const key = this.fontType + '/' + this._string.charCodeAt(i);
            arr[arr.length] = this._atlasConfig[key];
        }
        return arr;
    }

    private appendQuad(uv: number[], rotated: boolean, x: number, y: number, width: number, height: number) {
        this.setRenderData({
            uv: uv,
            xy: this.getXY(x, y, width, height),
            rotated: rotated,
            // colors: [color(255, 255, 255, 255)],
            // colors2: [color(255, 255, 255, 255)]
        })
    }

    protected vertexFormat(): Attribute[] {
        return UIVertexFormat.vfmtPosUvTwoColor;
    }
}