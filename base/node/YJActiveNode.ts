import { ccclass, Component, Node } from '../../yj';

/**
 * Predefined variables
 * Name = YJActiveNode
 * DateTime = Tue Sep 13 2022 11:23:21 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJActiveNode.ts
 * FileBasenameNoExtension = YJActiveNode
 * URL = db://assets/NoUi3/base/node/YJActiveNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJActiveNode')
export class YJActiveNode extends Component {
    public a_active(): void {
        this.setActive(true);
    }

    public a_inactive(): void {
        this.setActive(false);
    }

    private setActive(v: boolean) {
        if (!this.enabled) return;
        this.node.active = v;
    }
}
