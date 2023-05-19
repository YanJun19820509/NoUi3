
import { _decorator, Color, UIRenderer } from 'cc';
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
    @property
    color: Color = Color.WHITE.clone();
}

@ccclass('SetColorsSwitch')
@menu('NoUi/ui/SetColorsSwitch(根据条件切换颜色:string)')
export class SetColorsSwitch extends FuckUi {

    @property({ type: ColorInfo, displayName: '状态信息' })
    infos: ColorInfo[] = [];

    @property({ displayName: '影响子节点' })
    recursive: boolean = false;

    protected onDataChange(data: any) {
        data = String(data);
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let info = this.infos[i];
            if (info.condition === data) {
                if (this.node.getComponent(UIRenderer)) {
                    this.node.getComponent(UIRenderer).color = info.color;
                }

                if (this.recursive) {
                    let children = this.node.children
                    for (let index = 0; index < children.length; index++) {
                        const element = children[index];
                        if (element.getComponent(UIRenderer)) {
                            element.getComponent(UIRenderer).color = info.color;
                        }
                    }
                }
                break;
            }
        }
    }
}
