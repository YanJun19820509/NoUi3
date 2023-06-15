
import { _decorator, Component, Node, ScrollView, UITransform, EventHandler, math } from './yj';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = YJScrollPerspective
 * DateTime = Wed May 11 2022 09:30:17 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJScrollPerspective.ts
 * FileBasenameNoExtension = YJScrollPerspective
 * URL = db://assets/NoUi3/base/node/YJScrollPerspective.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 滚动透视
 */
@ccclass('YJScrollPerspective')
@requireComponent(ScrollView)
export class YJScrollPerspective extends Component {
    @property({ step: 0.1, min: 0.1 })
    scaleMin: number = 1.0;
    @property({ step: 0.1, min: 1.0 })
    scaleMax: number = 1.5;
    @property(Node)
    target: Node = null;

    private sv: ScrollView;

    onLoad() {
        this.sv = this.getComponent(ScrollView);
        if (!this.target) this.target = this.sv.content;
        let eh = new EventHandler();
        eh.target = this.node;
        eh.component = 'YJScrollPerspective';
        eh.handler = 'setScale';
        this.sv.scrollEvents[this.sv.scrollEvents.length] = eh;
        // this.setChildrenScale();
        this.setScale();
    }

    private setScale() {
        let pos = this.sv.content.position;
        let ctf = this.sv.content.getComponent(UITransform);
        let tf = this.target.getComponent(UITransform);
        let scrollHeight = ctf.contentSize.height - this.node.getComponent(UITransform).contentSize.height;
        let p = pos.y / scrollHeight - (tf.anchorPoint.y - 1);
        let scale = this.scaleMax - (this.scaleMax - this.scaleMin) * p;
        this.target.setScale(scale, scale);
        ctf.setContentSize(new math.Size(tf.contentSize.width * scale, tf.contentSize.height * scale));
    }

    // private setChildrenScale() {
    //     let h = this.target.getComponent(UITransform).height;
    //     let ch = this.target.getComponent(UITransform).anchorY;
    //     this.target.children.forEach(child => {
    //         let y = child.position.y;
    //         let p = y / scrollHeight - (ch - 1);
    //         let scale = 1 / (this.scaleMax - (this.scaleMax - this.scaleMin) * p);
    //         child.setScale(scale, scale);
    //     });
    // }
}
