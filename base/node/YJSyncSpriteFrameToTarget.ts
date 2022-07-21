
import { _decorator, Component, Node, Sprite } from 'cc';
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

    update() {
        if (!this.target || !this.target.spriteFrame) return;
        if (this.getComponent(Sprite).spriteFrame?._uuid != this.target.spriteFrame._uuid)
            this.getComponent(Sprite).spriteFrame = this.target.spriteFrame;
    }
}
