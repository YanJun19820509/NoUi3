import { no } from "../../no";
import { ccclass, Component, property, Node, isValid } from "../../yj";
import { YJNodeTarget } from "./YJNodeTarget";
/**
 * 
 * Author mqsy_yj
 * DateTime Mon Aug 12 2024 17:13:40 GMT+0800 (中国标准时间)
 * 当目标节点属性改变时
 */

@ccclass('YJOnTargetNodePropertyChange')
/**
 * 目标节点属性变化监听组件
 * @remarks
 * 功能特性：
 * - 通过nodeTargetManager全局管理机制获取目标节点
 * - 监听节点的位置/旋转/缩放变化事件
 * - 支持不同属性变化触发不同回调事件
 * 
 * @example
 * // 典型应用场景：
 * // 1. 摄像机跟随移动目标时实时更新位置
 * // 2. UI元素需要根据3D物体旋转状态调整显示
 * // 3. 物体缩放时同步更新碰撞体大小
 * 
 * // 在属性检查器中的配置示例：
 * // - targetNodeType 设置为 "player.main"（需要目标节点已注册该类型）
 * // - 为onPositionChange添加回调：目标脚本的方法，参数为new Position
 */
export class YJOnTargetNodePropertyChange extends Component {
    /** 
     * 目标节点在nodeTargetManager中注册的标识
     * @property {string} targetNodeType - 需与目标节点YJNodeTarget组件设置的type完全匹配
     * @example
     * // 当目标节点type为"enemy.boss"时：
     * targetNodeType = "enemy.boss"
     */
    @property
    targetNodeType: string = '';

    /** 
     * 当目标节点位置改变时触发的事件
     * @property {no.EventHandlerInfo[]} onPositionChange - 回调参数为节点新位置(Vec3)
     * @example
     * // 在编辑器中配置：
     * // 1. 拖入响应节点
     * // 2. 选择组件方法，如：CameraController.updateTargetPosition
     * // 3. 参数将自动传入新位置
     */
    @property(no.EventHandlerInfo)
    onPositionChange: no.EventHandlerInfo[] = [];

    /** 
     * 当目标节点旋转改变时触发的事件
     * @property {no.EventHandlerInfo[]} onRotationChange - 回调参数为节点新欧拉角(Vec3)
     * @example
     * // 旋转变化时同步UI指针方向：
     * // 1. 创建指针UI节点
     * // 2. 在此事件绑定UI旋转方法，参数即为目标物体的新旋转角度
     */
    @property(no.EventHandlerInfo)
    onRotationChange: no.EventHandlerInfo[] = [];

    /** 
     * 当目标节点缩放改变时触发的事件 
     * @property {no.EventHandlerInfo[]} onScaleChange - 回调参数为节点新缩放值(Vec3)
     * @example
     * // 缩放变化时同步更新碰撞体积：
     * // 1. 绑定物理组件的updateColliderSize方法
     * // 2. 在方法内根据传入的scale值调整碰撞体大小
     */
    @property(no.EventHandlerInfo)
    onScaleChange: no.EventHandlerInfo[] = [];

    /** 
     * 目标节点引用缓存
     * @private {Node} _targetNode - 通过nodeTargetManager获取的目标节点实例
     */
    private _targetNode: Node = null;

    /** 
     * 组件加载时初始化
     * @remarks
     * 执行流程：
     * 1. 从nodeTargetManager获取目标节点引用
     * 2. 注册TRANSFORM_CHANGED全局变换事件监听
     * 3. 自动建立节点属性变化响应机制
     */
    onLoad() {
        // 通过类型标识获取已注册的目标节点
        this._targetNode = no.nodeTargetManager.get<YJNodeTarget>(this.targetNodeType)?.node;
        if (this._targetNode) {
            // 注册节点变换事件监听，使用bitmask检测所有变换类型
            this._targetNode.on(Node.EventType.TRANSFORM_CHANGED, this.onPropertyChange, this);
        }
    }

    /** 
     * 组件销毁时清理
     * @remarks
     * 重要：必须移除事件监听防止内存泄漏
     */
    onDestroy() {
        if (this._targetNode && isValid(this._targetNode)) {
            this._targetNode.off(Node.EventType.TRANSFORM_CHANGED, this.onPropertyChange, this);
        }
    }

    /**
     * 属性变化事件处理中枢
     * @param type 变化类型标识（使用Node.TransformBit的位掩码）
     * @remarks
     * 位运算检测原理：
     * - POSITION:   0b001
     * - ROTATION:   0b010  
     * - SCALE:      0b100
     * 通过按位与运算确定具体变化类型
     */
    private onPropertyChange(type: number) {
        // 位置变化分支
        if (type & Node.TransformBit.POSITION) {
            no.EventHandlerInfo.execute(this.onPositionChange, this._targetNode.position.clone());
        } 
        // 旋转变化分支（使用欧拉角便于直接使用）
        else if (type & Node.TransformBit.ROTATION) {
            no.EventHandlerInfo.execute(this.onRotationChange, this._targetNode.eulerAngles.clone());
        } 
        // 缩放变化分支
        else if (type & Node.TransformBit.SCALE) {
            no.EventHandlerInfo.execute(this.onScaleChange, this._targetNode.scale.clone());
        }
    }
}