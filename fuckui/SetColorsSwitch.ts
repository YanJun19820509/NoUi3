
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';
import { ccclass, property, menu, Color, UIRenderer, Component, LabelOutline } from '../yj';
import { FuckUi } from './FuckUi';

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
    @property
    isLabel: boolean = false;
    @property({ visible() { return this.isLabel; } })
    outlineColor: Color = Color.WHITE.clone();

    public setColor(comp: UIRenderer) {
        if (comp instanceof YJCharLabel) {
            comp.fontColor = this.color;
            if (this.isLabel) comp.outlineColor = this.outlineColor;
        } else {
            comp.color = this.color;
            if (this.isLabel && comp.getComponent(LabelOutline))
                comp.getComponent(LabelOutline).color = this.outlineColor;
        }
    }
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
                this.setColor(info, this.node.getComponent(UIRenderer))

                if (this.recursive) {
                    let children = this.node.children
                    for (let index = 0; index < children.length; index++) {
                        const element = children[index];
                        this.setColor(info, element.getComponent(UIRenderer))
                    }
                }
                break;
            }
        }
    }

    private setColor(info: ColorInfo, comp: UIRenderer) {
        info.setColor(comp);
    }
}
