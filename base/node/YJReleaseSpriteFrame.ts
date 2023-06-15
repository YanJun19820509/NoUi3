
import { _decorator, Component, Node, Sprite, SpriteFrame } from './yj';
import { no } from '../../no';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = YJReleaseSpriteFrame
 * DateTime = Tue Jan 03 2023 18:46:47 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJReleaseSpriteFrame.ts
 * FileBasenameNoExtension = YJReleaseSpriteFrame
 * URL = db://assets/NoUi3/base/node/YJReleaseSpriteFrame.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJReleaseSpriteFrame')
@requireComponent(Sprite)
export class YJReleaseSpriteFrame extends Component {
    @property({ displayName: '强制释放' })
    force: boolean = true;

    private spriteFrame: SpriteFrame;

    onLoad() {
        this.spriteFrame = this.getComponent(Sprite).spriteFrame;
    }
    onDestroy() {
        no.assetBundleManager.release(this.spriteFrame, this.force);
    }
}
