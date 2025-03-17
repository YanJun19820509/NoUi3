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
/**
 * 视野外节点管理组件
 * @remarks
 * 功能特性：
 * - 自动关联视野管理器
 * - 提供节点显隐控制接口
 * - 支持数据驱动的位置获取
 * @example
 * // 典型应用场景：
 * // - 需要动态加载/卸载的大型场景元素
 * // - 需要优化性能的静态背景元素
 * // - 需要根据位置切换显示状态的UI元素
 */
export class YJOutOfViewNode extends Component {
    /** 
     * 管理器节点引用 
     * @property {Node} managerNode - 自动查找或手动指定的YJOutOfViewManager所在节点
     * @example
     * // 编辑器自动查找：
     * // 当节点在YJOutOfViewManager节点层级下时自动关联
     * 
     * // 手动指定：
     * // 将管理节点拖拽到该属性栏进行关联
     */
    @property({ type: Node })
    managerNode: Node = null;

    /**
     * 组件加载时自动查找管理器
     * @remarks 仅在编辑器模式下运行，用于开发时自动建立关联
     * @example
     * // 当节点结构为：
     * // SceneManager (YJOutOfViewManager)
     * //   └─ City
     * //       └─ Building (YJOutOfViewNode)
     * // 会自动将SceneManager节点关联到Building的managerNode属性
     */
    onLoad() {
        if (EDITOR) {
            this.managerNode = no.getComponentInParents(this.node, YJOutOfViewManager).node;
        }
    }

    /** 
     * 组件启用时将自身添加到管理器中
     * @remarks 使用延迟添加确保管理器完成初始化
     * @example
     * // 当动态生成NPC时：
     * const npc = instantiate(npcPrefab);
     * npc.addComponent(YJOutOfViewNode);
     * npc.active = true; // 自动触发onEnable加入管理
     */
    onEnable() {
        this.scheduleOnce(() => {
            this.managerNode?.getComponent(YJOutOfViewManager)?.addOutOfViewNode(this);
        }, .1);
    }

    /** 
     * 组件禁用时从管理器中移除自身
     * @example
     * // 当NPC被销毁时：
     * npc.active = false; // 触发onDisable从管理移除
     * destroy(npc);
     */
    onDisable() {
        this.managerNode?.getComponent(YJOutOfViewManager)?.removeOutOfViewNode(this);
    }

    /**
     * 设置节点是否可见
     * @param visible 是否可见
     * @remarks 直接控制节点在层级中的激活状态，不修改active属性
     * @example
     * // 手动控制建筑物显隐：
     * building.getComponent(YJOutOfViewNode).setVisible(false);
     */
    public setVisible(visible: boolean) {
        this.node['_activeInHierarchy'] = visible;
    }

    /**
     * 获取节点位置
     * @returns 节点位置向量
     * @remarks 优先从YJDataWork组件获取数据驱动的位置信息
     * @example
     * // 数据组件配置示例：
     * // dataWork.data = { 
     * //   pos: [120, 360], // 使用数据驱动的位置
     * //   ...其他数据
     * // }
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