
import { _decorator, Component, Color, color, Label, LabelOutline, LabelShadow, v2 } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../../no';
const { ccclass, property, menu, requireComponent, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJLabelCss
 * DateTime = Fri Jan 14 2022 17:25:03 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJLabelCss.ts
 * FileBasenameNoExtension = YJLabelCss
 * URL = db://assets/Script/NoUi3/base/skin/YJLabelCss.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJLabelCss')
@requireComponent(Label)
@menu('NoUi/skin/YJLabelCss(将css转为label属性)')
@executeInEditMode()
export class YJLabelCss extends Component {
    @property({ multiline: true })
    cssText: string = '';

    private _cssText: string = '';

    onLoad() {
        if (!EDITOR) {
            this.destroy();
        }
    }

    update() {
        if (!EDITOR) return;
        if (this.cssText != this._cssText) {
            this._cssText = this.cssText;
            this.onCssChange();
        }
    }

    private onCssChange() {
        let s = this._cssText?.trim();
        if (s == '' || s == null) return;
        let a = this.parse(s);
        this.setLabelAttr(a);
    }

    private setLabelAttr(attr: any): void {
        let label = this.getComponent(Label);
        label.cacheMode = Label.CacheMode.BITMAP;
        label.fontSize = attr.fontSize;
        label.lineHeight = attr.lineHeight;
        label.isBold = attr.enableBold;
        label.fontFamily = attr.fontFamily;
        label.color = attr.color;

        if (attr.shadow != null) {
            let shadow = this.getComponent(LabelShadow) || this.addComponent(LabelShadow);
            shadow.offset = v2(attr.shadow.x, attr.shadow.y);
            shadow.blur = attr.shadow.blur;
            shadow.color = attr.shadow.color;
        } else {
            this.getComponent(LabelShadow)?.destroy();
        }
        if (attr.stroke != null) {
            let stroke = this.getComponent(LabelOutline) || this.addComponent(LabelOutline);
            stroke.width = attr.stroke.width;
            stroke.color = attr.stroke.color;
        } else {
            this.getComponent(LabelOutline)?.destroy();
        }
    }

    // width: 22px;
    // height: 14px;
    // font-size: 18px;
    // font-family: Source Han Serif CN;
    // font-weight: 800;
    // color: #FFFFFF;
    // line-height: 32px;
    // -webkit-text-stroke: 2px #464A57;
    // text-stroke: 2px #464A57;
    private parse(s: string): any {
        s = s.replace(new RegExp('\n|\r|px|', 'g'), '');
        let a = s.split(';');
        let r: any = {};
        a.forEach(b => {
            let c = b.split(': ');
            switch (c[0].trim()) {
                case 'font-size':
                    r.fontSize = Number(c[1]);
                    break;
                case 'font-family':
                    r.fontFamily = c[1];
                    break;
                case 'font-weight':
                    r.enableBold = c[1] == 'bold';
                    break;
                case 'line-height':
                    r.lineHeight = Number(c[1]);
                    break;
                case 'color':
                    r.color = no.str2Color(c[1]);
                    break;
                case 'text-shadow':
                    r.shadow = this.parseShadow(c[1]);
                    break;
                case 'text-stroke':
                    r.stroke = this.parseStroke(c[1]);
                    break;
            }
        });
        return r;
    }

    private parseShadow(s: string): any {
        s = s.replace(new RegExp(', ', 'g'), ',');
        let b = s.split(' ');
        return {
            x: Number(b[0]),
            y: -Number(b[2]),
            blur: Number(b[1]),
            color: this.parseColor(b[3])
        };
    }

    private parseStroke(s: string): any {
        s = s.replace(new RegExp(', ', 'g'), ',');
        let a = s.split(' ');
        return {
            width: Number(a[0]),
            color: this.parseColor(a[1])
        };
    }

    private parseRGBA(s: string): Color {
        s = s.replace(new RegExp('rgba(|)', 'g'), '');
        let a = s.split(',');
        return color(Number(a[0]), Number(a[1]), Number(a[2]), 255 * Number(a[3]));
    }

    private parseColor(s: string): Color {
        if (s.includes('rgba')) {
            return this.parseRGBA(s);
        } else {
            return no.str2Color(s);
        }
    }
}
