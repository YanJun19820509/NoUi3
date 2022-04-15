
import { _decorator, Color, RenderComponent } from 'cc';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetColorsSwitch
 * DateTime = Mon Jan 17 2022 10:38:04 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetColorsSwitch.ts
 * FileBasenameNoExtension = SetColorsSwitch
 * URL = db://assets/Script/NoUi3/fuckui/SetColorsSwitch.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
@ccclass('ColorInfo')
export class ColorInfo {
    @property
    condition: string = '';
    @property({ type: Color })
    color: Color = Color.BLACK;
}

@ccclass('SetColorsSwitch')
@menu('NoUi/ui/SetColorsSwitch(根据条件切换颜色:string)')
export class SetColorsSwitch extends FuckUi {

    @property({ type: ColorInfo, displayName: '状态信息' })
    infos: ColorInfo[] = [];

    protected onDataChange(data: any) {
        data = String(data);
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let info = this.infos[i];
            if (info.condition === data) {
                this.node.getComponent(RenderComponent).color = info.color;
                break;
            }
        }
    }
}
