
import { _decorator, Component, Node, Sprite } from 'cc';
import { FuckUi } from './FuckUi';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = SetSpriteFillRange
 * DateTime = Mon Jun 27 2022 11:46:16 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpriteFillRange.ts
 * FileBasenameNoExtension = SetSpriteFillRange
 * URL = db://assets/NoUi3/fuckui/SetSpriteFillRange.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetSpriteFillRange')
@requireComponent(Sprite)
export class SetSpriteFillRange extends FuckUi {
    protected onDataChange(data: any) {
        this.getComponent(Sprite).fillRange = -Number(data);
    }
}
