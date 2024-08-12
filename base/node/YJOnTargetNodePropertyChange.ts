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
    @property
    targetNodeType: string = '';
    @property(no.EventHandlerInfo)
    onPositionChange: no.EventHandlerInfo[] = [];
    @property(no.EventHandlerInfo)
    onRotationChange: no.EventHandlerInfo[] = [];
    @property(no.EventHandlerInfo)
    onScaleChange: no.EventHandlerInfo[] = [];

    private _targetNode: Node = null;

    onLoad() {
        this._targetNode = no.nodeTargetManager.get<YJNodeTarget>(this.targetNodeType)?.node;
        if (this._targetNode) {
            this._targetNode.on(Node.EventType.TRANSFORM_CHANGED, this.onPropertyChange, this);
        }
    }

    onDestroy() {
        if (this._targetNode) {
            this._targetNode.off(Node.EventType.TRANSFORM_CHANGED, this.onPropertyChange, this);
        }
    }

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