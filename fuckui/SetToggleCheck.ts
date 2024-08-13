
import { EDITOR, ccclass, menu, property, executeInEditMode, requireComponent, Toggle } from '../yj';
import { YJDataWork } from '../base/YJDataWork';
import { no } from '../no';
import { FuckUi } from './FuckUi';

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
@executeInEditMode()
@requireComponent(Toggle)
export class SetToggleCheck extends FuckUi {
    @property({ displayName: '取反' })
    reverse: boolean = false;
    @property({ tooltip: '设置 isChecked 而不调用 checkEvents 回调' })
    setCheckedWithoutNotify: boolean = false;
    @property({ type: YJDataWork })
    dataWork: YJDataWork = null;
    @property
    public get bindCheckEvents(): boolean {
        return false;
    }
    
    public set bindCheckEvents(v: boolean) {
        this.getComponent(Toggle).checkEvents = [no.createEventHandler(this.node, SetToggleCheck, 'onCheckChange')];
    }

    onLoad() {
        super.onLoad();
        if (EDITOR) {
            this.dataWork = no.getComponentInParents(this.node, YJDataWork);
            return;
        }
    }

    protected onDataChange(data: any) {
        let a = Boolean(data);
        if (this.reverse) a = !a;
        let toggle = this.getComponent(Toggle);
        if (a)
            toggle.clickEvents.forEach(ce => {
                ce.emit([toggle]);
            });
        if (this.setCheckedWithoutNotify)
            toggle.setIsCheckedWithoutNotify(a);
        else
            toggle.isChecked = a;
    }

    public a_setChecked(): void {
        this.setData('true');
    }

    public a_setNotChecked(): void {
        this.setData('false');
    }

    private onCheckChange(toggle: Toggle) {
        if (String(toggle.isChecked) == this.oldData) return;
        this.dataWork?.setValue(this.bind_keys, toggle.isChecked);
    }
}
