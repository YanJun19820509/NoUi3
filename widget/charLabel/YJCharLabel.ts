
import { EDITOR, ccclass, property, Font, Color, Label, Vec2, v2, Sprite, Enum, SpriteFrame, Texture2D, CCString, ImageAsset, SpriteAtlas, math, size, rect, HtmlTextParser, IHtmlTextParserResultObj, isValid, HorizontalTextAlignment, DEBUG, VerticalTextAlignment, view } from '../../yj';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJCharLabel
 * DateTime = Fri May 06 2022 09:16:22 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCharLabel.ts
 * FileBasenameNoExtension = YJCharLabel
 * URL = db://assets/NoUi3/widget/charLabel/YJCharLabel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 * 自定义文本组件,使用时替换掉Label组件
 */

@ccclass('YJCharLabel')
export class YJCharLabel extends Sprite {
    @property({ visible() { return false; }, override: true })
    set spriteAtlas(v: SpriteAtlas) {
        super.spriteAtlas = v;
    }
    get spriteAtlas(): SpriteAtlas {
        return super.spriteAtlas;
    }
    @property({ visible() { return false; }, override: true })
    set spriteFrame(v: SpriteFrame) {
        super.spriteFrame = v;
    }
    get spriteFrame(): SpriteFrame {
        return super.spriteFrame;
    }

    @property({ visible() { return false; }, override: true })
    set sizeMode(v: number) {
        super.sizeMode = v;
    }
    get sizeMode(): number {
        return super.sizeMode;
    }

    @property({ visible() { return false; }, override: true })
    set type(v: number) {
        super.type = v;
    }
    get type(): number {
        return super.type;
    }

    @property({ visible() { return false; }, override: true })
    set grayscale(v: boolean) {

    }
    get grayscale(): boolean {
        return false;
    }

    @property({ visible() { return false; }, override: true })
    set trim(v: boolean) {

    }
    get trim(): boolean {
        return true;
    }
    @property({ type: Color, visible() { return false; }, override: true })
    public get color(): Color {
        return Color.WHITE.clone();
    }
    public set color(v: Color) {

    }


    //文本内容
    @property({ type: CCString, multiline: true })
    set string(v: string) {
        if (v == this._string) return;
        this._string = v;
        this.setLabel();
    }
    get string() {
        return this._string;
    }
    //文本颜色
    @property({ type: Color, override: true })
    public get fontColor(): Color {
        return this._fontColor;
    }
    public set fontColor(v: Color) {
        if (v.equals(this._fontColor)) return;
        this._fontColor = v;
        this.setLabel();
    }
    //文本尺寸
    @property
    public get fontSize(): number {
        return this._fontSize * this.hdpScale;
    }

    public set fontSize(v: number) {
        if (v == this._fontSize) return;
        this._fontSize = v;
        this.setLabel();
    }
    //自定义字体
    @property(Font)
    public get font(): Font {
        return this._font;
    }

    public set font(v: Font) {
        if (v == this._font) return;
        this._font = v;
        this.setLabel();
    }
    //系统字体
    @property
    public get fontFamily(): string {
        return this._foitnFamily;
    }

    public set fontFamily(v: string) {
        if (v == this._foitnFamily) return;
        this._foitnFamily = v;
        this.setLabel();
    }
    //行高
    @property
    public get lineHeight(): number {
        return this._lineHeight * this.hdpScale;
    }

    public set lineHeight(v: number) {
        if (v == this._lineHeight) return;
        this._lineHeight = v;
        this.setLabel();
    }
    //水平对齐
    @property({ type: Enum(HorizontalTextAlignment) })
    public get horizontalAlign(): number {
        return this._horizontalAlign;
    }

    public set horizontalAlign(v: number) {
        if (v == this._horizontalAlign) return;
        this._horizontalAlign = v;
        this.setLabel();
    }
    //垂直对齐
    @property({ type: Enum(VerticalTextAlignment), visible() { return false; } })
    public get verticalAlign(): number {
        // return this._verticalAlign;
        return 1;
    }

    public set verticalAlign(v: number) {
        if (v == this._verticalAlign) return;
        this._verticalAlign = v;
        this.setLabel();
    }
    //文字排版
    @property({ type: Enum(Label.Overflow) })
    public get overflow(): number {
        return this._overflow;
    }

    public set overflow(v: number) {
        if (v == this._overflow) return;
        this._overflow = v;
        if (v == Label.Overflow.NONE) {
            this.sizeMode = Sprite.SizeMode.RAW;
        } else if (v == Label.Overflow.CLAMP || v == Label.Overflow.SHRINK || v == Label.Overflow.RESIZE_HEIGHT) {
            this.maxWidth = no.width(this.node);
            this.sizeMode = Sprite.SizeMode.CUSTOM;
        }
        this.setLabel();
    }
    //最大宽
    @property({ visible() { return this.overflow != Label.Overflow.NONE; } })
    public get maxWidth(): number {
        return this._maxWidth * this.hdpScale;
    }

    public set maxWidth(v: number) {
        if (v == this._maxWidth) return;
        this._maxWidth = v;
        this.setLabel();
    }
    //固定宽
    @property({ visible() { return this.overflow != Label.Overflow.NONE; } })
    public get fixWidth(): boolean {
        if (this.overflow == Label.Overflow.NONE) return false;
        return this._fixWidth;
    }

    public set fixWidth(v: boolean) {
        if (v == this._fixWidth) return;
        this._fixWidth = v;
        this.setLabel();
    }
    //斜体
    @property
    public get italic(): boolean {
        return this._italic;
    }

    public set italic(v: boolean) {
        if (v == this._italic) return;
        this._italic = v;
        this.setLabel();
    }
    //粗体
    @property
    public get bold(): boolean {
        return this._bold;
    }

    public set bold(v: boolean) {
        if (v == this._bold) return;
        this._bold = v;
        this.setLabel();
    }
    //下划线
    @property
    public get underline(): boolean {
        return this._underline;
    }

    public set underline(v: boolean) {
        if (v == this._underline) return;
        this._underline = v;
        this.setLabel();
    }
    //下划线宽
    @property({ visible() { return this._underline; } })
    public get underlineWidth(): number {
        return this._underlineWidth * this.hdpScale;
    }

    public set underlineWidth(v: number) {
        if (v == this._underlineWidth) return;
        this._underlineWidth = v;
        this.setLabel();
    }
    //描边颜色
    @property
    public get outlineColor(): Color {
        return this._outlineColor;
    }

    public set outlineColor(v: Color) {
        if (v.equals(this._outlineColor)) return;
        this._outlineColor = v;
        this.setLabel();
    }
    //描边宽
    @property
    public get outlineWidth(): number {
        return this._outlineWidth * this.hdpScale;
    }

    public set outlineWidth(v: number) {
        if (v == this._outlineWidth) return;
        this._outlineWidth = v;
        this.setLabel();
    }
    //阴影颜色
    @property
    public get shadowColor(): Color {
        return this._shadowColor;
    }

    public set shadowColor(v: Color) {
        if (v.equals(this._shadowColor)) return;
        this._shadowColor = v;
        this.setLabel();
    }
    //阴影偏移
    @property
    public get shadowOffset(): Vec2 {
        const s = this._hdp ? this._hdpScale : 1;
        let offset = this._shadowOffset.clone();
        offset.x *= s;
        offset.y *= s;
        return offset;
    }

    public set shadowOffset(v: Vec2) {
        if (v.equals(this._shadowOffset)) return;
        this._shadowOffset = v;
        this.setLabel();
    }
    //阴影模糊宽
    @property
    public get shadowBlur(): number {
        return this._shadowBlur * this.hdpScale;
    }

    public set shadowBlur(v: number) {
        if (v == this._shadowBlur) return;
        this._shadowBlur = v;
        this.setLabel();
    }
    //空格断字
    @property
    public get blankBreakWord(): boolean {
        return this._blankBreakWord;
    }

    public set blankBreakWord(v: boolean) {
        if (v == this._blankBreakWord) return;
        this._blankBreakWord = v;
        this.setLabel();
    }
    //富文本
    @property
    public get richText(): boolean {
        return this._richText;
    }

    public set richText(v: boolean) {
        if (v == this._richText) return;
        this._richText = v;
        this.setLabel();
    }
    //高清模式
    @property
    public get HDP(): boolean {
        return this._hdp;
    }

    public set HDP(v: boolean) {
        if (v == this._hdp) return;
        this._hdp = v;
        if (v) {
            this._hdpScale = Math.max(1, 1 / view.getScaleX());
        }
        this.setLabel();
    }

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
    protected _fontColor: Color = Color.WHITE.clone();
    @property({ serializable: true })
    protected _fontSize: number = 22;
    @property({ serializable: true })
    protected _font: Font = null;
    @property({ serializable: true })
    protected _foitnFamily: string = 'Arial';
    @property({ serializable: true })
    protected _lineHeight: number = 28;
    @property({ serializable: true })
    protected _horizontalAlign: number = 0;
    @property({ serializable: true })
    protected _verticalAlign: number = 1;
    @property({ serializable: true })
    protected _overflow: number = 0;
    @property({ serializable: true })
    protected _maxWidth: number = 50;
    @property({ serializable: true })
    protected _fixWidth: boolean = false;
    @property({ serializable: true })
    protected _italic: boolean = false;
    @property({ serializable: true })
    protected _bold: boolean = false;
    @property({ serializable: true })
    protected _underline: boolean = false;
    @property({ serializable: true })
    protected _underlineWidth: number = 2;
    @property({ serializable: true })
    protected _outlineWidth: number = 0;
    @property({ serializable: true })
    protected _outlineColor: Color = Color.BLACK.clone();
    @property({ serializable: true })
    protected _shadowBlur: number = 0;
    @property({ serializable: true })
    protected _shadowOffset: Vec2 = v2();
    @property({ serializable: true })
    protected _shadowColor: Color = Color.BLACK.clone();
    @property({ serializable: true })
    protected _blankBreakWord: boolean = false;
    @property({ serializable: true })
    protected _richText: boolean = false;
    @property({ serializable: true })
    protected _hdp: boolean = false;
    @property({ serializable: true })
    protected _packToAtlas: boolean = true;

    @property({ serializable: true })
    private _needSetLabel: boolean = false;
    //高清模式系数
    private _hdpScale = 2;
    //已测量文字最大最小宽
    private _measuredWidth: { [k: string]: number } = {};

    private _texture: Texture2D;

    onLoad() {
        super.onLoad();
        if (EDITOR) return;
        if (this.packToAtlas) {
            if (this.dynamicAtlas) this.customMaterial = this.dynamicAtlas.customMaterial;
        }
        this.setLabel();
    }

    onDestroy() {
        super.onDestroy();
        this.unscheduleAllCallbacks();
        this.node.targetOff(this);
        this._texture?.destroy();
    }

    onEnable() {
        super.onEnable();
        this.setLabel();
    }

    private setLabel(): void {
        if (EDITOR && !this._needSetLabel) return;
        if (!isValid(this.node) || !this.node.activeInHierarchy) {
            return;
        }
        this.clearCanvas();
        if (this._string == '') {
            this.clearString();
            return;
        } else {
            if (this.packToAtlas && this.setPackedTexture()) return;
            if (this.richText)
                this.drawRichString(this._string)
            else
                this.drawString(this._string);
            this.updateTexture();
        }
    }

    private get hdpScale(): number {
        return this._hdp ? this._hdpScale : 1;
    }

    private getUuid(): string {
        let a = this.string + "_" + this._fontColor + "_" + this.fontSize + "_" + (this.font?.name || this.fontFamily) + "_" + this.outlineColor + '_' + this.outlineWidth + '_' + (this.bold ? '1' : '0') + '_' + (this.italic ? '1' : '0');
        return a;
    }

    private _canvas: HTMLCanvasElement;
    private shareCanvas() {
        if (!this._canvas) {
            this._canvas = document.createElement('canvas');
        }
        return this._canvas;
    }

    private clearCanvas() {
        this._canvas = null;
    }

    private setFontStyle(ctx: CanvasRenderingContext2D, color?: string, fontSize?: number, bold?: boolean, italic?: boolean) {
        if (color == null) color = '#' + this._fontColor.toHEX('#rrggbb');
        if (fontSize == null) fontSize = this.fontSize;
        else fontSize *= this._hdp ? this._hdpScale : 1;
        if (bold == null) bold = this.bold;
        if (italic == null) italic = this.italic;
        switch (this.verticalAlign) {
            case VerticalTextAlignment.TOP:
                ctx.textBaseline = 'top';
                break;
            case VerticalTextAlignment.CENTER:
                ctx.textBaseline = 'middle';
                break;
            case VerticalTextAlignment.BOTTOM:
                ctx.textBaseline = 'bottom';
                break;
        }
        ctx.textAlign = 'left';
        ctx.imageSmoothingQuality = 'high';
        ctx.font = `${italic ? 'italic' : 'normal'} ${bold ? 'bold' : ''} ${fontSize}px ${this.font?.['_fontFamily'] || this.fontFamily}`;
        ctx.fillStyle = color;
    }

    private setStrokeStyle(ctx: CanvasRenderingContext2D, color?: string, lineWidth?: number) {
        if (color == null) color = '#' + this.outlineColor.toHEX('#rrggbb');
        if (lineWidth == null) lineWidth = this.outlineWidth * 2;
        else lineWidth *= this.hdpScale * 2;
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
    }

    private setShadowStyle(ctx: CanvasRenderingContext2D, color?: string, blur?: number, offset?: Vec2) {
        if (color == null) color = '#' + this.shadowColor.toHEX('#rrggbb');
        const scale = this._hdp ? this._hdpScale : 1;
        if (blur == null) blur = this.shadowBlur;
        else blur *= scale;
        if (offset == null) offset = this.shadowOffset;
        else {
            offset.x *= scale;
            offset.y *= scale;
        }
        ctx.shadowBlur = blur;
        ctx.shadowColor = color;
        ctx.shadowOffsetX = offset.x;
        ctx.shadowOffsetY = offset.y;
    }

    private clearString() {
        const canvas = this.shareCanvas();
        canvas.width = 0;
        canvas.height = this._lineHeight;
        no.size(this.node, math.size(0, this._lineHeight));
        this.spriteFrame = null;
    }

    private getMeasureWidth(ctx: CanvasRenderingContext2D, str: any, fontSize?: number): number {
        if (fontSize == null) fontSize = this.fontSize;
        else fontSize *= this._hdp ? this._hdpScale : 1;
        const k = str + '::' + fontSize;
        let w = this._measuredWidth[k];
        if (!w) {
            const mt = ctx.measureText(str);
            w = mt.width;
            this._measuredWidth[k] = w;
        }
        return w;
    }

    private drawString(v: string) {
        const ctx = this.shareCanvas().getContext("2d");
        this.setFontStyle(ctx);
        if (this.shadowBlur > 0) this.setShadowStyle(ctx);
        const maxWidth = this.maxWidth;
        if (this.overflow == Label.Overflow.RESIZE_HEIGHT) {
            const extWidth = this.extWidth();
            const wordsArr: string[] = v.split('\\n');

            let lines: string[] = [],
                oneLine = '',
                width: number,
                lineHeight = this.lineHeight;
            for (let jj = 0, nn = wordsArr.length; jj < nn; jj++) {
                let words: string | string[], blankWork = '', blankWidth = 0;
                if (this.blankBreakWord) {
                    blankWork = ' ';
                    words = wordsArr[jj].split(blankWork);
                    blankWidth = this.getMeasureWidth(ctx, blankWork);
                } else words = wordsArr[jj];

                width = extWidth;

                for (let i = 0, n = words.length; i < n; i++) {
                    const c = words[i];
                    let w = this.getMeasureWidth(ctx, c);
                    if (width + w <= maxWidth - 4 * this.hdpScale) {
                        oneLine += c + blankWork;
                        width += w + blankWidth;
                        if (i == n - 1) width += 4 * this.hdpScale;
                    } else {
                        lines[lines.length] = oneLine;
                        oneLine = c + blankWork;
                        width = extWidth + w + blankWidth;
                    }
                }

                lines[lines.length] = oneLine;
                oneLine = '';
            }
            if (oneLine != '') lines[lines.length] = oneLine;
            this.drawLines(lines, lines.length == 1 && !this.fixWidth ? width : maxWidth, lineHeight);
        } else {
            let w = this.getMeasureWidth(ctx, v),
                ww: number = 0,
                lineHeight = this.lineHeight;
            if (this.overflow == Label.Overflow.SHRINK) {
                ww = w;
            } else if (this.overflow == Label.Overflow.CLAMP) {
                ww = Math.min(w, maxWidth);
            } else {
                ww = w;
            }
            this.drawLine(v, !this.fixWidth ? ww : maxWidth, lineHeight);
        }
    }

    private drawLine(v: string, width: number, height: number) {
        const canvas = this.shareCanvas();
        let x = 2,
            y = 0;
        width += this.extWidth();
        height += this.extHeight();
        canvas.width = width;
        canvas.height = height;

        if (this.verticalAlign == VerticalTextAlignment.CENTER) {
            y = height / 2 - (this.underline ? this.underlineWidth : 0);
            if (this.shadowBlur > 0) y += (this.shadowBlur - this.shadowOffset.y) / 2;
        } else if (this.verticalAlign == VerticalTextAlignment.BOTTOM) {
            y = height - (this.underline ? this.underlineWidth : 0);
            if (this.outlineWidth > 0) y -= this.outlineWidth;
            if (this.shadowBlur > 0) y -= this.shadowBlur + (this.shadowOffset.y > 0 ? this.shadowOffset.y : 0);
        } else {
            if (this.outlineWidth > 0) y += this.outlineWidth;
            if (this.shadowBlur > 0) y += this.shadowBlur - (this.shadowOffset.y < 0 ? this.shadowOffset.y : 0);
            if (this.underline && this.underlineWidth > 0) y += this.underlineWidth;
        }

        if (this.outlineWidth > 0) {
            x += this.outlineWidth + 2;
        }
        if (this.shadowBlur > 0) {
            x += this.shadowBlur + (this.shadowOffset.x < 0 ? -this.shadowOffset.x : 0);
        }
        let ctx = canvas.getContext("2d");
        this.setFontStyle(ctx);
        if (this.shadowBlur > 0) this.setShadowStyle(ctx);
        if (this.outlineWidth > 0) {
            this.setStrokeStyle(ctx);
            ctx.strokeText(v, x, y);
        }
        // this.setFontStyle(ctx);
        ctx.fillText(v, x, y);

        this.drawUnderline(ctx, width, x, height);

        let scale = 1;
        if (this.overflow == Label.Overflow.SHRINK) {
            const maxWidth = this.maxWidth;
            if (width > maxWidth) {
                scale = maxWidth / width;
                width = maxWidth;
                height *= scale;
                ctx.scale(scale, scale);
            }
        }
        this.fixHDP(ctx, width, height);
    }

    private drawLines(lines: string[], width: number, height: number) {
        const canvas = this.shareCanvas(),
            hh = height + this.extHeight();

        canvas.width = width;
        canvas.height = hh * lines.length;
        const ctx = canvas.getContext("2d");

        lines.forEach((v, i) => {
            this.setFontStyle(ctx);
            if (this.outlineWidth > 0) this.setStrokeStyle(ctx);
            if (this.shadowBlur > 0) this.setShadowStyle(ctx);

            let y = hh * i;

            if (this.verticalAlign == VerticalTextAlignment.CENTER) {
                y += hh / 2 - (this.underline ? this.underlineWidth : 0);
                if (this.shadowBlur > 0) y += (this.shadowBlur - this.shadowOffset.y) / 2;
            } else if (this.verticalAlign == VerticalTextAlignment.BOTTOM) {
                y += hh - (this.underline ? this.underlineWidth : 0);
                if (this.outlineWidth > 0) y -= this.outlineWidth;
                if (this.shadowBlur > 0) y -= this.shadowBlur + (this.shadowOffset.y > 0 ? this.shadowOffset.y : 0);
            } else {
                if (this.outlineWidth > 0) y += this.outlineWidth;
                if (this.shadowBlur > 0) y += this.shadowBlur - (this.shadowOffset.y < 0 ? this.shadowOffset.y : 0);
                if (this.underline && this.underlineWidth > 0) y += this.underlineWidth * i;
            }

            const w = this.getMeasureWidth(ctx, v), oy = hh * (i + 1);

            let x = 2;
            if (this.horizontalAlign == HorizontalTextAlignment.LEFT) {
                if (this.outlineWidth > 0) {
                    x += this.outlineWidth + 2;
                }
                if (this.shadowBlur > 0) {
                    x += this.shadowBlur + (this.shadowOffset.x < 0 ? -this.shadowOffset.x : 0);
                }
            } else {
                if (this.horizontalAlign == HorizontalTextAlignment.CENTER) {
                    x = (width - w) / 2;
                } else {
                    x = width - w;
                }
            }
            if (this.outlineWidth > 0) {
                ctx.strokeText(v, x, y);
            }
            ctx.fillText(v, x, y);
            this.drawUnderline(ctx, w, x, oy);
        });
        this.fixHDP(ctx, width, canvas.height);
    }

    private extWidth(): number {
        let a = 2;
        if (this.outlineWidth > 0) a += this.outlineWidth * 2 + 4;
        if (this.shadowBlur > 0) a += this.shadowBlur * 2 + Math.abs(this.shadowOffset.x);
        return a;
    }

    private extHeight(): number {
        let a = 2;
        if (this.outlineWidth > 0) a += this.outlineWidth + 2;
        if (this.shadowBlur > 0) a += this.shadowBlur * 2 + Math.abs(this.shadowOffset.y);
        if (this.underline) a += this.underlineWidth + this.hdpScale;
        return a;
    }

    private fixHDP(ctx: CanvasRenderingContext2D, width: number, height: number) {
        if (this._hdp) {
            let scale = 1 / this._hdpScale;
            width *= scale;
            height *= scale;
            ctx.scale(scale, scale);
        }
        no.size(this.node, math.size(width, height));
    }

    private drawUnderline(ctx: CanvasRenderingContext2D, width: number, x: number, y: number) {
        if (!this.underline || width == 0) return;
        y -= this.underlineWidth + this.hdpScale;
        ctx.beginPath();
        ctx.strokeStyle = '#' + this._fontColor.toHEX('#rrggbb');
        ctx.lineWidth = this.underlineWidth;
        ctx.moveTo(x, y);
        ctx.lineTo(x + width - 4 * this.hdpScale, y);
        ctx.stroke();
    }

    private setPackedTexture() {
        if (EDITOR) return false;
        const p = this.dynamicAtlas?.getSpriteFrameInstance(this.getUuid());
        if (p) {
            let width = p.rect.width,
                height = p.rect.height;
            if (this.overflow == Label.Overflow.SHRINK) {
                const maxWidth = this.maxWidth;
                if (width > maxWidth) {
                    let scale = maxWidth / width;
                    width = maxWidth;
                    height *= scale;
                }
            }
            if (this._hdp) {
                let scale = 1 / this._hdpScale;
                width *= scale;
                height *= scale;
            }
            no.size(this.node, math.size(width, height));
            this.spriteFrame = p;
            return true;
        }
        return false;
    }

    private updateTexture() {
        const canvas = this.shareCanvas();
        if (!canvas.width || !canvas.height) return;
        if (this.packToAtlas && this.dynamicAtlas) {
            this.dynamicAtlas.packCanvasToDynamicAtlas(this, this.getUuid(), canvas, () => {
                const image = new ImageAsset(canvas);
                this._texture = new Texture2D();
                this._texture.image = image;
                let spriteFrame = new SpriteFrame();
                spriteFrame.texture = this._texture;
                this.spriteFrame = spriteFrame;
            });
        } else {
            const image = new ImageAsset(canvas);
            this._texture = new Texture2D();
            this._texture.image = image;
            let spriteFrame = new SpriteFrame();
            spriteFrame.texture = this._texture;
            this.spriteFrame = spriteFrame;
        }
    }

    private drawRichString(v: string) {
        if (this.overflow != Label.Overflow.RESIZE_HEIGHT) this.drawRichStringNotResizeHeight(v);
        else this.drawRichStringWithResizeHeight(v);
    }

    private drawRichStringNotResizeHeight(v: string) {
        const maxWidth = this.maxWidth;
        const ctx = this.shareCanvas().getContext("2d");
        let a = new HtmlTextParser().parse(v),
            ww = 0,
            lineHeight = this.lineHeight,
            maxSize = this.fontSize;
        for (let i = 0, n = a.length; i < n; i++) {
            const aa = a[i], style = aa.style, text = aa.text;
            this.setFontStyle(ctx, style?.color, style?.size, style?.bold, style?.italic);
            if (style?.outline || this.outlineWidth > 0) this.setStrokeStyle(ctx, style?.outline?.color, style?.outline?.width);
            if (this.shadowBlur > 0) this.setShadowStyle(ctx);
            maxSize = Math.max(maxSize, style?.size || 0);

            let w = this.getMeasureWidth(ctx, v, style?.size);
            ww += w;
        }
        if (this.overflow == Label.Overflow.CLAMP) {
            ww = Math.min(ww, maxWidth);
        }
        this.drawHtmlTexts(a, !this.fixWidth ? ww : maxWidth, lineHeight, maxSize);
    }

    private drawRichStringWithResizeHeight(v: string) {
        const maxWidth = this.maxWidth;
        const ctx = this.shareCanvas().getContext("2d");
        const extWidth = this.extWidth();
        let blankWork = '', blankWidth = 0;
        if (this.blankBreakWord) {
            blankWork = ' ';
            blankWidth = this.getMeasureWidth(ctx, blankWork);
        }

        let a = new HtmlTextParser().parse(v),
            lines: any[] = [],
            oneLine: any = { htmls: [], width: 0 },
            width = extWidth,
            lineHeight = this.lineHeight;

        for (let i = 0, n = a.length; i < n; i++) {
            const aa = a[i], style = aa.style, text = aa.text;

            if (style?.isNewLine && text == '') {
                oneLine.width = width;
                lines[lines.length] = no.clone(oneLine);
                oneLine.htmls.length = 0;
                width = extWidth;
                continue;
            }

            let html: IHtmlTextParserResultObj = { style: style, text: '' };

            if (this.blankBreakWord && text == blankWork) {
                if (width + blankWidth <= maxWidth) {
                    html.text += blankWork;
                    width += blankWidth;
                    oneLine.htmls[oneLine.htmls.length] = html;
                    oneLine.width = width;
                } else {
                    lines[lines.length] = no.clone(oneLine);
                    oneLine.htmls.length = 0;
                    width = extWidth;
                }
                continue;
            }

            this.setFontStyle(ctx, style?.color, style?.size, style?.bold, style?.italic);
            if (style?.outline || this.outlineWidth > 0) this.setStrokeStyle(ctx, style?.outline?.color, style?.outline?.width);
            if (this.shadowBlur > 0) this.setShadowStyle(ctx);

            let words: string | string[];
            if (this.blankBreakWord)
                words = text.split(blankWork);
            else words = text;

            for (let i = 0, n = words.length; i < n; i++) {
                const c = words[i];
                let w = this.getMeasureWidth(ctx, c, style?.size);
                if (width + w <= maxWidth - 4 * this.hdpScale) {
                    html.text += c + (i < n - 1 ? blankWork : '');
                    width += w + (i < n - 1 ? blankWidth : 0);
                    if (i == n - 1) width += 4 * this.hdpScale;
                } else {
                    if (html.text != '') {
                        oneLine.htmls[oneLine.htmls.length] = html;
                    }
                    oneLine.width = width;
                    lines[lines.length] = no.clone(oneLine);
                    html.text = c + (i < n - 1 ? blankWork : '');
                    width = extWidth + w + (i < n - 1 ? blankWidth : 0);
                    oneLine.htmls.length = 0;
                }
            }
            if (html.text != '') {
                oneLine.htmls[oneLine.htmls.length] = html;
            }
        }
        if (oneLine.htmls.length > 0) {
            oneLine.width = width;
            lines[lines.length] = oneLine;
        }
        this.drawHtmlLines(lines, lines.length == 1 && !this.fixWidth ? width : maxWidth, lineHeight);
    }

    private drawHtmlTexts(htmls: IHtmlTextParserResultObj[], width: number, height: number, fontSize: number) {
        const canvas = this.shareCanvas();

        let x = 2,
            y = 0;
        width += this.extWidth();
        height += this.extHeight();
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (this.verticalAlign == VerticalTextAlignment.CENTER) {
            y = height / 2 - (this.underline ? this.underlineWidth : 0);
            if (this.shadowBlur > 0) y += (this.shadowBlur - this.shadowOffset.y) / 2;
        } else if (this.verticalAlign == VerticalTextAlignment.BOTTOM) {
            y = height - (this.underline ? this.underlineWidth : 0);
            if (this.outlineWidth > 0) y -= this.outlineWidth;
            if (this.shadowBlur > 0) y -= this.shadowBlur + (this.shadowOffset.y > 0 ? this.shadowOffset.y : 0);
        } else {
            if (this.outlineWidth > 0) y += this.outlineWidth;
            if (this.shadowBlur > 0) y += this.shadowBlur - (this.shadowOffset.y < 0 ? this.shadowOffset.y : 0);
            if (this.underline && this.underlineWidth > 0) y += this.underlineWidth;
        }

        if (this.outlineWidth > 0) {
            x += this.outlineWidth + 2;
        }
        if (this.shadowBlur > 0) {
            x += this.shadowBlur + (this.shadowOffset.x < 0 ? -this.shadowOffset.x : 0);
        }

        let len = 0, x1 = x;
        for (let i = 0, n = htmls.length; i < n; i++) {
            const html = htmls[i], style = html.style, text = html.text;
            this.setFontStyle(ctx, style?.color, style?.size, style?.bold, style?.italic);
            if (this.shadowBlur > 0) this.setShadowStyle(ctx);
            if (style?.outline || this.outlineWidth > 0) {
                this.setStrokeStyle(ctx, style?.outline?.color, style?.outline?.width);
                ctx.strokeText(text, x, y);
            }
            ctx.fillText(text, x, y);
            const w = this.getMeasureWidth(ctx, text, style?.size);
            x += w;
            len += w;
        }

        this.drawUnderline(ctx, len, x1, height);

        let scale = 1;
        if (this.overflow == Label.Overflow.SHRINK) {
            const maxWidth = this.maxWidth;
            if (width > maxWidth) {
                scale = maxWidth / width;
                width = maxWidth;
                height *= scale;
                ctx.scale(scale, scale);
            }
        }
        this.fixHDP(ctx, width, height);
    }

    private drawHtmlLines(lines: any[], width: number, height: number) {
        const canvas = this.shareCanvas(),
            hh = height + this.extHeight();

        canvas.width = width;
        canvas.height = hh * lines.length;
        const ctx = canvas.getContext("2d");

        lines.forEach((line, i) => {
            let y = hh * i;

            if (this.verticalAlign == VerticalTextAlignment.CENTER) {
                y += hh / 2 - (this.underline ? this.underlineWidth : 0);
                if (this.shadowBlur > 0) y += (this.shadowBlur - this.shadowOffset.y) / 2;
            } else if (this.verticalAlign == VerticalTextAlignment.BOTTOM) {
                y += hh - (this.underline ? this.underlineWidth : 0);
                if (this.outlineWidth > 0) y -= this.outlineWidth;
                if (this.shadowBlur > 0) y -= this.shadowBlur + (this.shadowOffset.y > 0 ? this.shadowOffset.y : 0);
            } else {
                if (this.outlineWidth > 0) y += this.outlineWidth;
                if (this.shadowBlur > 0) y += this.shadowBlur - (this.shadowOffset.y < 0 ? this.shadowOffset.y : 0);
                if (this.underline && this.underlineWidth > 0) y += this.underlineWidth * i;
            }

            let x = 2;
            if (this.horizontalAlign == HorizontalTextAlignment.LEFT) {
                if (this.outlineWidth > 0) {
                    x += this.outlineWidth + 2;
                }
                if (this.shadowBlur > 0) {
                    x += this.shadowBlur + (this.shadowOffset.x < 0 ? -this.shadowOffset.x : 0);
                }
            } else {
                let w = line.width;
                if (this.horizontalAlign == HorizontalTextAlignment.CENTER) {
                    x = (width - w) / 2;
                } else {
                    x = width - w;
                }
            }

            let len = 0, x1 = x;
            for (let j = 0, n = line.htmls.length; j < n; j++) {
                const html = line.htmls[j], style = html.style, text = html.text;
                this.setFontStyle(ctx, style?.color, style?.size, style?.bold, style?.italic);
                if (this.shadowBlur > 0) this.setShadowStyle(ctx);
                if (style?.outline || this.outlineWidth > 0) {
                    this.setStrokeStyle(ctx, style?.outline?.color, style?.outline?.width);
                    ctx.strokeText(text, x1, y);
                }
                ctx.fillText(text, x1, y);
                const w = this.getMeasureWidth(ctx, text, style?.size);
                x1 += w;
                len += w;
            }

            this.drawUnderline(ctx, len, x, hh * (i + 1));
        });

        this.fixHDP(ctx, width, canvas.height);
    }

    public removeLabel() {
        this.spriteFrame = null;
        this._needSetLabel = false;
    }

    public resetLabel() {
        this._needSetLabel = true;
        this.setLabel();
    }
}
