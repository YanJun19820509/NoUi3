
import { _decorator, Component, Node, UITransform } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJScaleNodeInTarget
 * DateTime = Thu Mar 02 2023 18:29:12 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJScaleNodeInTarget.ts
 * FileBasenameNoExtension = YJScaleNodeInTarget
 * URL = db://assets/NoUi3/base/node/YJScaleNodeInTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJScaleNodeInTarget')
@executeInEditMode()
export class YJScaleNodeInTarget extends Component {
    @property(Node)
    target: Node = null;

    update() {
        if (!EDITOR) return;
        if (!this.target) this.target = this.node.parent;
    }

    onLoad() {
        if (EDITOR) return;
        this.node.on(Node.EventType.SIZE_CHANGED, this.onResize, this);
    }

    onDestroy() {
        if (EDITOR) return;
        this.node.targetOff(this);
    }

    private onResize() {
        if (!this.target) return;
        let tSize = this.target.getComponent(UITransform).contentSize.clone();
        let size = this.node.getComponent(UITransform).contentSize;
        let scale = this.node.scale.clone();
        if (size.width * scale.x > tSize.width || size.height * scale.y > tSize.height) {
            let s = Math.min(tSize.width / size.width, tSize.height / size.height);
            this.node.setScale(s, s, s);
        }
    }
}
