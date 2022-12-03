
import { _decorator, Component, Node, Label, RichText, HtmlTextParser, IHtmlTextParserResultObj, IHtmlTextParserStack, LabelOutline, Layers, UITransform, math, UIOpacity } from 'cc';
import { EDITOR } from 'cc/env';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = SetTypeWritting
 * DateTime = Wed Jul 13 2022 17:06:29 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetTypeWritting.ts
 * FileBasenameNoExtension = SetTypeWritting
 * URL = db://assets/NoUi3/fuckui/SetTypeWritting.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 打字机组件
 * data: {
 *  content: string,
 *  stop?: boolean
 * }
 */
@ccclass('SetTypeWritting')
@executeInEditMode()
export class SetTypeWritting extends FuckUi {
    @property({ displayName: '每秒打字个数', min: 1, step: 1 })
    speed: number = 3;
    @property({ displayName: '段落间隔时长(s)', min: 0 })
    duration: number = .5;
    @property(no.EventHandlerInfo)
    onStop: no.EventHandlerInfo[] = [];

    private _paragraphs: string[];
    private _content: any[];
    private _idx: number;
    private _label: Label | RichText;
    private _isRichText: boolean = false;
    private _br: string = '\n';

    update() {
        if (!EDITOR) return;
        if (this.getComponent(RichText)?.enabled) this.getComponent(RichText).enabled = false;
    }

    onDisable() {
        this.node.removeAllChildren();
        this._x = null;
        this._maxY = 0;
    }

    protected onDataChange(data: any) {
        if (!this._label) {
            this._label = this.getComponent(Label);
            if (!this._label) {
                this._label = this.getComponent(RichText);
                this._isRichText = true;
                this._br = '<br/>';
            }
        }
        if (!this._label) return;
        if (data.content) {
            this._paragraphs = [].concat(data.content);
        }
        if (data.stop) {
            this.unscheduleAllCallbacks();
            let str = this._paragraphs.join(this._br);
            if (!this._isRichText)
                this._label.string = str;
            else
                this.createRichTextNode(str);
            no.EventHandlerInfo.execute(this.onStop);
        } else if (data.next) {
            this.unscheduleAllCallbacks();
            let str = '';
            for (let i = 0, n = Math.min(this._idx, this._paragraphs.length - 1); i <= n; i++) {
                str += this._paragraphs[i] + this._br;
            }
            if (!this._isRichText) {
                this._label.string = str;
                this.setParagraph();
            } else
                this.createRichTextNode(str);

        } else {
            this.node.removeAllChildren();
            this._x = null;
            this._maxY = 0;
            this._label.string = '';
            this._idx = -1;
            this.setParagraph();
        }
    }

    private setParagraph() {
        this._idx++;
        if (this._paragraphs[this._idx] == null) {
            no.EventHandlerInfo.execute(this.onStop);
            return;
        }
        let s = String(this._paragraphs[this._idx]);
        this._content = this._isRichText ? this.splitHtmlString(s) : s.split('');
        this.writing();
    }

    private writing() {
        this.setStr();
        let t = Math.max(1 / this.speed, 1 / 30);
        this.scheduleOnce(() => {
            if (this._content.length == 0) {
                this.setWrap();
                this.scheduleOnce(() => {
                    this.setParagraph();
                }, this.duration);
            } else this.writing();
        }, t);
    }

    private setStr() {
        let a = this._content.shift();
        if (!this._isRichText)
            this._label.string += a;
        else {
            this.createLableNode(a);
        }
    }

    private setWrap() {
        this._label.string += this._br;
    }

    private splitHtmlString(htmlStr: string): any[] {
        let a = new HtmlTextParser().parse(htmlStr);
        let b: any[] = [];
        a.forEach(aa => {
            b = b.concat(this.singleLetterWithStyle(aa));
        });
        return b;
    }

    private singleLetterWithStyle(o: IHtmlTextParserResultObj): any[] {
        if (!o.style) return o.text.split('');
        if (o.text == '' && o.style.isNewLine) return [o];
        let a = o.text.split(''), b: any[] = [];
        let richText = this.getComponent(RichText),
            fontSize = richText.fontSize,
            fontFamily = richText.fontFamily,
            lineHeight = richText.lineHeight;
        let style: IHtmlTextParserStack = o.style || {};
        if (!style.size) style.size = fontSize;
        a.forEach(aa => {
            b[b.length] = {
                text: aa,
                style: o.style,
                fontFamily: fontFamily,
                lineHeight: lineHeight
            };
        });
        return b;
    }

    private createHtmlStrings(o: IHtmlTextParserResultObj): string[] {
        if (!o.style) return o.text.split('');
        if (o.text == '' && o.style.isNewLine) return ['<br/>'];
        let a = o.text.split(''), b: string[] = [];
        a.forEach(aa => {
            if (o.style.bold) aa = no.addBBCode(aa, 'b');
            if (o.style.italic) aa = no.addBBCode(aa, 'i');
            if (o.style.underline) aa = no.addBBCode(aa, 'u');
            if (o.style.color) aa = no.addBBCode(aa, 'color', o.style.color);
            if (o.style.size) aa = no.addBBCode(aa, 'size', o.style.size);
            if (o.style.outline) aa = no.addBBCode(aa, 'outline', [
                { key: 'color', value: o.style.outline.color },
                { key: 'width', value: o.style.outline.width }
            ]);
            b[b.length] = aa;
        });
        return b;
    }

    private createLableNode(a: { text: string, style: IHtmlTextParserStack, fontFamily: string, lineHeight: number }) {
        if (a.lineHeight > this._maxY) this._maxY = a.lineHeight;
        if (a.style.isNewLine) {
            this.setNewLine();
            return;
        }
        let labelNode = new Node();
        labelNode.active = false;
        labelNode.layer = Layers.Enum.UI_2D;
        let ut = labelNode.addComponent(UITransform);
        ut.setContentSize(a.style.size, a.lineHeight);
        ut.setAnchorPoint(0, 0);
        labelNode.addComponent(UIOpacity).opacity = 0;
        let label = labelNode.addComponent(Label);
        label.string = '';
        label.color = no.str2Color(a.style.color);
        label.fontFamily = a.fontFamily;
        label.fontSize = a.style.size;
        label.lineHeight = a.lineHeight;
        label.isItalic = a.style.italic;
        label.isBold = a.style.bold;
        label.isUnderline = a.style.underline;
        label.cacheMode = Label.CacheMode.BITMAP;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        if (a.style.outline) {
            let outline = labelNode.addComponent(LabelOutline);
            outline.color = no.str2Color(a.style.outline.color);
            outline.width = a.style.outline.width;
        }
        let dynamicTexture = this.getComponent(YJDynamicTexture);
        if (dynamicTexture && dynamicTexture.enabled) {
            labelNode.addComponent(YJDynamicTexture).dynamicAtlas = dynamicTexture.dynamicAtlas;
            label.customMaterial = dynamicTexture.dynamicAtlas.commonMaterial;
        }
        label.string = a.text;
        labelNode.parent = this.node;
        labelNode.active = true;
        this.scheduleOnce(() => {
            this.setPos(labelNode);
            labelNode.getComponent(UIOpacity).opacity = 255;
        });
    }

    private createRichTextNode(v: string) {
        let rt = this.getComponent(RichText);
        let labelNode = new Node();
        labelNode.active = false;
        labelNode.layer = Layers.Enum.UI_2D;
        let ut = labelNode.addComponent(UITransform);
        ut.setContentSize(rt.fontSize, rt.lineHeight);
        ut.setAnchorPoint(0, 1);
        labelNode.addComponent(UIOpacity).opacity = 0;
        let label = labelNode.addComponent(RichText);
        label.string = '';
        label.fontFamily = rt.fontFamily;
        label.fontSize = rt.fontSize;
        label.lineHeight = rt.lineHeight;
        label.maxWidth = rt.maxWidth;
        label.cacheMode = Label.CacheMode.BITMAP;
        let dynamicTexture = this.getComponent(YJDynamicTexture);
        if (dynamicTexture && dynamicTexture.enabled) {
            labelNode.addComponent(YJDynamicTexture).dynamicAtlas = dynamicTexture.dynamicAtlas;
        }
        label.string = v;
        labelNode.parent = this.node;
        labelNode.active = true;
        this.scheduleOnce(() => {
            this._x = null;
            this._maxY = 0;
            this.setPos(labelNode);
            labelNode.getComponent(UIOpacity).opacity = 255;
            this.setNewLine();
            this.setParagraph();
            let cs = this.node.children;
            for (let i = cs.length - 1; i >= 0; i--) {
                let c = cs[i];
                if (c.uuid != labelNode.uuid)
                    c.removeFromParent();
            }
        });
    }

    private _x: number;
    private _y: number;
    private _maxY: number;
    private _anc: math.Vec2;
    private _width: number;
    private setPos(node: Node) {
        if (this._x == null) {
            this._anc = this.node.getComponent(UITransform).anchorPoint;
            this._width = this.node.getComponent(UITransform).width;
            this._x = (0 - this._anc.x) * this._width;
            this._y = 0;
        }
        let ut = node.getComponent(UITransform);
        const size = ut.contentSize;
        this.checkNewLine(size.width);
        node.setPosition(this._x, this._y - size.height * (1 - ut.anchorY) / 1.22);
        this._x += size.width;
    }

    private checkNewLine(width: number) {
        if (this._x + width > (1 - this._anc.x) * this._width) {
            this._y -= this._maxY;
            this._x = (0 - this._anc.x) * this._width;
        }
    }

    /**
     * 换行
     */
    private setNewLine() {
        this._y -= this._maxY;
        this._x = (0 - this._anc.x) * this._width;
    }
}
