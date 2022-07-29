
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = SetCreateNodeOneByOneDelegate
 * DateTime = Wed Jun 22 2022 16:48:12 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateNodeOneByOneDelegate.ts
 * FileBasenameNoExtension = SetCreateNodeOneByOneDelegate
 * URL = db://assets/NoUi3/fuckui/SetCreateNodeOneByOneDelegate.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetCreateNodeOneByOneDelegate')
export class SetCreateNodeOneByOneDelegate extends Component {
    public async afterCreateOneNode(idx: number, data: any, node: Node) { };
    public afterAllCreated() { };
}
