import { ccclass, Component, property } from "../../yj";
import { nodeTargetManager } from "../../NodeTargetManager";
import { YJNodeTarget } from "./YJNodeTarget";
import { no } from "../../no";
/**
 * 将当前节点坐标设置为目标节点坐标
 * Author mqsy_yj
 * DateTime Wed Nov 05 2025 09:38:11 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJSetPostionToTarget')
export class YJSetPostionToTarget extends Component {
    @property
    target: string = '';

    protected onEnable(): void {
        this.moveToTarget(this.target);
    }

    /**
     * 移动到目标节点
     * @param targetName 目标节点名称
     */
    public moveToTarget(targetName: string) {
        let target = nodeTargetManager.get<YJNodeTarget>(targetName);
        if (!target) {
            console.error(`YJSetPostionToTarget: target ${targetName} not found, try again in next frame`);
            this.scheduleOnce(() => {
                this.moveToTarget(targetName);
            });
            return;
        }
        let pos = no.nodePositionInOtherNode(target.node, this.node.parent);
        no.position(this.node, pos);
    }
}