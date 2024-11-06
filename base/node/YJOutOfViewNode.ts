import { ccclass, Component, Node, property, v3 } from "NoUi3/yj";
import { YJOutOfViewManager } from "./YJOutOfViewManager";
import { YJDataWork } from "../YJDataWork";
import { no } from "NoUi3/no";
/**
 * 
 * Author mqsy_yj
 * DateTime Wed Oct 30 2024 20:51:54 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJOutOfViewNode')
export class YJOutOfViewNode extends Component {
    @property({ type: Node })
    managerNode: Node = null;

    onEnable() {
        this.scheduleOnce(() => {
            this.managerNode?.getComponent(YJOutOfViewManager)?.addOutOfViewNode(this);
        }, .1);
    }

    onDisable() {
        this.managerNode?.getComponent(YJOutOfViewManager)?.removeOutOfViewNode(this);
    }

    public setVisible(visible: boolean) {
        this.node['_activeInHierarchy'] = visible;
    }

    public position() {
        const data = this.getComponent(YJDataWork)?.data,
            pos = data?.pos || data?.position;
        if (pos) {
            return v3(pos[0], pos[1]);
        }
        return no.position(this.node);
    }
}