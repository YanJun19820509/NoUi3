import { ccclass, Component, property, requireComponent, Camera, screen } from "hackUi/yj";
import { no } from "../../no";
/**
 * 设置相机
 * Author mqsy_yj
 * DateTime Tue Sep 16 2025 17:06:13 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJSetCamera')
@requireComponent(Camera)
export class YJSetCamera extends Component {
    @property
    halfScreen: boolean = false;
    @property
    orthoHeight: boolean = false;

    onLoad(): void {
        const camera = this.getComponent(Camera);
        if (this.orthoHeight) {
            camera.orthoHeight = no.viewSize().height * (this.halfScreen ? .5 : 1);
        }
    }
}