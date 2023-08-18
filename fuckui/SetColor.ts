
import { ccclass, menu, Color, UIRenderer, property, LabelOutline } from '../yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';

/**
 * Predefined variables
 * Name = SetColor
 * DateTime = Mon Jan 17 2022 10:35:58 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetColor.ts
 * FileBasenameNoExtension = SetColor
 * URL = db://assets/Script/NoUi3/fuckui/SetColor.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetColor')
@menu('NoUi/ui/SetColor(设置颜色:string|cc.Color)')
export class SetColor extends FuckUi {
    @property({ displayName: '设置文本描边' })
    isOutline: boolean = false;

    protected onDataChange(data: any) {
        let color: Color;
        if (typeof data == 'string') {
            color = no.str2Color(data);
        } else if (data instanceof Color) {
            color = data;
        }
        if (this.isOutline) {
            if (this.getComponent(YJCharLabel)) {
                this.getComponent(YJCharLabel).outlineColor = color;
            } else if (this.getComponent(LabelOutline))
                this.getComponent(LabelOutline).color = color;
        } else {
            if (this.getComponent(YJCharLabel)) {
                this.getComponent(YJCharLabel).fontColor = color;
            } else if (this.getComponent(UIRenderer))
                this.getComponent(UIRenderer).color = color;
        }
    }
}
