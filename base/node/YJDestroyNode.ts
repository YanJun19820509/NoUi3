
import { _decorator, Component, Node } from 'cc';
const { ccclass, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJDestroyNode
 * DateTime = Fri Jan 14 2022 15:54:57 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJDestroyNode.ts
 * FileBasenameNoExtension = YJDestroyNode
 * URL = db://assets/Script/NoUi3/base/node/YJDestroyNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJDestroyNode')
@menu('NoUi/node/YJDestroyNode(删除节点)')
export class YJDestroyNode extends Component {
    public a_destroy() {
        this.node.destroy();
    }
}
