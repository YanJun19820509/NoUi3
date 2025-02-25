import { no } from 'NoUi3/no';
import { ccclass, property, menu, Component, isValid, Node, macro } from '../../yj';

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
    @property({ displayName: '更新频率(帧)' })
    frameNum: number = 10;

    private resort() {
        if (!isValid(this?.node)) return;
        const children = this.node.children;
        const visibleChildren: Node[] = [];
        for (let i = 0, n = children.length; i < n; i++) {
            const child = children[i];
            if (child.activeInHierarchy) {
                visibleChildren.push(child);
            }
        }
        no.sortArray(visibleChildren, (b, a) => {
            return b.position.y - a.position.y;
        }, true);

        for (let i = 0, n = visibleChildren.length; i < n; i++) {
            const child = visibleChildren[i];
            child.setSiblingIndex(i);
        }
    }

    start() {
        this.schedule(this.resort, this.frameNum / 60, macro.REPEAT_FOREVER);
    }
}