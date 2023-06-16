
import { ccclass, property, menu } from '../yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetClickEvent
 * DateTime = Mon Jan 17 2022 10:35:02 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetClickEvent.ts
 * FileBasenameNoExtension = SetClickEvent
 * URL = db://assets/Script/NoUi3/fuckui/SetClickEvent.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetClickEvent')
@menu('NoUi/ui/SetClickEvent(设置子项点击事件:string|number)')
export class SetClickEvent extends FuckUi {
    @property({ displayName: '事件类型' })
    type: string = '';
    @property(no.EventHandlerInfo)
    onClick: no.EventHandlerInfo[] = [];

    private _v: any;

    protected onDataChange(data: any) {
        this._v = data;
    }

    public a_onClick() {
        if (this.type != '')
            no.evn.emit(this.type, this._v);
        no.EventHandlerInfo.execute(this.onClick, this._v);
    }
}
