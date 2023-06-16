
import { ccclass, property, menu, Button } from '../yj';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetInteractable
 * DateTime = Mon Jan 17 2022 10:54:19 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetInteractable.ts
 * FileBasenameNoExtension = SetInteractable
 * URL = db://assets/Script/NoUi3/fuckui/SetInteractable.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetInteractable')
@menu('NoUi/ui/SetInteractable(设置交互状态:boolean)')
export class SetInteractable extends FuckUi {

    @property({ displayName: '取反' })
    reverse: boolean = false;

    protected onDataChange(data: any) {
        if (!this.getComponent(Button)) return;
        data = Boolean(data);
        if (this.reverse) data = !data;
        data ? this.a_enable() : this.a_disable();
    }

    public a_enable(): void {
        this.getComponent(Button).interactable = true;
    }

    public a_disable(): void {
        this.getComponent(Button).interactable = false;
    }
}
