/**
 * 
 * Author mqsy_yj
 * DateTime Mon Feb 09 2026 15:51:31 GMT+0800 (中国标准时间)
 *
 */

import { FixedSizeArray } from "@hackUi/FixedSizeArray";
import { nodeUtils } from "@hackUi/ui/assemble/nodeUtils";
import { BlockInputEvents, Button, Node, UIOpacity } from "@hackUi/yj";

/**
 * 节点对象缓存池（支持类型分类存储与获取）
 * @remarks
 * - 实现节点对象的复用管理
 * - 自动处理节点的可见性与交互状态
 * - 内置缓存过期时间记录（可通过扩展实现自动清理）
 * 
 * @example
 * // 从缓存池获取子弹节点
 * const bullet = nodePool.get('bullet');
 * if (!bullet) {
 *   bullet = instantiate(bulletPrefab);
 * }
 * 
 * // 回收使用完毕的敌人节点
 * nodePool.put('enemy', deadEnemyNode);
 */
export class NodePool {
    private cacheMap: Map<string, FixedSizeArray<Node>>;
    private static _ins: NodePool = null;

    /** 获取缓存池单例实例 */
    public static ins(): NodePool {
        if (!this._ins) this._ins = new NodePool();
        return this._ins;
    }

    constructor() {
        this.cacheMap = new Map<string, FixedSizeArray<Node>>();
    }

    /**
     * 从缓存池获取节点对象
     * @param type - 节点类型标识符
     * @returns 可用节点对象或null,需要手动设置父节点
     * @example
     * // 获取UI弹窗节点
     * const popup = nodePool.get('settingsPopup');
     */
    public get(type: string): Node {
        if (this.cacheMap.has(type)) {
            let cache = this.cacheMap.get(type).shift();
            if (!cache) {
                return null;
            }
            if (!cache.isValid) {
                cache.destroy();
                cache = null;
                return this.get(type);
            }
            // this._visible(cache, true);
            nodeUtils.visible(cache, true);
            return cache;
        }
        return null;
    }

    /**
     * 存放节点对象到缓存池
     * @param type - 节点类型标识符
     * @param node - 要缓存的节点实例
     * @example
     * // 缓存过关奖励弹窗
     * nodePool.put('levelRewardPopup', rewardPopup);
     */
    public put(type: string, node: Node) {
        // this._visible(node, false);
        nodeUtils.visible(node, false);
        //从节点树中移除，减少渲染遍历开销
        node.parent = null;
        if (!this.cacheMap.has(type)) {
            this.cacheMap.set(type, new FixedSizeArray<Node>(100));
        }
        this.cacheMap.get(type).push(node);
    }

    /** 根据类型清空缓存节点 */
    public clearByType(type: string) {
        if (this.cacheMap.has(type)) {
            const v = this.cacheMap.get(type);
            for (let i = 0; i < v.length(); i++) {
                v.get(i)?.destroy();
            }
            this.cacheMap.delete(type);
        }
    }

    /** 清空所有缓存节点 */
    public clear() {
        this.cacheMap.forEach((v, k) => {
            this.clearByType(k)
        });
        this.cacheMap.clear();
    }

    /**
     * 控制节点可见性与交互状态
     * @param node - 要操作的节点
     * @param v - 是否可见/可交互
     */
    private _visible(node: Node, v: boolean) {
        const blockInputEvents = node.getComponentsInChildren(BlockInputEvents);
        if (blockInputEvents)
            for (let i = 0; i < blockInputEvents.length; i++) {
                blockInputEvents[i].enabled = v;
            }
        const btn = node.getComponent(Button);
        if (btn) btn.interactable = v;
        if (node.parent) {
            if (!v) {
                const opacityCmp = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
                opacityCmp.opacity = 0;
                if (node['__origin_x__'] == null) {
                    node['__origin_x__'] = nodeUtils.x(node);
                }
                nodeUtils.x(node, 20000);
            } else {
                node.getComponent(UIOpacity).opacity = 255;
                if (node['__origin_x__'] !== null) {
                    nodeUtils.x(node, node['__origin_x__']);
                }
            }
        }
    }
}

/** 全局节点缓存池实例 */
export const nodePool = NodePool.ins();