
import { _decorator, Label, RichText } from 'cc';
import { DynamicLabelTexture } from '../engine/DynamicLabelTexture';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetShader } from './SetShader';
const { ccclass, property, menu, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = SetText
 * DateTime = Mon Jan 17 2022 14:36:43 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetText.ts
 * FileBasenameNoExtension = SetText
 * URL = db://assets/Script/NoUi3/fuckui/SetText.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetText')
@menu('NoUi/ui/SetText(设置文本内容:string)')
@requireComponent(DynamicLabelTexture)
export class SetText extends FuckUi {

    @property({ displayName: '格式化模板' })
    formatter: string = '{0}';

    @property({ displayName: '数值显示单位' })
    showUnit: boolean = true;

    private label: Label | RichText;

    protected onDataChange(data: any) {
        if (typeof data == 'object') {
            for (let k in data) {
                if (data[k] == null) return;
            }
        }
        if (!this.label) {
            this.label = this.node.getComponent(Label) || this.node.getComponent(RichText);
        }
        this.setLabel(data);
        this.checkShader();
    }

    private setLabel(data: any): void {
        if (this.label == null) return;
        if (data == '') this.label.string = '';
        if (this.showUnit && typeof data == 'number') {
            data = no.num2str(data);
        }
        this.getComponent(DynamicLabelTexture)?.beforeContentChange();
        if (typeof data == 'string') {
            this.label.string = no.formatString(this.formatter, data.split('|'));
        } else if (typeof data == 'number') {
            this.label.string = no.formatString(this.formatter, { '0': data });
        } else {
            this.label.string = no.formatString(this.formatter, data);
        }
    }

    private checkShader() {
        this.scheduleOnce(() => {
            this.getComponent(SetShader)?.work();
        }, 0);
    }
}
