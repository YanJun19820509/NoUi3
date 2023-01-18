
import { _decorator, Component, Node, Canvas, Camera, screen, view, math, ResolutionPolicy, Widget, UITransform, Touch } from 'cc';
import { no } from '../no';
const { ccclass, property } = _decorator;

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
    public static rectV: math.Rect = math.rect(0, 0, 1, 1);
    /**显示区域，相对于屏幕 */
    public static rect: math.Rect = math.rect();

    public static policy: number = ResolutionPolicy.NO_BORDER;

    onLoad() {
        const size = screen.windowSize;
        if (!this.enabled) {
            YJFitScreen.rect = math.rect(0, 0, size.width, size.height);
            return;
        }

        const dsize = view.getDesignResolutionSize().clone(),
            ss = size.width / size.height,
            dss = dsize.width / dsize.height;
        let policyType: number, rect = math.rect(0, 0, 1, 1);
        if (dss < 1) {//竖屏
            if (ss > 9 / 16) policyType = ResolutionPolicy.FIXED_HEIGHT;
            else policyType = ResolutionPolicy.FIXED_WIDTH;
        } else {//横屏
            if (ss < 16 / 10) policyType = ResolutionPolicy.FIXED_WIDTH;
            else policyType = ResolutionPolicy.FIXED_HEIGHT;
        }
        YJFitScreen.policy = policyType;

        const canvasSize = this.canvas.node.getComponent(UITransform).contentSize;

        view.setDesignResolutionSize(dsize.width, dsize.height, policyType);

        if ((dss < 1 && policyType == ResolutionPolicy.FIXED_HEIGHT) || (dss > 1 && policyType == ResolutionPolicy.FIXED_WIDTH)) {
            const result = view.getResolutionPolicy()['_contentStrategy']['_result'],
                scale: number[] = result.scale,
                w = canvasSize.width * scale[0],
                h = canvasSize.height * scale[1];
            rect.width = no.divide(w, size.width);
            rect.height = no.divide(h, size.height);
            rect.x = 0.5 - rect.width / 2;
            rect.y = 0.5 - rect.height / 2;

            this.camera.rect = rect;
            YJFitScreen.rectV = rect;
            YJFitScreen.rect = math.rect(rect.x * size.width, rect.y * size.height, w, h);
        }

        const widget = this.canvas.getComponent(Widget) || this.canvas.addComponent(Widget);
        if (policyType == ResolutionPolicy.FIXED_WIDTH) {
            widget.isAlignTop = true;
            widget.isAlignBottom = true;
            widget.isAlignLeft = true;
            widget.isAlignRight = true;
            widget.top = 0;
            widget.bottom = 0;
            widget.left = 0;
            widget.right = 0;
        } else if (policyType == ResolutionPolicy.FIXED_HEIGHT) {
            widget.isAlignTop = true;
            widget.isAlignBottom = true;
            widget.isAlignLeft = false;
            widget.isAlignRight = false;
            widget.top = 0;
            widget.bottom = 0;
        }
        widget.updateAlignment();
    }

    public static fitTouchPoint(touch: Touch): math.Vec2 {
        let touchLocation = touch.getUILocation();
        if (this.policy == ResolutionPolicy.FIXED_WIDTH) {
            return touchLocation;
        } else if (this.policy == ResolutionPolicy.FIXED_HEIGHT) {
            const scaleSize = view.getVisibleSize(),
                screenSize = view.getVisibleSizeInPixel();
            let scale = 1 / view.getScaleX();
            touchLocation.x -= (screenSize.width - scaleSize.width) / 2 * scale;
        }
        return touchLocation;
    }

    public static getVisibleSize(): math.Size {
        if (this.policy == ResolutionPolicy.FIXED_WIDTH) return view.getVisibleSize();
        else if (this.policy == ResolutionPolicy.FIXED_HEIGHT) return view.getDesignResolutionSize();
    }
}
