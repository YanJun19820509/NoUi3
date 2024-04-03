import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
/**
 * 适用于解决当YJShowHideAllSubRenderNode显示所有节点时，部分节点显示异常的情况，配合YJOnVisibleChange来使用
 */
@ccclass('YJReactiveNode')
export class YJReactiveNode extends Component {
    public a_reactive() {
        this.node.active = false;
        this.node.active = true;
    }
}


