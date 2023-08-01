
import { EDITOR, ccclass, property, Font, Color, Label, Vec2, v2, Sprite, Enum, SpriteFrame, Texture2D, CCString, ImageAsset, SpriteAtlas, math, size, rect } from '../../yj';
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
 *
 */

enum YJCharLabelMode {
    Char = 0,
    String
}
enum YJCharLabelHorizentalAlign {
    Left = 0,
    Center,
    Right
}

@ccclass('YJCharLabel')
export class YJCharLabel extends Sprite {
    @property({ visible() { return false; } })
    set spriteAtlas(v: SpriteAtlas) {
        super.spriteAtlas = v;
    }
    get spriteAtlas(): SpriteAtlas {
        return super.spriteAtlas;
    }
    @property({ visible() { return false; } })
    set spriteFrame(v: SpriteFrame) {
        super.spriteFrame = v;
    }
    get spriteFrame(): SpriteFrame {
        return super.spriteFrame;
    }

    @property({ visible() { return false; } })
    set sizeMode(v: number) {
        super.sizeMode = v;
    }
    get sizeMode(): number {
        return super.sizeMode;
    }

    @property({ visible() { return false; } })
    set type(v: number) {
        super.type = v;
    }
    get type(): number {
        return super.type;
    }

    @property({ visible() { return false; } })
    set grayscale(v: boolean) {

    }
    get grayscale(): boolean {
        return false;
    }

    @property({ visible() { return false; } })
    set trim(v: boolean) {

    }
    get trim(): boolean {
        return true;
    }



    @property({ type: Enum(YJCharLabelMode) })
    mode: YJCharLabelMode = YJCharLabelMode.Char;
    //文本内容
    @property({ type: CCString })
    set string(v: string) {
        if (v == this._string) return;
        this._string = v;
        this.setLabel();
    }
    get string() {
        return this._string;
    }
    //文本颜色
    @property(Color)
    public get color(): Color {
        return this._color;
    }
    public set color(v: Color) {
        if (v.equals(this._color)) return;
        this._color = v;
        this.setLabel();
    }
    //文本尺寸
    @property
    public get fontSize(): number {
        return this._fontSize;
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
        return this._lineHeight;
    }

    public set lineHeight(v: number) {
        if (v == this._lineHeight) return;
        this._lineHeight = v;
        this.setLabel();
    }
    //水平对齐
    @property({ type: Enum(YJCharLabelHorizentalAlign) })
    public get horizentalAlign(): number {
        return this._horizentalAlign;
    }

    public set horizentalAlign(v: number) {
        if (v == this._horizentalAlign) return;
        this._horizentalAlign = v;
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
            this.sizeMode = Sprite.SizeMode.CUSTOM;
        }
        this.setLabel();
    }
    //最大宽
    @property({ visible() { return this.overflow != Label.Overflow.NONE; } })
    public get maxWidth(): number {
        return this._maxWidth;
    }

    public set maxWidth(v: number) {
        if (v == this._maxWidth) return;
        this._maxWidth = v;
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
        return this._outlineWidth;
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
        return this._shadowOffset;
    }

    public set shadowOffset(v: Vec2) {
        if (v.equals(this._shadowOffset)) return;
        this._shadowOffset = v;
        this.setLabel();
    }
    //阴影模糊宽
    @property
    public get shadowBlur(): number {
        return this._shadowBlur;
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

    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;

    @property({ serializable: true })
    protected _string: string = '';
    @property({ serializable: true })
    protected _fontSize: number = 22;
    @property({ serializable: true })
    protected _font: Font = null;
    @property({ serializable: true })
    protected _foitnFamily: string = 'Arial';
    @property({ serializable: true })
    protected _lineHeight: number = 22;
    @property({ serializable: true })
    protected _horizentalAlign: number = 0;
    @property({ serializable: true })
    protected _overflow: number = 0;
    @property({ serializable: true })
    protected _maxWidth: number = 50;
    @property({ serializable: true })
    protected _italic: boolean = false;
    @property({ serializable: true })
    protected _bold: boolean = false;
    @property({ serializable: true })
    protected _underline: boolean = false;
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

    onLoad() {
        this.spriteFrame = new SpriteFrame();
        if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
        this.setLabel();
    }

    onDestroy() {
        this.unscheduleAllCallbacks();
        this.node.targetOff(this);
    }

    // update() {
    //     if (!EDITOR) return;
    //     this.initMode();
    // }

    // private initMode() {
    //     if (this.mode == YJCharLabelMode.String) {
    //         // if (!this.getComponent(Layout)) {
    //         //     let layout = this.addComponent(Layout);
    //         //     layout.type = Layout.Type.HORIZONTAL;
    //         //     layout.resizeMode = Layout.ResizeMode.CONTAINER;
    //         // }
    //         // if (!this.getComponent(Sprite)) {
    //         //     this.addComponent(Sprite);
    //         //     this._text = null;
    //         // }
    //     } else if (this.mode == YJCharLabelMode.Char) {
    //         if (!this.getComponent(Layout)) {
    //             let layout = this.addComponent(Layout);
    //             layout.type = Layout.Type.HORIZONTAL;
    //             layout.resizeMode = Layout.ResizeMode.CONTAINER;
    //             this.getComponent(Sprite)?.destroy();
    //             let sp = this.italic ? -this.fontSize / 5 : 0;
    //             let s = this.getComponent(Layout).spacingX;
    //             if (s != sp) {
    //                 this.getComponent(Layout).spacingX = sp;
    //             }
    //             this._text = null;
    //         }
    //     }
    // }

    private setLabel(): void {
        switch (this.mode) {
            case YJCharLabelMode.Char:
                // this.setChars(s);
                break;
            case YJCharLabelMode.String:
                this.drawString(this._string);
                break;
        }
        this.updateTexture();
    }

    // private setChars(s: string) {
    //     let a = s.split('');
    //     let labelNodes = this.node.children;
    //     if (EDITOR) {
    //         labelNodes.forEach(child => {
    //             child.destroy();
    //         });
    //         for (let i = 0, n = a.length; i < n; i++) {
    //             this.createCharNode(a[i]).parent = this.node;
    //         }
    //     } else {
    //         // this.unscheduleAllCallbacks();
    //         // let i = 0, n = a.length;
    //         // this.schedule(() => {
    //         //     let labelNode = labelNodes[i];
    //         //     if (!labelNode) {
    //         //         labelNode = this.createSpriteNode(a[i]);
    //         //     } else labelNode.active = true;
    //         //     this.setSpriteFrame(labelNode, a[i]);
    //         //     i++;
    //         //     if (i == n) {
    //         //         for (n = labelNodes.length; i < n; i++) {
    //         //             labelNodes[i].active = false;
    //         //         }

    //         //         this.scheduleOnce(() => {
    //         //             this.setScale();
    //         //         }, .1);
    //         //     }
    //         // }, 1 / 60, n - 1);
    //         for (let i = 0; i < a.length; i++) {
    //             let labelNode = labelNodes[i];
    //             if (!labelNode) {
    //                 labelNode = this.createSpriteNode(a[i]);
    //             } else labelNode.active = true;
    //             this.setSpriteFrame(labelNode, a[i]);
    //         }
    //         for (let i = a.length, n = labelNodes.length; i < n; i++) {
    //             labelNodes[i].active = false;
    //         }

    //         // this.scheduleOnce(() => {
    //         //     this.setScale();
    //         // }, 0.05);
    //     }
    // }

    // private async setString(s: string) {
    //     this.node.removeAllChildren();
    //     if (!this.node.getComponent(Sprite)) this.node.addComponent(Sprite);
    //     if (s == '') {
    //         this.node.getComponent(Sprite).spriteFrame = null;
    //         this.getComponent(UITransform).width = 0;
    //         return;
    //     }
    //     await this.setSpriteFrame(this.node, s);
    // }

    // private async getSpriteFrame(v: string): Promise<SpriteFrame> {
    //     let uuid = this.getUuid(v);
    //     let sf = this.dynamicAtlas?.getSpriteFrameInstance(uuid);
    //     if (sf) return sf;
    //     sf = await YJCharLabelCenter.ins.getSpriteFrame(uuid);
    //     if (!this?.node?.isValid) return;
    //     if (!sf)
    //         sf = await YJCharLabelCenter.ins.createSpriteFrame(this.createCharNode(v), uuid);
    //     if (!this?.node?.isValid) return;
    //     sf._uuid = uuid;
    //     return this.dynamicAtlas?.packSpriteFrame(sf) || sf;
    // }

    // private async setSpriteFrame(node: Node, v: string) {
    //     // let spriteFrame = await this.getSpriteFrame(v);
    //     // if (!this?.node?.isValid) return;
    //     // if (node.isValid)
    //     //     (node.getComponent(Sprite) || node.addComponent(Sprite)).spriteFrame = spriteFrame;
    //     // let spriteFrame = new SpriteFrame();
    //     // spriteFrame.texture = this.drawString(v);
    //     // (node.getComponent(Sprite) || node.addComponent(Sprite)).spriteFrame = spriteFrame;

    // }

    // private _tempCharNode: Node;
    // private createCharNode(v: string): Node {
    //     let labelNode: Node;
    //     if (!EDITOR && this._tempCharNode) {
    //         labelNode = instantiate(this._tempCharNode);
    //     } else {
    //         labelNode = new Node();
    //         labelNode.layer = Layers.Enum.UI_2D;
    //         labelNode.addComponent(UITransform).setContentSize(10, 10);
    //         let label = labelNode.addComponent(Label);
    //         label.string = '';
    //         label.color = this.color;
    //         label.fontFamily = this.fontFamily;
    //         label.font = this.font;
    //         label.fontSize = this.fontSize;
    //         label.lineHeight = this.lineHeight;
    //         label.isItalic = this.italic;
    //         label.isBold = this.bold;
    //         label.cacheMode = Label.CacheMode.NONE;
    //         if (this.outlineWidth > 0) {
    //             let outline = labelNode.addComponent(LabelOutline);
    //             outline.color = this.outlineColor;
    //             outline.width = this.outlineWidth;
    //         }
    //         if (this.shadowBlur != 0) {
    //             let shadow = labelNode.addComponent(LabelShadow);
    //             shadow.color = this.shadowColor;
    //             shadow.offset = this.shadowOffset;
    //             shadow.blur = this.shadowBlur;
    //         }
    //         this._tempCharNode = instantiate(labelNode);
    //     }
    //     labelNode.getComponent(Label).string = v;
    //     return labelNode;
    // }

    // private createSpriteNode(v: string): Node {
    //     let labelNode = new Node();
    //     labelNode.layer = Layers.Enum.UI_2D;
    //     labelNode.addComponent(UITransform).setContentSize(10, 10);
    //     let s = labelNode.addComponent(Sprite);
    //     s.sizeMode = Sprite.SizeMode.TRIMMED;
    //     if (this.dynamicAtlas?.commonMaterial)
    //         s.customMaterial = this.dynamicAtlas?.commonMaterial;
    //     labelNode.active = true;
    //     labelNode.parent = this.node;
    //     labelNode.addComponent(UIOpacity);
    //     return labelNode;
    // }

    // private setScale() {
    //     // no.log('setScale===============>')
    //     if (this.maxWidth == 0) return;
    //     if (!isValid(this)) return;
    //     this.getComponent(Layout).updateLayout();
    //     let ut = this.getComponent(UITransform);
    //     if (ut.width <= this.maxWidth)
    //         this.node.setScale(1, 1);
    //     else {
    //         let s = this.maxWidth / ut.width;
    //         this.node.setScale(s, s);
    //     }
    // }

    // private onNodeSizeChange() {
    //     if (this._ing) return;
    //     this._ing = true;
    //     this.scheduleOnce(() => {
    //         this._ing = false;
    //         // this.setScale();
    //     }, 0);
    // }

    private getUuid(): string {
        let a = this.string + "_" + this.color + "_" + this.fontSize + "_" + (this.font?.name || this.fontFamily) + "_" + this.outlineColor + '_' + this.outlineWidth + '_' + (this.bold ? '1' : '0') + '_' + (this.italic ? '1' : '0');
        return a;
    }

    private _canvas: HTMLCanvasElement;
    private shareCanvas() {
        if (!this._canvas) {
            this._canvas = document.createElement('canvas');
        }
        return this._canvas;
    }

    private setFontStyle(ctx: CanvasRenderingContext2D) {
        ctx.textBaseline = 'alphabetic';
        ctx.imageSmoothingQuality = 'high';
        ctx.font = `${this.italic ? 'italic' : 'normal'} ${this.bold ? 'bold' : ''} ${this.fontSize}px ${this.font?.['_fontFamily'] || this.fontFamily}`;
        ctx.fillStyle = '#' + this.color.toHEX('#rrggbb');
    }

    private setStrokeStyle(ctx: CanvasRenderingContext2D) {
        ctx.font = `${this.italic ? 'italic' : 'normal'} ${this.bold ? 'bold' : ''} ${this.fontSize}px ${this.font?.['_fontFamily'] || this.fontFamily}`;
        ctx.lineWidth = this.outlineWidth * 2;
        ctx.strokeStyle = '#' + this.outlineColor.toHEX('#rrggbb');
    }

    private setShadowStyle(ctx: CanvasRenderingContext2D) {
        ctx.shadowBlur = this.shadowBlur;
        ctx.shadowColor = '#' + this.shadowColor.toHEX('#rrggbb');
        ctx.shadowOffsetX = this.shadowOffset.x;
        ctx.shadowOffsetY = this.shadowOffset.y;
    }

    private drawString(v: string) {
        let ctx = this.shareCanvas().getContext("2d");
        this.setFontStyle(ctx);
        if (this.outlineWidth > 0) this.setStrokeStyle(ctx);
        if (this.shadowBlur > 0) this.setShadowStyle(ctx);
        const maxWidth = this.maxWidth;
        if (this.overflow == Label.Overflow.RESIZE_HEIGHT) {
            const extWidth = this.extWidth();
            let words: string | string[], blankWork = '', blankWidth = 0;
            if (this.blankBreakWord) {
                blankWork = ' ';
                words = v.split(blankWork);
                const mt = ctx.measureText(blankWork);
                blankWidth = Math.max(mt.actualBoundingBoxRight - mt.actualBoundingBoxLeft, mt.width);
            } else words = v;
            let lines: string[] = [],
                oneLine = '',
                width = extWidth,
                height = this.extHeight(),
                lineHeight = this.lineHeight;
            for (let i = 0, n = words.length; i < n; i++) {
                const c = words[i];
                if (c == '\n') {
                    lines[lines.length] = oneLine;
                    oneLine = '';
                    width = extWidth;
                    continue;
                }
                const mt = ctx.measureText(c),
                    w = Math.max(mt.actualBoundingBoxRight - mt.actualBoundingBoxLeft, mt.width);
                lineHeight = Math.max(mt.fontBoundingBoxAscent + mt.fontBoundingBoxDescent, lineHeight);
                if (width + w <= maxWidth) {
                    oneLine += c + blankWork;
                    width += w + blankWidth;
                } else {
                    lines[lines.length] = oneLine;
                    oneLine = c + blankWork;
                    width = extWidth + w + blankWidth;
                }
            }
            if (oneLine != '') lines[lines.length] = oneLine;
            height += lineHeight * lines.length;
            this.drawLines(lines, maxWidth, height);
        } else {
            let mt = ctx.measureText(v),
                w = Math.max(mt.actualBoundingBoxRight - mt.actualBoundingBoxLeft, mt.width),
                ww: number = 0,
                lineHeight = Math.max(mt.fontBoundingBoxAscent + mt.fontBoundingBoxDescent, this.lineHeight);
            if (this.overflow == Label.Overflow.SHRINK) {
                ww = w;
            } else if (this.overflow == Label.Overflow.CLAMP) {
                ww = Math.min(w, maxWidth);
            } else {
                ww = w;
            }
            this.drawText(v, ww, lineHeight);
        }
    }

    private drawText(v: string, width: number, height: number) {
        const canvas = this.shareCanvas(),
            ctx = canvas.getContext("2d"),
            x = this.outlineWidth - (this.shadowOffset.x < 0 ? this.shadowOffset.x - this.shadowBlur : -2),
            y = this.fontSize - (this.shadowOffset.y < 0 ? this.shadowOffset.y : 0);
        width += this.extWidth();
        height += this.extHeight();
        canvas.width = width;
        canvas.height = height;
        if (this.shadowBlur > 0) this.setShadowStyle(ctx);
        if (this.outlineWidth > 0) {
            this.setStrokeStyle(ctx);
            ctx.strokeText(v, x, y);
        }
        this.setFontStyle(ctx);
        ctx.fillText(v, x, y);

        if (this.underline)
            ctx.fillText('_'.repeat(v.length), x, y + 6, width);

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
        no.size(this.node, math.size(width, height));
    }

    private drawLines(lines: string[], width: number, height: number) {
        const canvas = this.shareCanvas(),
            ctx = canvas.getContext("2d"),
            extWidth = this.extWidth();
        canvas.width = width;
        canvas.height = height;
        this.setFontStyle(ctx);
        if (this.outlineWidth > 0) this.setStrokeStyle(ctx);
        if (this.shadowBlur > 0) this.setShadowStyle(ctx);
        lines.forEach((v, i) => {
            let x = 0, y = this.fontSize + this.lineHeight * i - (this.shadowOffset.y < 0 ? this.shadowOffset.y : 0);
            if (this.horizentalAlign == YJCharLabelHorizentalAlign.Left) {
                x = this.outlineWidth - (this.shadowOffset.x < 0 ? this.shadowOffset.x - this.shadowBlur : -2);
            } else {
                const mt = ctx.measureText(v),
                    w = Math.max(mt.actualBoundingBoxRight - mt.actualBoundingBoxLeft, mt.width) + extWidth;
                if (this.horizentalAlign == YJCharLabelHorizentalAlign.Center) {
                    x = (width - w) / 2;
                } else {
                    x = width - w;
                }
            }
            if (this.outlineWidth > 0) {
                ctx.strokeText(v, x, y);
            }
            ctx.fillText(v, x, y);

            if (this.underline)
                ctx.fillText('_'.repeat(v.length), x, y + 6, width);
        });

        no.size(this.node, math.size(width, height));
    }

    private extWidth(): number {
        return this.outlineWidth * 2 + 2 + this.shadowBlur + Math.abs(this.shadowOffset.x);
    }

    private extHeight(): number {
        return this.outlineWidth * 2 + this.shadowBlur + Math.abs(this.shadowOffset.y) + (this.underline ? 4 : 0);
    }

    private updateTexture() {
        const p = this.dynamicAtlas?.packCanvasToDynamicAtlas(this.shareCanvas(), this.getUuid());
        if (EDITOR || !p) {
            const image = new ImageAsset(this.shareCanvas());
            const texture = new Texture2D();
            texture.image = image;
            this.spriteFrame.texture = texture;
        } else {
            this.spriteFrame.originalSize = size(100, 100);
            this.spriteFrame.texture = p.texture;
            this.spriteFrame.rotated = p.rotate;
            this.spriteFrame.rect = rect(p.x, p.y, p.w, p.h);
        }
    }

    private drawRichString(v: string) {

    }
}
