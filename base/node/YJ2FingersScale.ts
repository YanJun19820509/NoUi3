
import { ccclass, property, Component, Node, EventTouch, Touch, Vec2, math } from '../../yj';
import { YJFitScreen } from '../YJFitScreen';

/**
 * Predefined variables
 * Name = YJ2FingersScale
 * DateTime = Mon Jul 18 2022 11:59:25 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJ2FingersScale.ts
 * FileBasenameNoExtension = YJ2FingersScale
 * URL = db://assets/common/base/node/YJ2FingersScale.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJ2FingersScale')
/**
 * 双指缩放组件
 * 用于实现节点的双指缩放功能
 */
/**
 * 双指缩放组件
 * 实现节点双指缩放功能，支持设置缩放范围和目标节点
 * @example
 * // 在节点上挂载组件并设置参数
 * const scaleComponent = node.addComponent(YJ2FingersScale);
 * scaleComponent.minScale = 0.3;
 * scaleComponent.maxScale = 2.0;
 * scaleComponent.target = targetNode;
 */
export class YJ2FingersScale extends Component {
    /** 
     * 缩放目标节点（默认为组件所在节点）
     * @example
     * // 设置为其他节点
     * this.target = otherNode;
     */
    @property(Node)
    target: Node = null;
    
    /** 
     * 最小缩放比例（取值范围 >= 0.1）
     * @example
     * // 设置最小缩放为正常尺寸的30%
     * minScale = 0.3;
     */
    @property({ min: .1 })
    minScale: number = .5;
    
    /** 
     * 最大缩放比例（取值范围 >= 1）
     * @example
     * // 设置最大放大到正常尺寸的2倍
     * maxScale = 2.0;
     */
    @property({ min: 1 })
    maxScale: number = 1.5;

    /** 触摸状态标志位（true表示双指正在操作） */
    private touched: boolean = false;
    /** 记录双指初始间距（用于计算缩放比例） */
    private startDis: number;
    /** 记录操作前的初始缩放值（用于增量计算） */
    private startScale: number;

    /** 
     * 组件启用时注册触摸事件
     * 使用捕获阶段确保及时响应
     * 初始化目标节点（如果未指定则使用当前节点）
     */
    onEnable() {
        this.target = this.target || this.node;
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this, true);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this, true);
    }

    /** 
     * 组件禁用时注销所有触摸事件
     * 防止内存泄漏
     */
    onDisable() {
        this.node.targetOff(this);
    }

    /** 
     * 触摸开始回调
     * 当检测到双指触摸时：
     * 1. 阻止事件冒泡
     * 2. 记录初始双指间距
     * 3. 保存当前缩放值
     * @param e 触摸事件对象
     */
    private onTouchStart(e: EventTouch) {
        let touches = e.getAllTouches();
        if (touches.length < 2) {
            e.preventSwallow = true; // 单指操作时不阻止其他事件
            return;
        }
        e.propagationStopped = true; // 阻止事件传播
        this.touched = true;
        this.startDis = this.touchesDistance(touches);
        this.startScale = this.target.scale.x; // 使用x轴缩放作为基准值
    }

    /**
     * 触摸移动回调
     * 计算当前双指间距与初始间距的比值，应用缩放限制
     * @param e 触摸事件对象
     */
    private onTouchMove(e: EventTouch) {
        if (!this.touched) {
            e.preventSwallow = true; // 非双指操作时不阻止其他事件
            return;
        }
        e.propagationStopped = true;
        
        // 计算当前双指间距
        const dis = this.touchesDistance(e.getAllTouches());
        // 计算缩放比例：基础比例 + 相对变化量
        const scale = math.clamp(
            this.startScale + (dis - this.startDis) / this.startDis,
            this.minScale,
            this.maxScale
        );
        
        // 当达到缩放边界时重置基准值，避免累计误差
        if (scale === this.minScale || scale === this.maxScale) {
            this.startScale = scale;
            this.startDis = dis;
        }
        
        this.target.setScale(scale, scale); // 保持等比例缩放
    }

    /** 
     * 触摸结束回调
     * 重置触摸状态，允许新的缩放操作
     */
    private onTouchEnd(e: EventTouch) {
        e.preventSwallow = true; // 结束时不阻止其他事件
        this.touched = false;
    }

    /**
     * 计算两指间距（经过屏幕适配处理）
     * @param touches 包含两个触摸点的数组
     * @returns 适配后的实际屏幕距离
     * @example
     * // 返回两点间实际像素距离
     * const distance = this.touchesDistance([touch1, touch2]);
     */
    private touchesDistance(touches: Touch[]): number {
        return Vec2.distance(
            YJFitScreen.fitTouchPoint(touches[0]), // 适配后的触摸点1坐标
            YJFitScreen.fitTouchPoint(touches[1])  // 适配后的触摸点2坐标
        );
    }
}
