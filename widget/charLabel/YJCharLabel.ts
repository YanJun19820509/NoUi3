import { EDITOR, ccclass, property, Font, Color, Label, Vec2, v2, Sprite, Enum, SpriteFrame, Texture2D, CCString, ImageAsset, SpriteAtlas, math, size, rect, HtmlTextParser, IHtmlTextParserResultObj, isValid, HorizontalTextAlignment, DEBUG, VerticalTextAlignment, view, TTFFont, sys, color } from '../../yj';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { no } from '../../no';
import { YJJobManager } from '../../base/YJJobManager';
import { TextureInfoInGPU } from '../../engine/TextureInfoInGPU';
import { DynamicAtlasTexture } from '../../engine/atlas';
import { YJSample2DMaterialManager } from 'NoUi3/engine/YJSample2DMaterialManager';
import { YJMacroConfig } from 'NoUi3/macro';
import { YJGradientColor } from './YJGradientColor';

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


//已测量文字最大最小宽
const _measuredWidth: Map<string, number> = new Map();

/**
 * 自定义文本渲染组件
 * 继承自Sprite组件，支持富文本、描边、渐变色等特性
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
    set spriteFrame(value: SpriteFrame) {
        if (this._spriteFrame === value) {
            return;
        }

        const lastSprite = this._spriteFrame;
        this._spriteFrame = value;
        this.markForUpdateRenderData();
        this['_applySpriteFrame'](lastSprite);
        if (EDITOR) {
            this.node.emit(Sprite.EventType.SPRITE_FRAME_CHANGED, this);
        }
    }
    get spriteFrame(): SpriteFrame {
        return this._spriteFrame;
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
        return color(255, 255, 255, 255);
    }
    public set color(v: Color) {

    }

    /** 文本内容 */
    @property({ type: CCString, multiline: true })
    set string(v: string) {
        if (v == this._string) return;
        this._string = v;
        this.setLabel();
    }
    get string() {
        return this._string;
    }

    /** 文本颜色 */
    @property({ type: Color, override: true })
    public get fontColor(): Color {
        return this._fontColor;
    }
    public set fontColor(v: Color) {
        if (v.equals(this._fontColor)) return;
        this._fontColor = v;
        this.setLabel();
    }

    /** 渐变色配置 */
    @property({ serializable: true })
    _gradientColor: YJGradientColor = null;
    @property({ type: YJGradientColor })
    public get gradientColor(): YJGradientColor {
        return this._gradientColor;
    }
    public set gradientColor(v: YJGradientColor) {
        if (v == this._gradientColor) return;
        this._gradientColor = v;
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
        if (this._autoLineHeight) {
            this.lineHeight = this._fontSize * 1.2;
        }
        this.setLabel();
    }

    /** 
     * 自定义字体
     * 如果没有设置自定义字体，则优先使用YJTTFLoader中加载的字体，如果不存在则使用系统字体
     */
    @property({ type: Font, tooltip: '如果没有设置自定义字体，则优先使用YJTTFLoader中加载的字体，如果不存在则使用系统字体' })
    public get font(): Font {
        return this._font;
    }

    public set font(v: TTFFont) {
        if (v == this._font) return;
        this._font = v;
        this._fontUuid = v ? v.uuid : '';
        this.fontFamily = v ? v['_fontFamily'] : 'Arial';
        this.setLabel();
    }
    @property
    public get useSys(): boolean {
        return false;
    }

    public set useSys(v: boolean) {
        this._font = null;
        this._fontUuid = '';
        this._foitnFamily = 'Arial';
    }
    //系统字体
    @property({ readonly: true })
    public get fontFamily(): string {
        return this._foitnFamily;
    }

    public set fontFamily(v: string) {
        if (v == this._foitnFamily) return;
        this._foitnFamily = v;
    }
    @property({ displayName: '自动行高' })
    public get autoLineHeight(): boolean {
        return this._autoLineHeight;
    }

    public set autoLineHeight(v: boolean) {
        if (v == this._autoLineHeight) return;
        this._autoLineHeight = v;
        if (v) {
            this.lineHeight = this._fontSize * 1.2;
        }
    }
    /** 行高 */
    @property({ visible() { return !this._autoLineHeight; } })
    public get lineHeight(): number {
        return this._lineHeight * this.hdpScale;
    }

    public set lineHeight(v: number) {
        if (v == this._lineHeight) return;
        this._lineHeight = v;
        this.setLabel();
    }
    /** 水平对齐方式 */
    @property({ type: Enum(HorizontalTextAlignment) })
    public get horizontalAlign(): number {
        return this._horizontalAlign;
    }

    public set horizontalAlign(v: number) {
        if (v == this._horizontalAlign) return;
        this._horizontalAlign = v;
        this.setLabel();
    }
    /** 垂直对齐方式 */
    // @property({ type: Enum(VerticalTextAlignment), visible() { return false; } })
    // public get verticalAlign(): number {
    //     return 1;
    // }

    // public set verticalAlign(v: number) {
    //     if (v == this._verticalAlign) return;
    //     this._verticalAlign = v;
    //     this.setLabel();
    // }
    /** 
     * 文字排版模式
     * NONE: 不限制大小
     * CLAMP: 超出部分裁剪
     * SHRINK: 自动缩小以适应宽度
     * RESIZE_HEIGHT: 固定宽度，自动调整高度
     */
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
    /** 最大宽度限制 */
    @property({ visible() { return this._overflow != Label.Overflow.NONE; } })
    public get maxWidth(): number {
        return this._maxWidth * this.hdpScale;
    }

    public set maxWidth(v: number) {
        if (v == this._maxWidth) return;
        this._maxWidth = v;
        this.setLabel();
    }
    //固定宽
    @property({ visible() { return this._overflow != Label.Overflow.NONE; } })
    public get fixWidth(): boolean {
        if (this._overflow == Label.Overflow.NONE) return false;
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
        return true;
    }

    public set packToAtlas(v: boolean) {
        if (v == this._packToAtlas) return;
        this._packToAtlas = v;
    }


    @property({ serializable: true })
    protected _string: string = '';
    @property({ serializable: true })
    protected _fontColor: Color = Color.WHITE.clone();
    @property({ serializable: true })
    protected _fontSize: number = 22;
    @property({ serializable: true })
    protected _font: TTFFont = null;
    @property({ serializable: true })
    protected _fontUuid: string = '';
    @property({ serializable: true })
    protected _foitnFamily: string = 'Arial';
    @property({ serializable: true })
    protected _autoLineHeight: boolean = true;
    @property({ serializable: true })
    protected _lineHeight: number = 28;
    @property({ serializable: true })
    protected _horizontalAlign: number = 0;
    @property({ serializable: true })
    protected _verticalAlign: number = 2;
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
    @property({ visible() { return false; } })
    panelName: string;
    @property({ visible() { return false; } })
    materialInfoUuid: string;

    //高清模式系数
    private _hdpScale = 2;

    private _needSet: boolean = true;

    private static fontMap: { [uuid: string]: TTFFont } = {};
    private static fontLoading: { [uuid: string]: boolean } = {};
    private _uid: string = '';
    private dynamicAtlas: YJDynamicAtlas = null;


    onLoad() {
        super.onLoad();
        if (EDITOR) {
            if (!this._fontUuid) {
                const font = YJMacroConfig.TTF_FONT; //默认字体
                if (font) {
                    no.EditorMode.getAssetByFileName<TTFFont>(font).then(ttf => {
                        this.font = ttf;
                    });
                }
            }
            return;
        }
        if (this.packToAtlas || !this.customMaterial) {
            this.dynamicAtlas = YJSample2DMaterialManager.ins.getMaterialInfo(this.materialInfoUuid).dynamicAtlas;
            this.customMaterial = this.dynamicAtlas.customMaterial;
        }
        if (this._needSet)
            this.setLabel();
    }

    onDestroy() {
        if (!(this.spriteFrame?.texture instanceof DynamicAtlasTexture)) {
            this.spriteFrame?.texture?.destroy();
        }
        super.onDestroy();
        this.unscheduleAllCallbacks();
        this.node.targetOff(this);
        this.clearCanvas();
    }

    onEnable() {
        super.onEnable();
        if (this._needSet)
            this.setLabel();
    }

    /**
     * 更新文本渲染
     * 处理文本的样式设置和渲染逻辑
     */
    private async setLabel() {
        if (!await no.Throttling.ins(this).wait(.2, true)) return;
        if (EDITOR && !this._needSetLabel) return;
        if (!this.enabledInHierarchy || !isValid(this.node)) {
            this._needSet = true;
            return;
        }
        this._needSet = false;
        this.clearCanvas();
        if (this._string == '') {
            this.clearString();
            return;
        } else {
            this.updateUuid();
            if (this.packToAtlas && this.setPackedTexture()) return;
            this.loadFont().then(() => {
                this.toDraw();
            });
        }
    }

    private async toDraw() {
        if (this.richText) {
            this.drawRichString(this._string);
        } else {
            this.drawString(this._string);
        }
        this.updateTexture();
    }

    private get hdpScale(): number {
        return this._hdp ? this._hdpScale : 1;
    }

    private updateUuid() {
        let a = this.string + "_" + this._fontColor + "_" + this.fontSize + "_" + this.fontFamily + "_" + this.outlineColor + '_' + this.outlineWidth + '_' + (this.bold ? '1' : '0') + '_' + (this.italic ? '1' : '0');
        this._uid = no.Hash(a).toString();
    }

    private _canvas: { canvas: HTMLCanvasElement, context: CanvasRenderingContext2D };
    private shareCanvas() {
        if (!this._canvas) {
            this._canvas = no.canvasPool.get();
        }
        return this._canvas;
    }

    private clearCanvas() {
        if (this._canvas) {
            no.canvasPool.put(this._canvas);
            this._canvas = null;
        }
    }

    private setFontStyle(ctx: CanvasRenderingContext2D, color?: string, fontSize?: number, bold?: boolean, italic?: boolean) {
        if (color == null) color = '#' + this._fontColor.toHEX('#rrggbb');
        if (fontSize == null) fontSize = this.fontSize;
        else fontSize *= this._hdp ? this._hdpScale : 1;
        if (bold == null) bold = this.bold;
        if (italic == null) italic = this.italic;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.imageSmoothingQuality = 'high';
        ctx.font = `${italic ? 'italic' : 'normal'} ${bold ? 'bold' : ''} ${fontSize}px ${this.fontFamily}`;
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
        canvas.canvas.width = 0;
        canvas.canvas.height = this._lineHeight;
        no.size(this.node, math.size(0, this._lineHeight));
        this.spriteFrame = null;
    }

    private isASCII(c: string) {
        return c.charCodeAt(0) < 128;
    }

    private getCharWidth(c: string, fontSize: number): number {
        const a = this.isASCII(c);
        if (a) {
            const k = c + '::' + fontSize;
            if (!_measuredWidth.has(k)) {
                const ctx = this.shareCanvas().context;
                const mt = ctx.measureText(c);
                _measuredWidth.set(k, mt.width);
            }
            return _measuredWidth.get(k);
        } else {
            return fontSize;
        }
    }

    private measureWidth(ctx: CanvasRenderingContext2D, str: any, fontSize?: number): number {
        if (fontSize == null) fontSize = this.fontSize;
        else fontSize *= this._hdp ? this._hdpScale : 1;
        let w = 0;
        for (let i = 0, n = str.length; i < n; i++) {
            w += this.getCharWidth(str[i], fontSize);
        }
        return w;
    }

    /**
     * 绘制普通文本
     * @param v 要绘制的文本内容
     */
    private drawString(v: string) {
        const ctx = this.shareCanvas().context;
        this.setFontStyle(ctx);
        if (this.shadowBlur > 0) this.setShadowStyle(ctx);
        if (this._overflow == Label.Overflow.RESIZE_HEIGHT) {
            let maxWidth = this.maxWidth;
            const extWidth = this.extWidth();
            // 处理换行符
            const lines = v.split('\\n');
            let resultLines: string[] = [];
            const halfWidth = this.fontSize / 2;
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                // 如果是空行，直接添加
                if (line.length === 0) {
                    resultLines[resultLines.length] = '';
                    continue;
                }

                // 分词处理
                const words = this.splitIntoWords(line);
                let currentLine = '';
                let currentWidth = extWidth;

                for (let j = 0; j < words.length; j++) {
                    const word = words[j];
                    const wordWidth = this.measureWidth(ctx, word);

                    // 检查是否需要换行
                    if (currentWidth + wordWidth <= this.maxWidth + halfWidth) {
                        currentLine += word;
                        currentWidth += wordWidth;
                    } else {
                        // 如果当前行不为空，先保存当前行
                        if (currentLine) {
                            resultLines[resultLines.length] = currentLine;
                            currentLine = '';
                            if (currentWidth > maxWidth) maxWidth = currentWidth;
                            currentWidth = extWidth;
                        }

                        // 处理单个词超过最大宽度的情况
                        if (wordWidth > this.maxWidth + halfWidth) {
                            // 逐字符添加
                            let tempLine = '';
                            let tempWidth = extWidth;

                            for (let k = 0; k < word.length; k++) {
                                const char = word[k];
                                const charWidth = this.measureWidth(ctx, char);

                                if (tempWidth + charWidth <= this.maxWidth + halfWidth) {
                                    tempLine += char;
                                    tempWidth += charWidth;
                                } else {
                                    if (tempLine) {
                                        resultLines[resultLines.length] = tempLine;
                                        if (tempWidth > maxWidth) maxWidth = tempWidth;
                                    }
                                    tempLine = char;
                                    tempWidth = extWidth + charWidth;
                                }
                            }

                            if (tempLine) {
                                currentLine = tempLine;
                                currentWidth = tempWidth;
                            }
                        } else {
                            currentLine = word;
                            currentWidth = extWidth + wordWidth;
                        }
                    }
                }

                // 添加最后一行
                if (currentLine) {
                    resultLines[resultLines.length] = currentLine;
                }
            }

            this.drawLines(resultLines, this.fixWidth ? this.maxWidth : maxWidth, this.lineHeight);
        } else {
            // 处理换行符
            const lines = v.split('\\n');
            let resultLines: string[] = [];
            let maxWidth = 0;
            for (let i = 0; i < lines.length; i++) {
                const currentLine = lines[i];
                let w = this.measureWidth(ctx, currentLine),
                    ww: number = 0;
                if (this._overflow == Label.Overflow.SHRINK) {
                    ww = w;
                } else if (this._overflow == Label.Overflow.CLAMP) {
                    ww = Math.min(w, this.maxWidth);
                } else {
                    ww = w;
                }
                if (maxWidth < ww) maxWidth = ww;
                resultLines[resultLines.length] = currentLine;
            }
            const width = this._overflow != Label.Overflow.NONE && this.fixWidth ? this.maxWidth : maxWidth;
            if (resultLines.length > 1) {
                this.drawLines(resultLines, width + this.extWidth(), this.lineHeight);
            } else {
                this.drawLine(resultLines[0], width, this.lineHeight);
            }
        }
        return false;
    }

    private drawLine(v: string, width: number, height: number) {
        const canvas = this.shareCanvas();
        width += this.extWidth() + 2;
        height += this.extHeight();
        canvas.canvas.width = width;
        canvas.canvas.height = height;

        let x = 2,
            y = 0;
        //有下划线或者溢出模式不为NONE时，改为顶对齐，y需要从2开始
        // if (this.underline || this._overflow != Label.Overflow.NONE) {
        if (this.outlineWidth > 0) y += this.outlineWidth / 2;
        if (this.shadowBlur > 0 && this.shadowOffset.y < 0) {
            y -= this.shadowOffset.y;
        }
        // } else {
        //     if (this.shadowBlur > 0) y -= this.shadowOffset.y / 2;
        // }

        if (this.outlineWidth > 0) {
            x += this.outlineWidth + 2;
        }
        if (this.shadowBlur > 0) {
            x += this.shadowBlur + (this.shadowOffset.x < 0 ? -this.shadowOffset.x : 0);
        }
        let ctx = canvas.context;
        this.setFontStyle(ctx);
        // if (this.underline)
        //     ctx.textBaseline = 'top';
        if (this.gradientColor) {
            ctx.fillStyle = this.gradientColor.createGradient(ctx, { x: 0, y, width, height });
        }
        if (this.shadowBlur > 0) this.setShadowStyle(ctx);
        if (this.outlineWidth > 0) {
            this.setStrokeStyle(ctx);
        }
        // this.setFontStyle(ctx);
        const fontSize = this.fontSize;
        let x1 = x;
        for (let i = 0, n = v.length; i < n; i++) {
            const c = v[i], w = this.getCharWidth(c, fontSize);
            if (this.outlineWidth > 0) {
                ctx.strokeText(c, x1, y);
            }
            ctx.fillText(c, x1, y);
            x1 += w;
        }

        this.drawUnderline(ctx, width, x, height);

        let scale = 1;
        if (this._overflow == Label.Overflow.SHRINK) {
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
        width += this.extWidth() + 2;
        canvas.canvas.width = width;
        canvas.canvas.height = hh * lines.length;
        const ctx = canvas.context;

        for (let i = 0; i < lines.length; i++) {
            let v = lines[i];
            this.setFontStyle(ctx);
            if (this.outlineWidth > 0) this.setStrokeStyle(ctx);
            if (this.shadowBlur > 0) this.setShadowStyle(ctx);

            let y = hh * i;
            if (this.outlineWidth > 0) y += this.outlineWidth / 2;
            if (this.shadowBlur > 0 && this.shadowOffset.y < 0) {
                y -= this.shadowOffset.y;
            }

            const w = this.measureWidth(ctx, v);

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
            if (this.gradientColor) {
                ctx.fillStyle = this.gradientColor.createGradient(ctx, { x: 0, y, width: canvas.canvas.width, height: 0 });
            }
            const fontSize = this.fontSize;
            let x1 = x;
            for (let j = 0; j < v.length; j++) {
                const c = v[j], w = this.getCharWidth(c, fontSize);
                if (this.outlineWidth > 0)
                    ctx.strokeText(c, x1, y);
                ctx.fillText(c, x1, y);
                x1 += w;
            }
            this.drawUnderline(ctx, w, x, hh * (i + 1));
        }
        this.fixHDP(ctx, width, canvas.canvas.height);
    }

    private extWidth(): number {
        let a = 2;
        if (this.outlineWidth > 0) a += this.outlineWidth * 2 + 4;
        if (this.shadowBlur > 0) a += this.shadowBlur + Math.abs(this.shadowOffset.x);
        return a;
    }

    private extHeight(): number {
        let a = 2;
        if (this.outlineWidth > 0) a += this.outlineWidth * 2;
        if (this.shadowBlur > 0) a += this.shadowBlur + Math.abs(this.shadowOffset.y);
        if (this.underline) a += this.underlineWidth * this.hdpScale;
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
        y -= this.underlineWidth * this.hdpScale + 2;
        if (this.shadowBlur > 0 && this.shadowOffset.y > 0) y -= this.shadowOffset.y;
        ctx.beginPath();
        ctx.strokeStyle = '#' + this._fontColor.toHEX('#rrggbb');
        ctx.lineWidth = this.underlineWidth;
        ctx.moveTo(x, y);
        ctx.lineTo(x + width - 4 * this.hdpScale, y);
        ctx.stroke();
    }

    private setPackedTexture() {
        if (EDITOR) return false;
        const p = this.dynamicAtlas?.getSpriteFrameInstance(this._uid);
        if (p) {
            let width = p.rect.width,
                height = p.rect.height;
            if (this._overflow == Label.Overflow.SHRINK) {
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
        if (!canvas.canvas.width || !canvas.canvas.height) return;
        if (!(this.spriteFrame?.texture instanceof DynamicAtlasTexture)) {
            this.spriteFrame?.texture?.destroy();
        }
        const image = new ImageAsset(canvas.canvas);
        const texture = new Texture2D();
        texture['_uuid'] = 'yjchar@' + this._uid;
        texture.image = image;
        TextureInfoInGPU.addTextureUuidToPanel(texture['_uuid'], this.panelName);
        let spriteFrame = new SpriteFrame();
        spriteFrame['_uuid'] = this._uid;
        spriteFrame.texture = texture;
        this.spriteFrame = spriteFrame;

        if (this.packToAtlas && this.dynamicAtlas) {
            YJJobManager.ins.addTask(this.packSpriteFrame.bind(this));
        }
        this.clearCanvas();
    }

    private packSpriteFrame() {
        const s = this.dynamicAtlas.packSpriteFrame(this.spriteFrame, true);
        if (s) {
            this.spriteFrame.texture.destroy();
            this.spriteFrame.destroy();
            this.spriteFrame = s;
        }
        // no.size(this.node, size(this.spriteFrame.rect.width, this.spriteFrame.rect.height));
        return true;
    }

    /**
     * 绘制富文本
     * 支持HTML标签和样式
     * @param v 富文本内容
     */
    private drawRichString(v: string) {
        if (this._overflow != Label.Overflow.RESIZE_HEIGHT) this.drawRichStringNotResizeHeight(v);
        else this.drawRichStringWithResizeHeight(v);
        return false;
    }

    private drawRichStringNotResizeHeight(v: string) {
        const ctx = this.shareCanvas().context;
        const extWidth = this.extWidth();
        let a = new HtmlTextParser().parse(v),
            lines: any[] = [],
            oneLine: any = { htmls: [], width: 0 },
            width = extWidth,
            lineHeight = this.lineHeight,
            ww = 0,
            maxSize = this.fontSize,
            maxWidth = 0;
        for (let i = 0, n = a.length; i < n; i++) {
            const aa = a[i], style = aa.style, text = aa.text;

            if (style?.isNewLine && text == '') {
                oneLine.width = width;
                lines[lines.length] = no.clone(oneLine);
                oneLine.htmls.length = 0;
                width = extWidth;
                if (maxWidth < ww) maxWidth = ww;
                ww = 0;
                continue;
            }

            this.setFontStyle(ctx, style?.color, style?.size, style?.bold, style?.italic);
            if (style?.outline || this.outlineWidth > 0) this.setStrokeStyle(ctx, style?.outline?.color, style?.outline?.width);
            if (this.shadowBlur > 0) this.setShadowStyle(ctx);

            maxSize = Math.max(maxSize, style?.size || 0);

            let w = this.measureWidth(ctx, text, style?.size);
            ww += w;

            oneLine.htmls[oneLine.htmls.length] = { style, text };
        }
        // 添加最后一行
        if (oneLine) {
            lines[lines.length] = oneLine;
        }
        if (maxWidth < ww) maxWidth = ww;

        let www = maxWidth;
        if (this._overflow != Label.Overflow.NONE) {
            if (this.fixWidth) {
                www = this.maxWidth;
            } else if (this._overflow == Label.Overflow.CLAMP) {
                www = Math.min(maxWidth, this.maxWidth);
            }
        }

        if (lines.length > 1) {
            this.drawHtmlLines(lines, www + this.extWidth(), lineHeight);
        } else {
            this.drawHtmlTexts(a, www, lineHeight, maxSize);
        }
    }

    /**
     * 处理自适应高度的富文本渲染
     * 根据容器宽度自动换行并调整高度
     * @param v 富文本内容
     */
    private drawRichStringWithResizeHeight(v: string) {
        let maxWidth = this.maxWidth;
        const ctx = this.shareCanvas().context;
        const extWidth = this.extWidth();
        const halfWidth = this.fontSize / 2;
        let blankWork = '', blankWidth = 0;
        if (this.blankBreakWord) {
            blankWork = ' ';
            blankWidth = this.measureWidth(ctx, blankWork);
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
                if (width + blankWidth <= this.maxWidth + halfWidth) {
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
                let w = this.measureWidth(ctx, c, style?.size);
                if (width + w <= this.maxWidth + halfWidth) {
                    html.text += c + (i < n - 1 ? blankWork : '');
                    width += w + (i < n - 1 ? blankWidth : 0);
                    if (i == n - 1) width += 4 * this.hdpScale;
                } else {
                    if (html.text != '') {
                        oneLine.htmls[oneLine.htmls.length] = html;
                    }
                    oneLine.width = width;
                    if (width > maxWidth) maxWidth = width;
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
            if (width > maxWidth) maxWidth = width;
            lines[lines.length] = oneLine;
        }
        this.drawHtmlLines(lines, this.fixWidth ? this.maxWidth : maxWidth, lineHeight);
    }

    private drawHtmlTexts(htmls: IHtmlTextParserResultObj[], width: number, height: number, fontSize: number) {
        const canvas = this.shareCanvas();
        width += this.extWidth() + 2;
        height += this.extHeight();
        canvas.canvas.width = width;
        canvas.canvas.height = height;
        let x = 2,
            y = 0;
        //有下划线或者溢出模式不为NONE时，改为顶对齐，y需要从2开始
        // if (this.underline || this._overflow != Label.Overflow.NONE) {
        if (this.outlineWidth > 0) y += this.outlineWidth / 2;
        if (this.shadowBlur > 0 && this.shadowOffset.y < 0) {
            y -= this.shadowOffset.y;
        }
        // } else {
        //     if (this.shadowBlur > 0) y -= this.shadowOffset.y / 2;
        // }
        if (this.outlineWidth > 0) {
            x += this.outlineWidth + 2;
        }
        if (this.shadowBlur > 0) {
            x += this.shadowBlur + (this.shadowOffset.x < 0 ? -this.shadowOffset.x : 0);
        }

        const ctx = canvas.context;
        let len = 0, x1 = x;
        for (let i = 0, n = htmls.length; i < n; i++) {
            const html = htmls[i], style = html.style, text = html.text;
            this.setFontStyle(ctx, style?.color, style?.size, style?.bold, style?.italic);
            // if (this.underline)
            //     ctx.textBaseline = 'top';
            if (this.shadowBlur > 0) this.setShadowStyle(ctx);
            if (style?.outline || this.outlineWidth > 0) {
                this.setStrokeStyle(ctx, style?.outline?.color, style?.outline?.width);
            }
            if (this.gradientColor) {
                ctx.fillStyle = this.gradientColor.createGradient(ctx, { x: 0, y, width: canvas.canvas.width, height: 0 });
            }
            const fontSize = style?.size * this.hdpScale || this.fontSize;
            let x2 = x1;
            for (let i = 0, n = text.length; i < n; i++) {
                const c = text[i], w = this.getCharWidth(c, fontSize);

                if (style?.outline || this.outlineWidth > 0) {
                    ctx.strokeText(c, x2, y);
                }
                ctx.fillText(c, x2, y);
                x2 += w;
            }
            // const w = this.measureWidth(ctx, text, style?.size);
            len += x2 - x1;
            x1 = x2;
        }

        this.drawUnderline(ctx, len, x, height);

        let scale = 1;
        if (this._overflow == Label.Overflow.SHRINK) {
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

    /**
     * 绘制HTML文本行
     * @param lines HTML文本行数组
     * @param width 容器宽度
     * @param height 行高
     */
    private drawHtmlLines(lines: any[], width: number, height: number) {
        const canvas = this.shareCanvas(),
            hh = height + this.extHeight();

        width += this.extWidth() + 2;
        canvas.canvas.width = width;
        canvas.canvas.height = hh * lines.length;
        const ctx = canvas.context;

        for (let i = 0, n = lines.length; i < n; i++) {
            const line = lines[i];
            let y = hh * i;

            if (this.outlineWidth > 0) y += this.outlineWidth / 2;
            if (this.shadowBlur > 0 && this.shadowOffset.y < 0) {
                y -= this.shadowOffset.y;
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
            const htmls = line.htmls;
            for (let j = 0, m = htmls.length; j < m; j++) {
                const html = htmls[j], style = html.style, text = html.text;
                this.setFontStyle(ctx, style?.color, style?.size, style?.bold, style?.italic);
                // ctx.textBaseline = 'top';
                if (this.shadowBlur > 0) this.setShadowStyle(ctx);

                const fontSize = style?.size * this.hdpScale || this.fontSize;
                let x2 = x1;

                // 先绘制描边
                if (style?.outline || this.outlineWidth > 0) {
                    this.setStrokeStyle(ctx, style?.outline?.color, style?.outline?.width);
                    for (let k = 0, p = text.length; k < p; k++) {
                        const c = text[k], w = this.getCharWidth(c, fontSize);
                        ctx.strokeText(c, x2, y);
                        x2 += w;
                    }
                    x2 = x1; // 重置x2以便绘制填充文字
                }

                // 再绘制填充文字
                if (this.gradientColor) {
                    ctx.fillStyle = this.gradientColor.createGradient(ctx, { x: 0, y, width: canvas.canvas.width, height: 0 });
                }
                for (let k = 0, p = text.length; k < p; k++) {
                    const c = text[k], w = this.getCharWidth(c, fontSize);
                    ctx.fillText(c, x2, y);
                    x2 += w;
                }

                len += x2 - x1;
                x1 = x2;
            }

            this.drawUnderline(ctx, len, x, hh * (i + 1));
        }

        this.fixHDP(ctx, width, canvas.canvas.height);
    }

    /**
     * 移除文本标签
     * 清理相关资源
     */
    public removeLabel() {
        this.spriteFrame = null;
        this._font = null;
        this._needSetLabel = false;
    }

    /**
     * 重置文本标签
     * 重新加载字体并更新渲染
     */
    public resetLabel() {
        this._needSetLabel = true;
        if (this._fontUuid) {
            no.assetBundleManager.loadAny<TTFFont>({ uuid: this._fontUuid, type: TTFFont }, font => {
                this._font = font;
                this.setLabel();
            });
        } else
            this.setLabel();
    }

    private getFontFromCache(fontUuid: string) {
        return YJCharLabel.fontMap[fontUuid];
    }

    private setFontToCache(fontUuid: string, bf: TTFFont) {
        if (!this.getFontFromCache(fontUuid))
            YJCharLabel.fontMap[fontUuid] = bf;
    }


    /**
     * 加载自定义字体
     * 支持字体缓存以提高性能
     */
    public async loadFont() {
        if (!this._font && this._fontUuid) {
            const bf = this.getFontFromCache(this._fontUuid);
            if (bf) {
                this._font = bf;
            }
            else if (YJCharLabel.fontLoading[this._fontUuid]) {
                await no.sleep(0);
                await this.loadFont();
            }
            else {
                YJCharLabel.fontLoading[this._fontUuid] = true;
                return new Promise<void>(resolve => {
                    no.assetBundleManager.loadByUuid<TTFFont>(this._fontUuid, file => {
                        if (file) {
                            this._font = file;
                            this.setFontToCache(this._fontUuid, file);
                            this.fontFamily = this._font._fontFamily;
                        }
                        resolve();
                    });
                }).catch(e => {
                    console.error(e);
                });
            }
        }
    }

    /**
     * 检查字符是否为CJK字符
     * @param char 要检查的字符
     * @returns 是否为CJK字符
     */
    private isCJK(char: string): boolean {
        const code = char.charCodeAt(0);
        return (
            (code >= 0x4E00 && code <= 0x9FFF) ||   // CJK统一汉字
            (code >= 0x3040 && code <= 0x309F) ||   // 平假名
            (code >= 0x30A0 && code <= 0x30FF) ||   // 片假名
            (code >= 0xAC00 && code <= 0xD7AF) ||   // 韩文谚文
            (code >= 0x3100 && code <= 0x312F) ||   // 音符号
            (code >= 0x31C0 && code <= 0x31EF) ||   // CJK笔画
            (code >= 0xFF00 && code <= 0xFFEF)      // 全角ASCII、全角标点
        );
    }

    /**
     * 文本分词处理
     * 根据语言特性进行智能分词
     * @param text 要分词的文本
     * @returns 分词结果数组
     */
    private splitIntoWords(text: string): string[] {
        if (this.blankBreakWord) {
            // 如果启用空格断词，留空格
            return text.split(/(?= )|(?<= )/);
        }

        let words = [];
        let currentWord = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (this.isCJK(char)) {
                // 保存当前英文单词
                if (currentWord) {
                    words.push(currentWord);
                    currentWord = '';
                }
                // CJK字符单独成词
                words.push(char);
            } else if (char === ' ') {
                // 保存当前英文单词和空格
                if (currentWord) {
                    words.push(currentWord);
                    currentWord = '';
                }
                words.push(char);
            } else {
                // 拼接英文单词
                currentWord += char;
            }
        }

        // 保存最后的英文单词
        if (currentWord) {
            words.push(currentWord);
        }

        return words;
    }
}

