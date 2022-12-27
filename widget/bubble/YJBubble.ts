
import { _decorator, Component, Node, v3, Vec3, UITransform } from 'cc';
import { YJNodeTarget } from '../../base/node/YJNodeTarget';
import { YJDataWork } from '../../base/YJDataWork';
import { no } from '../../no';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJBubble
 * DateTime = Tue Jun 14 2022 09:39:10 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJBubble.ts
 * FileBasenameNoExtension = YJBubble
 * URL = db://assets/NoUi3/widget/bubble/YJBubble.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 气泡控件,
 * data: {
 *     position?: number[x,y]
 *     target?: string//目标节点标识，在YJNodeTarget中设置，与position任选其一
 * }
 */
@ccclass('YJBubble')
export class YJBubble extends YJDataWork {
    @property(Vec3)
    offset: Vec3 = v3();

    protected afterInit() {
        if (!this.data) return;
        let pos = v3();
        if (this.data.position) {
            pos.x = this.data.position[0];
            pos.y = this.data.position[1];
        } else if (this.data.target) {
            let nt = no.nodeTargetManager.get<YJNodeTarget>(this.data.target);
            let p = nt.nodeWorldPosition;
            pos.x = p.x;
            pos.y = p.y;
        } else return;
        this.node.getComponent(UITransform).convertToNodeSpaceAR(pos, pos);
        this.setValue('pos', [pos.x + this.offset.x, pos.y + this.offset.y]);
        this.setValue('show', true);
    }

    public a_hide(): void {
        this.setValue('show', false);
    }

}
