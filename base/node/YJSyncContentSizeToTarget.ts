
import { _decorator, Component, Node, UITransform, math } from 'cc';
import { no } from '../../no';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJSyncContentSizeToTarget
 * DateTime = Tue Jul 19 2022 11:26:54 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSyncContentSizeToTarget.ts
 * FileBasenameNoExtension = YJSyncContentSizeToTarget
 * URL = db://assets/NoUi3/base/node/YJSyncContentSizeToTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//同步目标节点的contentSize，受scale影响
@ccclass('YJSyncContentSizeToTarget')
export class YJSyncContentSizeToTarget extends Component {
    @property(Node)
    target: Node = null;
    @property
    offset: math.Size = math.size();
    @property(no.EventHandlerInfo)
    onChange: no.EventHandlerInfo[] = [];

    update() {
        if (!this.target) return;
        let tSize = this.target.getComponent(UITransform).contentSize.clone();
        let scale = this.target.scale.clone();
        tSize.width *= scale.x;
        tSize.height *= scale.y;
        tSize.width += this.offset.width;
        tSize.height += this.offset.height;
        let size = this.node.getComponent(UITransform).contentSize;
        if (size.width != tSize.width || size.height != tSize.height) {
            this.node.getComponent(UITransform).setContentSize(tSize);
            no.EventHandlerInfo.execute(this.onChange);
        }
    }
}
