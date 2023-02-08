
import { _decorator, Component, Node, Rect, rect, v2, UITransform, UIRenderer, v3, Vec3, UIOpacity } from 'cc';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJHideChildrenOutOfEdge
 * DateTime = Fri Jan 14 2022 15:56:31 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJHideChildrenOutOfEdge.ts
 * FileBasenameNoExtension = YJHideChildrenOutOfEdge
 * URL = db://assets/Script/NoUi3/base/node/YJHideChildrenOutOfEdge.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJHideChildrenOutOfEdge')
@menu('NoUi/node/YJHideChildrenOutOfEdge(隐藏可视区域范围外的子节点)')
export class YJHideChildrenOutOfEdge extends Component {
    @property({ type: Node, displayName: '可见区域节点' })
    viewNode: Node = null;

    private viewRect: Rect;
    private lastPos: Vec3;

    update() {
        this.checkChildrenVisible();
    }

    private checkChildrenVisible() {
        if (this.viewNode == null) return;
        if (this.viewRect == null) {
            this.viewRect = rect();
            let transform = this.viewNode.getComponent(UITransform);
            this.viewRect.width = transform.width;
            this.viewRect.height = transform.height;
            let nodeTf = this.node.getComponent(UITransform);
            this.viewRect.center = v2(this.node.position.x + this.viewRect.width * (0.5 - nodeTf.anchorX), this.node.position.y + this.viewRect.height * (0.5 - nodeTf.anchorY));
        }
        let pos = v3();
        this.node.getPosition(pos);
        if (this.lastPos == null) {
            this.lastPos = pos;
            return;
        }
        if (pos.equals(this.lastPos)) return;
        let center = this.viewRect.center;
        this.viewRect.center = v2(center.x + this.lastPos.x - pos.x, center.y + this.lastPos.y - pos.y);
        this.lastPos = pos;
        for (let i = 0, n = this.node.children.length; i < n; i++) {
            let child = this.node.children[i];
            let tf = child.getComponent(UITransform);
            let opacity = child.getComponent(UIOpacity);
            let minX = child.position.x - tf.width * tf.anchorX;
            let minY = child.position.y - tf.height * tf.anchorY;
            if (minX > this.viewRect.xMax || minY > this.viewRect.yMax) {
                opacity.opacity = 0;
                continue;
            }
            let maxX = child.position.x + tf.width * (1 - tf.anchorX);
            let maxY = child.position.y + tf.height * (1 - tf.anchorY);
            if (maxX < this.viewRect.xMin || maxY < this.viewRect.yMin) {
                opacity.opacity = 0;
                continue;
            }
            opacity.opacity = 255;
        }
    }
}
