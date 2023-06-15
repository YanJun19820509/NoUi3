
import { _decorator } from './yj';
import { FuckUi } from './FuckUi';
const { ccclass, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetNodeName
 * DateTime = Mon Jan 17 2022 11:56:57 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetNodeName.ts
 * FileBasenameNoExtension = SetNodeName
 * URL = db://assets/Script/NoUi3/fuckui/SetNodeName.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetNodeName')
@menu('NoUi/ui/SetNodeName(设置节点名称:string)')
export class SetNodeName extends FuckUi {

    protected onDataChange(data: any) {
        this.node.name = String(data);
    }
}
