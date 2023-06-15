
import { _decorator, Component, Node, Color } from './yj';
import { no } from '../no';
import { SetText } from './SetText';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = SetRichText
 * DateTime = Wed Sep 14 2022 10:38:30 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetRichText.ts
 * FileBasenameNoExtension = SetRichText
 * URL = db://assets/NoUi3/base/richtext/SetRichText.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetRichText')
export class SetRichText extends SetText {
    @property
    color: Color = Color.BLACK.clone();
    @property
    outlineColor: Color = Color.BLACK.clone();
    @property({ min: 0 })
    outlineWidth: number = 1;
    @property({ displayName: '粗体' })
    bold: boolean = false;
    @property({ displayName: '斜体' })
    italic: boolean = false;
    @property({ displayName: '下划线' })
    underline: boolean = false;

    protected onDataChange(data: any) {
        data = no.addBBCode(data, 'color', this.color.toCSS('#rrggbb'));
        if (this.outlineWidth > 0) {
            data = no.addBBCode(data, 'outline', [
                { key: 'color', value: this.outlineColor.toCSS('#rrggbb') },
                { key: 'width', value: this.outlineWidth }
            ]);
        }
        if (this.bold) data = no.addBBCode(data, 'b');
        if (this.italic) data = no.addBBCode(data, 'i');
        if (this.underline) data = no.addBBCode(data, 'u');
        super.onDataChange(data);
    }
}
