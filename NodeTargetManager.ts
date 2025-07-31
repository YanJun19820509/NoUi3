import { YJNodeTarget } from "./base/node/YJNodeTarget";

/** 
     * 节点管理类（支持树状节点结构管理）
     * @example
     * // 注册UI根节点
     * nodeTargetManager.register('ui_root', this.uiNode);
     * 
     * // 注册玩家角色节点
     * nodeTargetManager.register('player', this.playerController);
     */
class NodeTargetManager {

    private targetMap: Map<string, any> = new Map();

    /**
     * 注册节点到管理器
     * @param type - 节点类型标识（如：'ui_root'/'player'）
     * @param target - 要注册的节点或组件
     * @example
     * // 注册任务追踪组件
     * nodeTargetManager.register('quest_tracker', this.questComponent);
     */
    public register(type: string, target: any) {
        if (type == null || type == '' || target == null) return;
        this.targetMap.set(type, target);
    }

    /**
     * 获取已注册的节点/组件
     * @param type - 注册时使用的类型标识
     * @returns 对应的节点或组件
     * @example
     * // 获取UI管理器
     * const uiManager = nodeTargetManager.get<UIManager>('ui_mgr');
     * 
     * // 获取玩家控制器
     * const player = nodeTargetManager.get<PlayerController>('player');
     */
    public get<T>(type: string): T {
        if (type == null || type == '') return null;
        if (!this.targetMap.has(type)) return null;
        return this.targetMap.get(type) as T;
    }

    /**
     * 移除已注册的节点（通过UUID校验安全移除）
     * @param type - 注册类型标识
     * @param target - 要移除的目标对象
     * @example
     * // 安全移除玩家节点
     * nodeTargetManager.remove('player', this.playerController);
     */
    public remove(type: string, target: any) {
        if (type == null || type == '' || target == null) return;
        if (this.targetMap.has(type)) {
            let a = this.targetMap.get(type);
            if (a['uuid'] == target['uuid'])
                this.targetMap.delete(type);
        }
    }

    /**
     * 递归获取子节点组件（支持路径查找和组件筛选）
     * @param type - 起始节点类型标识
     * @param subs - 子节点路径数组（支持索引或组件名）
     * @returns 找到的节点组件
     * @example
     * // 查找技能按钮组件
     * const skillBtn = nodeTargetManager.getSub<Button>('hud', ['skill_panel', '0', 'btn_attack']);
     * 
     * // 查找任务列表项
     * const questItem = nodeTargetManager.getSub<QuestItem>('quest_list', ['scrollview', 'item_123']);
     */
    public getSub<T>(type: string, subs: string[]): T {
        let target = this.get<any>(type);
        if (!target) return null;
        let sub = subs.shift();
        if (!isNaN(Number(sub)))
            target = target.node.children[sub]?.getComponentsInChildren(YJNodeTarget)[0];
        else if (subs.length == 0) {
            let arr = target.node.getComponentsInChildren(YJNodeTarget);
            for (let i = 0, n = arr.length; i < n; i++) {
                if (arr[i].subType == sub) {
                    return arr[i];
                }
            }
        }
        if (subs.length == 0) return target;
        return this.getSub<T>(sub, subs);
    }
}

export const nodeTargetManager = new NodeTargetManager();