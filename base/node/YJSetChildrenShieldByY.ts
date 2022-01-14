
import { _decorator, Component, Node } from 'cc';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJSetChildrenShieldByY
 * DateTime = Fri Jan 14 2022 16:33:45 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSetChildrenShieldByY.ts
 * FileBasenameNoExtension = YJSetChildrenShieldByY
 * URL = db://assets/Script/NoUi3/base/node/YJSetChildrenShieldByY.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJSetChildrenShieldByY')
@menu('NoUi/node/YJSetChildrenShieldByY(设置子节点之间的遮挡关系)')
export class YJSetChildrenShieldByY extends Component {
    @property({ displayName: '更新频率(帧)' })
    frameNum: number = 10;

    private _num = 0;

    update() {
        if (this._num == 0) {
            this.sortSibling();
            this._num = this.frameNum;
        } else {
            this._num--;
        }
    }

    private sortSibling() {
        let children = this.node.children;
        children.sort((a, b) => {
            return b.position.y - a.position.y;
        });
        for (let i = 0, n = children.length; i < n; i++) {
            children[i].setSiblingIndex(i);
        }
    }
}