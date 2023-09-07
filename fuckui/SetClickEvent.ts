
import { ccclass, property, menu, Button } from '../yj';
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
    @property
    public get bind(): boolean {
        return false;
    }

    public set bind(v: boolean) {
        this.getComponent(Button)?.clickEvents.push(no.createClickEvent(this.node, SetClickEvent, 'a_onClick'));
    }

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
