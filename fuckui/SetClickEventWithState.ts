
import { ccclass, property, menu } from '../yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetClickEventWithState
 * DateTime = Mon Jan 17 2022 10:35:02 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetClickEventWithState.ts
 * FileBasenameNoExtension = SetClickEventWithState
 * URL = db://assets/Script/NoUi3/fuckui/SetClickEventWithState.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetClickEventWithStateInfo')
export class SetClickEventWithStateInfo {
    @property
    stateVal: string = '';
    @property(no.EventHandlerInfo)
    onClick: no.EventHandlerInfo[] = [];
}

@ccclass('SetClickEventWithState')
@menu('NoUi/ui/SetClickEventWithState(点击时根据状态调用不同的事件:string|number)')
export class SetClickEventWithState extends FuckUi {
    @property({ type: SetClickEventWithStateInfo })
    states: SetClickEventWithStateInfo[] = [];

    private _cur: SetClickEventWithStateInfo;

    protected onDataChange(data: any) {
        for (let i = 0, n = this.states.length; i < n; i++) {
            const info = this.states[i];
            if (info.stateVal == data) {
                this._cur = info;
                break;
            }
        }
    }

    public a_onClick() {
        no.EventHandlerInfo.execute(this._cur?.onClick);
    }
}
