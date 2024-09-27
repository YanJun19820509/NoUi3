
import { ccclass, property, Component, Node, Canvas, Camera, view, ResolutionPolicy, Widget, UITransform, Touch, Rect, Vec2, Size, v3 } from '../yj';
import { no } from '../no';

/**
 * Predefined variables
 * Name = YJFitScreen
 * DateTime = Tue Jan 17 2023 08:56:12 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJFitScreen.ts
 * FileBasenameNoExtension = YJFitScreen
 * URL = db://assets/NoUi3/base/YJFitScreen.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJFitScreen')
export class YJFitScreen extends Component {
    @property({ type: Canvas })
    canvas: Canvas = null;
    @property({ type: Camera })
    camera: Camera = null;

    /**显示区域矢量值 */
    public static rectV: Rect = new Rect(0, 0, 1, 1);

    public static policy: number = ResolutionPolicy.NO_BORDER;

    onLoad() {
        view.on("canvas-resize", () => {
            no.log('window resize');
            this.adapt();
        }, this);
        this.adapt();
    }

    private adapt() {
        if (!this.enabled) {
            return;
        }
        const dir = no.deviceOrientation(),
            dsize = view.getDesignResolutionSize();
        let policyType: number;
        if (dir == 0 && dsize.height > dsize.width) policyType = ResolutionPolicy.FIXED_HEIGHT;
        else policyType = ResolutionPolicy.FIXED_WIDTH;
        YJFitScreen.policy = policyType;
        view.setResolutionPolicy(policyType)
        // if (policyType == ResolutionPolicy.FIXED_HEIGHT) {
        //     no.size(this.canvas.node, dsize);
        //     // no.size(this.node, dsize);
        //     //canvas  锚点虽然是0.5,0.5  但实际是0,0   需要重新设置坐标定位
        //     no.position(this.canvas.node, v3(dsize.width / 2, dsize.height / 2));
        // } else if (policyType == ResolutionPolicy.FIXED_WIDTH) {
        //     no.size(this.node, no.size(this.canvas.node));
        // }
        this.canvas.alignCanvasWithScreen = true;
    }

    public static fitTouchPoint(touch: Touch): Vec2 {
        let touchLocation = touch.getUILocation();
        if (this.policy == ResolutionPolicy.FIXED_WIDTH) {
            return touchLocation;
        } else if (this.policy == ResolutionPolicy.FIXED_HEIGHT) {
            const scaleSize = view.getVisibleSize(),
                screenSize = view.getVisibleSizeInPixel();
            let scale = 1 / view.getScaleX();
            touchLocation.x -= (scaleSize.width - this.getVisibleSize().width) / 2;
        }
        return touchLocation;
    }

    public static getVisibleSize(): Size {
        if (this.policy == ResolutionPolicy.FIXED_WIDTH) return view.getVisibleSize();
        else if (this.policy == ResolutionPolicy.FIXED_HEIGHT) return view.getDesignResolutionSize();
    }
}
