import { ccclass, Component, EDITOR, executeInEditMode, Node, property, v3 } from "NoUi3/yj";
import { YJOutOfViewManager } from "./YJOutOfViewManager";
import { YJDataWork } from "../YJDataWork";
import { no } from "NoUi3/no";
/**
 * 
 * Author mqsy_yj
 * DateTime Wed Oct 30 2024 20:51:54 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJOutOfViewNode')
@executeInEditMode()
export class YJOutOfViewNode extends Component {
    /** 管理器节点引用 */
    @property({ type: Node })
    managerNode: Node = null;

    onLoad() {
        if (EDITOR) {
            this.managerNode = no.getComponentInParents(this.node, YJOutOfViewManager).node;
        }
    }

    /** 组件启用时将自身添加到管理器中 */
    onEnable() {
        this.scheduleOnce(() => {
            this.managerNode?.getComponent(YJOutOfViewManager)?.addOutOfViewNode(this);
        }, .1);
    }

    /** 组件禁用时从管理器中移除自身 */
    onDisable() {
        this.managerNode?.getComponent(YJOutOfViewManager)?.removeOutOfViewNode(this);
    }

    /**
     * 设置节点是否可见
     * @param visible 是否可见
     */
    public setVisible(visible: boolean) {
        this.node['_activeInHierarchy'] = visible;
    }

    /**
     * 获取节点位置
     * @returns 节点位置向量
     */
    public position() {
        // 优先从数据组件中获取位置信息
        const data = this.getComponent(YJDataWork)?.data,
            pos = data?.pos || data?.position;
        if (pos) {
            return v3(pos[0], pos[1]);
        }
        // 如果数据组件中没有位置信息，则返回节点实际位置
        return no.position(this.node);
    }
}