
import { _decorator, Component, Node } from 'cc';
import { no } from '../../no';
const { ccclass, property, menu, executeInEditMode } = _decorator;

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
@executeInEditMode()
export class YJSetChildrenShieldByY extends Component {
    @property({ displayName: '更新频率(帧)' })
    frameNum: number = 10;

    private _num = 0;

    private resort() {
        let children = this.node.children;
        no.sortArray(children, (b, a) => {
            return b.position.y - a.position.y;
        }, true);
        // this.node._updateSiblingIndex();
    }

    update() {
        if (this._num == 0) {
            this.resort();
            this._num = this.frameNum;
        } else {
            this._num--;
        }
    }
}