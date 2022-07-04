

import { _decorator, Component, Node } from 'cc';
import { YJNodeTarget } from '../base/node/YJNodeTarget';
import { FuckUi } from './FuckUi';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = setNodeTarget
 * DateTime = Tue Jun 14 2022 10:34:56 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = setNodeTarget.ts
 * FileBasenameNoExtension = setNodeTarget
 * URL = db://assets/NoUi3/fuckui/setNodeTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetNodeTarget')
@requireComponent(YJNodeTarget)
export class SetNodeTarget extends FuckUi {
    protected onDataChange(data: any) {
        this.getComponent(YJNodeTarget).setType(String(data));
    }
}
