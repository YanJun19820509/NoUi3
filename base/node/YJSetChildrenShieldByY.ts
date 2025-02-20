
import { ccclass, property, menu, Component, isValid, Node, macro } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJSetChildrenShieldByY
 * DateTime = Fri Jan 14 2022 16:33:45 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSetChildrenShieldByY.ts
 * FileBasenameNoExtension = YJSetChildrenShieldByY
 * URL = db://assets/Script/NoUi3/base/node/YJSetChildrenShieldByY.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 * 设置子节点之间的遮挡关系，如果指定了目标节点，其他同级节点会根据目标节点进行遮挡关系设置
 * 
 */

@ccclass('YJSetChildrenShieldByY')
@menu('NoUi/node/YJSetChildrenShieldByY(设置子节点之间的遮挡关系)')
export class YJSetChildrenShieldByY extends Component {
    @property({ type: Node, displayName: '目标节点', tooltip: '如果指定了目标节点，仅会处理目标节点相对其他同级节点的遮挡关系' })
    target: Node = null;
    @property({ displayName: '更新频率(帧)' })
    frameNum: number = 10;

    private resort() {
        if (!isValid(this?.node)) return;
        let children = this.node['_children'];
        no.sortArray(children, (b, a) => {
            return b.position.y - a.position.y;
        }, true);
        if (this.target) {
            let maxY: number, maxChild: Node, idx: number;
            const targetY = this.target.position.y;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child === this.target) continue;
                const childY = child.position.y;
                if (!maxChild || (childY > maxY && childY < targetY)) {
                    maxY = childY;
                    maxChild = child;
                    idx = i;
                }
            }
            if (maxChild && maxY < targetY) {
                const targetIdx = children.indexOf(this.target);
                if (idx > targetIdx) idx--;
                if (idx == targetIdx) return;
                children.splice(targetIdx, 1);
                children.splice(idx, 0, this.target);
            }
        }
    }

    start() {
        this.schedule(this.resort, this.frameNum / 60, macro.REPEAT_FOREVER);
    }
}