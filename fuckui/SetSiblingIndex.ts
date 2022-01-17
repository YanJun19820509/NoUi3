
import { _decorator, Component, Node } from 'cc';
import { FuckUi } from './FuckUi';
const { ccclass, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetSiblingIndex
 * DateTime = Mon Jan 17 2022 14:19:53 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSiblingIndex.ts
 * FileBasenameNoExtension = SetSiblingIndex
 * URL = db://assets/Script/NoUi3/fuckui/SetSiblingIndex.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetSiblingIndex')
@menu('NoUi/ui/SetSiblingIndex(设置同级节点索引:number)')
export class SetSiblingIndex extends FuckUi {
    protected onDataChange(data: any) {
        this.node.setSiblingIndex(Number(data));
    }
}
