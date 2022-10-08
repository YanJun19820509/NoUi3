
import { _decorator, Component, Node, Label, RichText, HtmlTextParser, IHtmlTextParserResultObj } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property } = _decorator;

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
export class SetTypeWritting extends FuckUi {
    @property({ displayName: '每秒打字个数', min: 1, step: 1 })
    speed: number = 3;
    @property({ displayName: '段落间隔时长(s)', min: 0 })
    duration: number = .5;
    @property(no.EventHandlerInfo)
    onStop: no.EventHandlerInfo[] = [];

    private _paragraphs: string[];
    private _content: string[];
    private _idx: number;
    private _label: Label | RichText;
    private _isRichText: boolean = false;
    private _br: string = '\n';

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
            this._label.string = this._paragraphs.join(this._br);
            no.EventHandlerInfo.execute(this.onStop);
        } else if (data.next) {
            this.unscheduleAllCallbacks();
            this._label.string = '';
            for (let i = 0, n = Math.min(this._idx, this._paragraphs.length - 1); i <= n; i++) {
                this._label.string += this._paragraphs[i] + this._br;
            }
            this.setParagraph();
        } else {
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
        this.scheduleOnce(() => {
            if (this._content.length == 0) {
                this.setWrap();
                this.scheduleOnce(() => {
                    this.setParagraph();
                }, this.duration);
            } else this.writing();
        }, 1 / this.speed);
    }

    private setStr() {
        this._label.string += this._content.shift();
    }

    private setWrap() {
        this._label.string += this._br;
    }

    private splitHtmlString(htmlStr: string): string[] {
        let a = new HtmlTextParser().parse(htmlStr);
        let b: string[] = [];
        a.forEach(aa => {
            b = b.concat(this.createHtmlStrings(aa));
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
}
