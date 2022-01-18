
import { _decorator } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetConditionHandler
 * DateTime = Mon Jan 17 2022 10:39:37 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetConditionHandler.ts
 * FileBasenameNoExtension = SetConditionHandler
 * URL = db://assets/Script/NoUi3/fuckui/SetConditionHandler.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
@ccclass("ConditionHandlerInfo")
export class ConditionHandlerInfo {
    @property
    condition: string = '';

    @property(no.EventHandlerInfo)
    handlers: no.EventHandlerInfo[] = [];

}
@ccclass('SetConditionHandler')
@menu('NoUi/ui/SetConditionHandler(条件触发行为:string)')
export class SetConditionHandler extends FuckUi {
    @property(ConditionHandlerInfo)
    infos: ConditionHandlerInfo[] = [];

    protected onDataChange(data: any) {
        this.infos.forEach(info => {
            if (info.condition == data) {
                no.EventHandlerInfo.execute(info.handlers);
            }
        });
    }
}
