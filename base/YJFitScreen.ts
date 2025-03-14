
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
/**
 * 屏幕适配组件
 * @description 处理不同分辨率设备的屏幕适配，支持横竖屏自适应
 * @example 
 * // 添加到场景根节点，并配置Canvas和Camera组件
 * const fitScreen = rootNode.addComponent(YJFitScreen);
 * fitScreen.canvas = rootNode.getComponent(Canvas);
 * fitScreen.camera = rootNode.getComponentInChildren(Camera);
 */
export class YJFitScreen extends Component {
    @property({ type: Canvas })
    canvas: Canvas = null;
    @property({ type: Camera })
    camera: Camera = null;

    /** 显示区域矢量值（标准化0-1范围） */
    public static rectV: Rect = new Rect(0, 0, 1, 1);
    /** 实际显示区域（像素坐标系） */
    public static rect: Rect = new Rect();
    /** 当前使用的分辨率策略 */
    public static policy: number = ResolutionPolicy.FIXED_WIDTH;

    onLoad() {
        this.adapt();
        // 监听屏幕尺寸变化事件
        view.on("canvas-resize", () => {
            no.log('window resize');
            this.adapt();
        }, this);
    }

    /**
     * 执行屏幕适配逻辑
     * @description 根据屏幕宽高比自动选择适配策略：
     * - FIXED_WIDTH: 固定宽度，垂直方向裁剪（适合宽屏设备）
     * - FIXED_HEIGHT: 固定高度，水平方向裁剪（适合竖屏设备）
     * 
     * @example
     * // 手动触发适配（如设备旋转后）
     * this.getComponent(YJFitScreen).adapt();
     */
    private adapt() {
        let size = view.getVisibleSize();
        if (!this.enabled) {
            YJFitScreen.rect = new Rect(0, 0, size.width, size.height);
            return;
        }
        const dsize = view.getDesignResolutionSize(),
            ss = size.width / size.height,  // 当前屏幕宽高比
            dss = dsize.width / dsize.height; // 设计分辨率宽高比
        
        let policyType: number, w = dsize.width, h = dsize.height;

        // 根据宽高比差异选择适配策略
        if (ss > dss) {
            policyType = ResolutionPolicy.FIXED_HEIGHT; // 竖屏适配
        } else {
            policyType = ResolutionPolicy.FIXED_WIDTH;  // 横屏适配
        }

        YJFitScreen.policy = policyType;
        view.setResolutionPolicy(policyType)
        size = view.getVisibleSize();

        // 应用不同的适配策略
        if (policyType == ResolutionPolicy.FIXED_HEIGHT) {
            // 竖屏适配：保持高度不变，调整宽度
            no.size(this.canvas.node, dsize);
            no.size(this.node, dsize);
            // 居中定位Canvas节点
            no.position(this.canvas.node, v3(dsize.width / 2, dsize.height / 2));
        } else if (policyType == ResolutionPolicy.FIXED_WIDTH) {
            // 横屏适配：保持宽度不变，调整高度
            no.size(this.node, no.size(this.canvas.node));
            this.canvas.alignCanvasWithScreen = true;
        }
    }

    /**
     * 校正触摸点坐标
     * @param touch 触摸对象
     * @returns 适配后的坐标点
     * @example
     * // 在触摸事件中使用
     * node.on(Node.EventType.TOUCH_START, (touch) => {
     *     const pos = YJFitScreen.fitTouchPoint(touch);
     * });
     */
    public static fitTouchPoint(touch: Touch): Vec2 {
        let touchLocation = touch.getUILocation();
        if (this.policy == ResolutionPolicy.FIXED_HEIGHT) {
            const scaleSize = view.getVisibleSize();
            touchLocation.x -= (scaleSize.width - this.getVisibleSize().width) / 2;
        }
        return touchLocation;
    }

    /**
     * 获取实际可见区域尺寸
     * @returns 根据当前策略返回有效显示尺寸
     */
    public static getVisibleSize(): Size {
        return this.policy == ResolutionPolicy.FIXED_WIDTH ? 
            view.getVisibleSize() : 
            view.getDesignResolutionSize();
    }
}
