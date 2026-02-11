import { ccclass, property } from '@hackUi/yj';
import { HackUi } from '@hackUi/ui/HackUi';
import { nodeUtils } from '../extend/nodeUtils';

/**
 * 设置节点顺序索引
 * Author mqsy_yj
 * DateTime Tue Nov 04 2025 12:10:58 GMT+0800 (中国标准时间)
 * data:number,为指定顺序索引,小于0时,不进行设置
 */

@ccclass('SetSiblingIndex')
export class SetSiblingIndex extends HackUi {
    @property({ displayName: '影响父节点', tooltip: '勾选后则设置父节点的顺序索引' })
    affectParent: boolean = false;

    protected onDataChange(data: any) {
        if (data < 0) return;
        nodeUtils.siblingIndex(this.affectParent ? this.node.parent : this.node, data);
    }
}
