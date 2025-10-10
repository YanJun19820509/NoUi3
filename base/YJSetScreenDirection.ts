import { ccclass, Component, Enum, macro, property, ResolutionPolicy, view } from "../yj";
/**
 * 设置屏幕方向
 * Author mqsy_yj
 * DateTime Wed Jul 09 2025 11:55:37 GMT+0800 (中国标准时间)
 *
 */

enum ScreenDirection {
    Horizontal = macro.ORIENTATION_LANDSCAPE,//横屏
    Vertical = macro.ORIENTATION_PORTRAIT,//竖屏
}

@ccclass('YJSetScreenDirection')
export class YJSetScreenDirection extends Component {
    @property({ type: Enum(ScreenDirection) })
    direction: ScreenDirection = ScreenDirection.Horizontal;

    onLoad() {
        view.setOrientation(this.direction);
        const size = view.getDesignResolutionSize();
        if (this.direction == ScreenDirection.Horizontal) {
            if (size.height > size.width) {
                view.setDesignResolutionSize(size.height, size.width, ResolutionPolicy.FIXED_HEIGHT);
            } else {
                view.setResolutionPolicy(ResolutionPolicy.FIXED_HEIGHT);
            }
        } else {
            if (size.width > size.height) {
                view.setDesignResolutionSize(size.width, size.height, ResolutionPolicy.FIXED_WIDTH);
            } else
                view.setResolutionPolicy(ResolutionPolicy.FIXED_WIDTH);
        }
    }
}