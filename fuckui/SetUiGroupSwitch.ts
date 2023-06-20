
import { no } from '../no';
import { ccclass, property, menu, Node } from '../yj';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetUiGroupSwitch
 * DateTime = Mon Jan 17 2022 14:43:03 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetUiGroupSwitch.ts
 * FileBasenameNoExtension = SetUiGroupSwitch
 * URL = db://assets/Script/NoUi3/fuckui/SetUiGroupSwitch.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
@ccclass('SetUiGroupSwitchInfo')
export class SetUiGroupSwitchInfo {
    @property
    condition: string = '';
    @property({ type: Node })
    uiNode: Node = null;
}
@ccclass('SetUiGroupSwitch')
@menu('NoUi/ui/SetUiGroupSwitch(根据条件切换ui模块:string)')
export class SetUiGroupSwitch extends FuckUi {

    @property(SetUiGroupSwitchInfo)
    infos: SetUiGroupSwitchInfo[] = [];

    protected onDataChange(data: any) {
        this.infos.forEach(info => {
            if (info.uiNode) {
                // info.uiNode.active = info.condition === String(data);
                no.visible(info.uiNode, info.condition === String(data));
            }
        });
    }
}
