
import { _decorator, Component, Node, UITransform } from 'cc';
import { FuckUi } from './FuckUi';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = SetAnchorPoint
 * DateTime = Wed Jun 15 2022 15:55:07 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetAnchorPoint.ts
 * FileBasenameNoExtension = SetAnchorPoint
 * URL = db://assets/NoUi3/fuckui/SetAnchorPoint.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//设置锚点
@ccclass('SetAnchorPoint')
export class SetAnchorPoint extends FuckUi {
    protected onDataChange(data: any) {
        if (typeof data == 'number') data = [data];
        else if (typeof data == 'string') data = [Number(data)];
        this.node.getComponent(UITransform)?.setAnchorPoint(data[0], data[1] || data[0]);
    }
}
