
import { ccclass, property, menu, Component, isValid, Node } from '../../yj';
import { no } from '../../no';
import { YJJobManager } from '../YJJobManager';

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

    private resort() {
        if (!isValid(this?.node)) return false;
        if (this._num == 0) {
            this._num = this.frameNum;
        } else {
            this._num--;
            return true;
        }
        let children = this.node.children;
        no.sortArray(children, (b, a) => {
            return b.position.y - a.position.y;
        }, true);
        this.node._updateSiblingIndex();
        return true;
    }

    start() {
        YJJobManager.ins.execute(this.resort, this);
    }
}