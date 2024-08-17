import { no } from "../../no";
import { ccclass, Component, EDITOR, executeInEditMode, Mask, Node, NodeEventType, property, requireComponent, ScrollView } from "../../yj";
/**
 * 
 * Author mqsy_yj
 * DateTime Sat Aug 17 2024 14:45:17 GMT+0800 (中国标准时间)
 * 自动开启ScrollView的mask，当内容超出时mask开启，否则关闭
 */

@ccclass('YJScrollViewMaskAutoEnable')
@requireComponent(Mask)
@executeInEditMode()
export class YJScrollViewMaskAutoEnable extends Component {
    @property(Node)
    content: Node = null;

    onEnable() {
        this.content?.on(NodeEventType.SIZE_CHANGED, this._enableMask, this);
    }

    onDisable() {
        this.content?.off(NodeEventType.SIZE_CHANGED, this._enableMask, this);
    }

    private _enableMask() {
        const s1 = no.size(this.node),
            s2 = no.size(this.content);
        this.getComponent(Mask).enabled = s2.height > s1.height || s2.width > s1.width;
    }

    update() {
        if (EDITOR) {
            if (!this.content) {
                this.content = this.node.parent.getComponent(ScrollView)?.content;
            }
        }
    }
}