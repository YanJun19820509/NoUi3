
import { ccclass, property, menu, Component, isValid } from '../../../yj';
import { no } from '../../../no';
import { YJJobManager } from '../../../base/YJJobManager';

/**
 * Predefined variables
 * Name = YJSetChildrenShieldByZ
 * DateTime = Fri Jan 14 2022 16:33:45 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSetChildrenShieldByZ.ts
 * FileBasenameNoExtension = YJSetChildrenShieldByZ
 * URL = db://assets/Script/NoUi3/base/node/YJSetChildrenShieldByZ.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJSetChildrenShieldByZ')
@menu('NoUi/node/YJSetChildrenShieldByZ(设置子节点之间的遮挡关系)')
export class YJSetChildrenShieldByZ extends Component {
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
        const z = .01 / children.length;
        children.forEach((child, i) => {
            if (child['_origin_z'] == undefined) child['_origin_z'] = no.z(child);
            no.z(child, child['_origin_z'] + z * i);
        });
        return true;
    }

    start() {
        YJJobManager.ins.execute(this.resort, this);
    }
}