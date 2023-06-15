
import { _decorator, Color, UIRenderer } from './yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, menu } = _decorator;

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
    protected onDataChange(data: any) {
        let color: Color;
        if (typeof data == 'string') {
            color = no.str2Color(data);
        } else if (data instanceof Color) {
            color = data;
        }
        let renders = this.node.getComponentsInChildren(UIRenderer);
        renders.forEach(render => {
            render.color = color;
        });
    }
}
