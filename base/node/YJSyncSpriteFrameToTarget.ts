
import { _decorator, Component, isValid, Node, Sprite } from './yj';
import { YJJobManager } from '../YJJobManager';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = YJSyncSpriteFrameToTarget
 * DateTime = Wed Jul 20 2022 12:21:51 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSyncSpriteFrameToTarget.ts
 * FileBasenameNoExtension = YJSyncSpriteFrameToTarget
 * URL = db://assets/NoUi3/base/node/YJSyncSpriteFrameToTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//将当前的spriteframe与target同步
@ccclass('YJSyncSpriteFrameToTarget')
@requireComponent(Sprite)
export class YJSyncSpriteFrameToTarget extends Component {
    @property(Sprite)
    target: Sprite = null;


    private _checkNum = 10;
    private _checkedNum = 0;

    protected start(): void {
        YJJobManager.ins.execute(this.check, this);
    }

    private check() {
        if (!isValid(this.target?.node) || !isValid(this?.node)) return false;
        if (!this.target.spriteFrame) return true;
        if (this._checkedNum == this._checkNum) {
            this._checkedNum = 0;
        } else {
            this._checkedNum++;
            return true;
        }
        if (this.getComponent(Sprite).spriteFrame?._uuid != this.target.spriteFrame._uuid)
            this.getComponent(Sprite).spriteFrame = this.target.spriteFrame;
        return true;
    }
}
