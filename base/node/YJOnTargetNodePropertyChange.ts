import { no } from "../../no";
import { ccclass, Component, property, Node } from "../../yj";
import { YJNodeTarget } from "./YJNodeTarget";
/**
 * 
 * Author mqsy_yj
 * DateTime Mon Aug 12 2024 17:13:40 GMT+0800 (中国标准时间)
 * 当目标节点属性改变时
 */

@ccclass('YJOnTargetNodePropertyChange')
export class YJOnTargetNodePropertyChange extends Component {
    /** 目标节点在nodeTargetManager中注册的标识 */
    @property
    targetNodeType: string = '';
    /** 当目标节点位置改变时触发的事件 */
    @property(no.EventHandlerInfo)
    onPositionChange: no.EventHandlerInfo[] = [];
    /** 当目标节点旋转改变时触发的事件 */
    @property(no.EventHandlerInfo)
    onRotationChange: no.EventHandlerInfo[] = [];
    /** 当目标节点缩放改变时触发的事件 */
    @property(no.EventHandlerInfo)
    onScaleChange: no.EventHandlerInfo[] = [];

    /** 目标节点引用 */
    private _targetNode: Node = null;

    /** 组件加载时获取目标节点并注册属性变化监听 */
    onLoad() {
        this._targetNode = no.nodeTargetManager.get<YJNodeTarget>(this.targetNodeType)?.node;
        if (this._targetNode) {
            this._targetNode.on(Node.EventType.TRANSFORM_CHANGED, this.onPropertyChange, this);
        }
    }

    /** 组件销毁时移除属性变化监听 */
    onDestroy() {
        if (this._targetNode) {
            this._targetNode.off(Node.EventType.TRANSFORM_CHANGED, this.onPropertyChange, this);
        }
    }

    /**
     * 处理目标节点属性变化
     * @param type 变化的属性类型
     */
    private onPropertyChange(type: number) {
        if (type & Node.TransformBit.POSITION) {
            no.EventHandlerInfo.execute(this.onPositionChange, this._targetNode.position.clone());
        } else if (type & Node.TransformBit.ROTATION) {
            no.EventHandlerInfo.execute(this.onRotationChange, this._targetNode.eulerAngles.clone());
        } else if (type & Node.TransformBit.SCALE) {
            no.EventHandlerInfo.execute(this.onScaleChange, this._targetNode.scale.clone());
        }
    }
}