
import { _decorator, Component, Node, Animation } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = YJPlayAnimation
 * DateTime = Thu Aug 11 2022 12:14:03 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPlayAnimation.ts
 * FileBasenameNoExtension = YJPlayAnimation
 * URL = db://assets/NoUi3/base/ani/YJPlayAnimation.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJPlayAnimation')
@requireComponent(Animation)
export class YJPlayAnimation extends Component {
    @property
    playonEnable: boolean = false;

    onEnable() {
        if (this.playonEnable) {
            let ani = this.getComponent(Animation);
            ani.play(ani.defaultClip.name);
        }
    }
}
