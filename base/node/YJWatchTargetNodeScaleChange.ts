
import { _decorator, Component, Node, math, v3, isValid } from 'cc';
import { no } from '../../no';
import { YJNodeTarget } from './YJNodeTarget';
import { YJJobManager } from '../YJJobManager';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJWatchTargetNodeScaleChange
 * DateTime = Thu Aug 04 2022 16:29:53 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJWatchTargetNodeScaleChange.ts
 * FileBasenameNoExtension = YJWatchTargetNodeScaleChange
 * URL = db://assets/NoUi3/base/node/YJWatchTargetNodeScaleChange.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//监听目标节点scale改变
@ccclass('YJWatchTargetNodeScaleChange')
export class YJWatchTargetNodeScaleChange extends Component {
    @property
    targetType: string = '';
    @property(no.EventHandlerInfo)
    onChange: no.EventHandlerInfo[] = [];

    private _targetScale: math.Vec3;

    private _checkNum = 10;
    private _checkedNum = 0;

    protected start(): void {
        YJJobManager.ins.execute(this.check, this);
    }

    private check() {
        if (this._checkedNum == this._checkNum) {
            this._checkedNum = 0;
        } else {
            this._checkedNum++;
            return true;
        }
        let target = no.nodeTargetManager.get<YJNodeTarget>(this.targetType);
        if (!target || !isValid(target?.node) || !isValid(this?.node)) return false;
        if (!this._targetScale) {
            this._targetScale = v3();
            target.node.getScale(this._targetScale);
        } else {
            let scale = target.node.getScale();
            if (!this._targetScale.equals(scale)) {
                this._targetScale = scale;
                no.EventHandlerInfo.execute(this.onChange, this._targetScale);
            }
        }
        return true;
    }
}
