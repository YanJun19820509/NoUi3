
import { _decorator, Toggle } from 'cc';
import { FuckUi } from './FuckUi';
const { ccclass, menu, property } = _decorator;

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
    @property({ displayName: '取反' })
    reverse: boolean = false;

    protected onDataChange(data: any) {
        let a = Boolean(data);
        if (this.reverse) a = !a;
        this.getComponent(Toggle).isChecked = a;
    }

    public a_setChecked(): void {
        this.setData('true');
    }

    public a_setNotChecked(): void {
        this.setData('false');
    }

}
