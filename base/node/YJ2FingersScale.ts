
import { ccclass, property, Component, Node, EventTouch, Touch, Vec2, math } from '../../yj';
import { YJFitScreen } from '../YJFitScreen';

/**
 * Predefined variables
 * Name = YJ2FingersScale
 * DateTime = Mon Jul 18 2022 11:59:25 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJ2FingersScale.ts
 * FileBasenameNoExtension = YJ2FingersScale
 * URL = db://assets/NoUi3/base/node/YJ2FingersScale.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJ2FingersScale')
/**
 * 双指缩放组件
 * 用于实现节点的双指缩放功能
 */
export class YJ2FingersScale extends Component {
    /** 缩放目标节点,默认为组件所在节点 */
    @property(Node)
    target: Node = null;
    /** 最小缩放比例 */
    @property({ min: .1 })
    minScale: number = .5;
    /** 最大缩放比例 */
    @property({ min: 1 })
    maxScale: number = 1.5;

    /** 是否正在触摸中 */
    private touched: boolean = false;
    /** 双指初始距离 */
    private startDis: number;
    /** 初始缩放值 */
    private startScale: number;

    /** 组件启用时注册触摸事件 */
    onEnable() {
        this.target = this.target || this.node;
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this, true);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this, true);
    }

    /** 组件禁用时注销触摸事件 */
    onDisable() {
        this.node.targetOff(this);
    }

    /** 
     * 触摸开始回调
     * 当双指触摸时记录初始状态
     */
    private onTouchStart(e: EventTouch) {
        let touches = e.getAllTouches();
        if (touches.length < 2) {
            e.preventSwallow = true;
            return;
        }
        e.propagationStopped = true;
        this.touched = true;
        this.startDis = this.touchesDistance(touches);
        this.startScale = this.target.scale.x;
    }

    /**
     * 触摸移动回调
     * 根据双指距离变化计算并设置目标节点缩放值
     */
    private onTouchMove(e: EventTouch) {
        if (!this.touched) {
            e.preventSwallow = true;
            return;
        }
        e.propagationStopped = true;
        let dis = this.touchesDistance(e.getAllTouches());
        let scale = math.clamp(this.startScale + (dis - this.startDis) / this.startDis, this.minScale, this.maxScale);
        if (scale == this.minScale || scale == this.maxScale) {
            this.startScale = scale;
            this.startDis = dis;
        }
        this.target.setScale(scale, scale);
    }

    /** 
     * 触摸结束回调
     * 重置触摸状态
     */
    private onTouchEnd(e: EventTouch) {
        e.preventSwallow = true;
        this.touched = false;
    }

    /**
     * 计算两个触摸点之间的距离
     * @param touches 触摸点数组
     * @returns 两点间距离
     */
    private touchesDistance(touches: Touch[]): number {
        return Vec2.distance(YJFitScreen.fitTouchPoint(touches[0]), YJFitScreen.fitTouchPoint(touches[1]));
    }
}
