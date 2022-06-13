
import { _decorator, Toggle } from 'cc';
import { FuckUi } from './FuckUi';
const { ccclass, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetToggleCheck
 * DateTime = Mon Jan 17 2022 14:41:35 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetToggleCheck.ts
 * FileBasenameNoExtension = SetToggleCheck
 * URL = db://assets/Script/NoUi3/fuckui/SetToggleCheck.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetToggleCheck')
@menu('NoUi/ui/SetToggleCheck(设置复选框选中状态:bool)')
export class SetToggleCheck extends FuckUi {

    protected onDataChange(data: any) {
        this.getComponent(Toggle).isChecked = Boolean(data);
    }

    public a_setChecked(): void {
        this.setData('true');
    }

    public a_setNotChecked(): void {
        this.setData('false');
    }

}
