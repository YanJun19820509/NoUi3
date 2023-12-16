
import { ccclass, property, Component, Node, Canvas, Camera, screen, view, ResolutionPolicy, Widget, UITransform, Touch, Rect, Vec2, Size, v3 } from '../yj';
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
    /**显示区域，相对于屏幕 */
    public static rect: Rect = new Rect();

    public static policy: number = ResolutionPolicy.NO_BORDER;

    onLoad() {
        let size = view.getVisibleSize();
        if (!this.enabled) {
            YJFitScreen.rect = new Rect(0, 0, size.width, size.height);
            return;
        }

        const dsize = view.getDesignResolutionSize(),
            ss = size.width / size.height,
            dss = dsize.width / dsize.height;
        let policyType: number, rect = new Rect(0, 0, 1, 1), w = dsize.width, h = dsize.height, s = 1;
        // if (dss < 1) {//竖屏
        if (ss > dss) policyType = ResolutionPolicy.FIXED_HEIGHT;
        else policyType = ResolutionPolicy.FIXED_WIDTH;
        // } else {//横屏
        //     if (ss < dss) policyType = ResolutionPolicy.FIXED_WIDTH;
        //     else policyType = ResolutionPolicy.FIXED_HEIGHT;
        // }
        YJFitScreen.policy = policyType;
        view.setResolutionPolicy(policyType)
        size = view.getVisibleSize();
        if (policyType == ResolutionPolicy.FIXED_HEIGHT) {
            // s = dsize.width / size.width;
            // rect.xMin = .5 - s / 2;
            // rect.xMax = .5 + s / 2;
            no.size(this.canvas.node, dsize);
            no.size(this.node, dsize);
            //canvas  锚点虽然是0.5,0.5  但实际是0,0   需要重新设置坐标定位
            no.position(this.canvas.node, v3(dsize.width / 2, dsize.height / 2));
            // this.camera.rect = rect;
        } else if (policyType == ResolutionPolicy.FIXED_WIDTH) {
            // no.size(this.canvas.node, dsize);
            no.size(this.node, no.size(this.canvas.node));
            this.canvas.alignCanvasWithScreen = true;
        }
        // no.scale(this.canvas.node, v3(s, s, 1));
        // view.setDesignResolutionSize(w * s, h * s, policyType);
        // no.scale(this.canvas.node, v3(s, s, 1));
        // no.size(this.canvas.node, view.getDesignResolutionSize());



        // if ((dss < 1 && policyType == ResolutionPolicy.FIXED_HEIGHT) || (dss > 1 && policyType == ResolutionPolicy.FIXED_WIDTH)) {
        //     const result = view.getResolutionPolicy()['_contentStrategy']['_result'],
        //         scale: number[] = result.scale,
        //         w = dsize.width * scale[0],
        //         h = dsize.height * scale[1];
        //     rect.width = no.divide(w, size.width);
        //     rect.height = no.divide(h, size.height);
        //     rect.x = 0.5 - rect.width / 2;
        //     rect.y = 0.5 - rect.height / 2;

        //     this.camera.rect = rect;
        //     // YJFitScreen.rectV = rect;
        //     // YJFitScreen.rect = new Rect(rect.x * size.width, rect.y * size.height, w, h);
        // }

        // const widget = this.canvas.getComponent(Widget) || this.canvas.addComponent(Widget);
        // if (policyType == ResolutionPolicy.FIXED_WIDTH) {
        //     widget.isAlignTop = true;
        //     widget.isAlignBottom = true;
        //     widget.isAlignLeft = true;
        //     widget.isAlignRight = true;
        //     widget.top = 0;
        //     widget.bottom = 0;
        //     widget.left = 0;
        //     widget.right = 0;
        // } else if (policyType == ResolutionPolicy.FIXED_HEIGHT) {
        //     widget.isAlignTop = true;
        //     widget.isAlignBottom = true;
        //     widget.isAlignLeft = false;
        //     widget.isAlignRight = false;
        //     widget.top = 0;
        //     widget.bottom = 0;
        // }
        // widget.updateAlignment();
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
