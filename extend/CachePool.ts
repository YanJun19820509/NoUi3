/**
 * 
 * Author mqsy_yj
 * DateTime Mon Feb 09 2026 15:57:56 GMT+0800 (中国标准时间)
 *
 */

import { no } from "@hackUi/no";
import { nodeUtils } from "@hackUi/ui/assemble/nodeUtils";
import { Asset, Node } from "@hackUi/yj";

/** 
     * 对象缓存池系统（支持节点和资源缓存）
     * @example
     * // 缓存敌人预制体
     * const enemy = cachePool.reuse<Prefab>('enemy_prefab');
     * if (!enemy) {
     *     assetBundleManager.loadAny({url: 'assets/enemy.prefab'}, (p) => {
     *         cachePool.recycle('enemy_prefab', p);
     *     });
     * }
     * 
     * // 缓存网络请求数据
     * cachePool.recycle('player_data', apiResponse, false);
     */
export class CachePool {
    private cacheMap: Map<string, { o: any, t: number }[]>;
    private checkDuration = 60000;
    constructor() {
        this.cacheMap = new Map<string, any[]>();
        setInterval(() => {
            this.checkClear();
        }, this.checkDuration / 2);
    }

    /**
     * 从缓存池获取可重用对象
     * @param type 缓存类型标识符（如：'bullet_node'/'enemy_prefab'）
     * @returns 缓存对象或null
     * @example
     * // 获取子弹节点
     * const bullet = cachePool.reuse<Node>('bullet_node');
     * if (bullet) this.fireBullet(bullet);
     */
    public reuse<T>(type: string): T | null {
        if (!this.cacheMap.has(type)) return null;
        let a = this.cacheMap.get(type).pop();
        if (!a) return null;
        return a.o as T;
    }

    /**
     * 回收对象到缓存池
     * @param type 缓存类型标识符
     * @param object 要回收的对象（支持节点/资源/普通对象）
     * @param canRelease 是否允许自动释放（设为false可长期保留重要资源）
     * @param changeParent 是否重置父节点（解决节点树残留问题）
     * @example
     * // 回收敌人节点
     * onEnemyDie(enemy: Node) {
     *     cachePool.recycle('enemy_node', enemy, true, false);
     * }
     * 
     * // 回收临时纹理资源
     * cachePool.recycle('temp_texture', texture, false);
     */
    public recycle(type: string, object: any, canRelease = true, changeParent = true): void {
        if (type == null || type == '') {
            no.log(`${object.name}未指定回收类型，不做回收处理，直接销毁`);
            this._clear(object);
            return;
        }
        if (!this.cacheMap.has(type)) this.cacheMap.set(type, []);
        if (object instanceof Node) {
            if (changeParent)
                object.parent = null;
            nodeUtils.visible(object, false);
        }
        let a = this.cacheMap.get(type) || [];
        let have = false;
        for (let i = 0, n = a.length; i < n; i++) {
            let b = a[i];
            if ((object._uuid && b.o._uuid == object._uuid) || (object._uuid && b.o._uuid == object._uuid)) {
                have = true;
                break;
            }
        }
        if (have) return;
        a.push({
            o: object,
            t: no.sysTime.now + (canRelease ? 0 : 999999)
        });
        this.cacheMap.set(type, a);
    }

    /**
     * 获取指定类型可用缓存数量
     * @param type 缓存类型标识符
     * @example
     * // 检查子弹缓存是否充足
     * if (cachePool.canReuseNumber('bullet') < 10) {
     *     this.preloadBullets();
     * }
     */
    public canReuseNumber(type: string): number {
        return (this.cacheMap.get(type) || []).length;
    }

    /**
     * 清空所有缓存（切换场景时建议调用）
     * @example
     * // 切换关卡时清理
     * onLevelChange() {
     *     cachePool.clearAll();
     * }
     */
    public clearAll(): void {
        let types = no.MapKeys2Array(this.cacheMap);
        let n = types.length;
        for (let i = 0; i < n; i++) {
            this.clear(types[i]);
        }
    }

    /**
     * 清理指定类型缓存
     * @param type 缓存类型标识符
     * @example
     * // 清理过期的对话缓存
     * cachePool.clear('dialogue_data');
     */
    public clear(type: string): void {
        let arr = this.cacheMap.get(type);
        if (!arr) return;
        this.cacheMap.delete(type);
        for (let i = arr.length - 1; i >= 0; i--) {
            let a = arr[i];
            this._clear(a.o);
        }
    }

    /** 内部清理方法 */
    private _clear(obj: any): void {
        if (obj instanceof Node) obj.destroy();
        else if (obj instanceof Asset) no.assetBundleManager.release(obj);
        else obj = null;
    }

    /** 定时检查过期缓存 */
    private checkClear() {
        let t = no.timestamp();
        let types = no.MapKeys2Array(this.cacheMap);
        for (let j = 0; j < types.length; j++) {
            let type = types[j];
            let arr = this.cacheMap.get(type) || [];
            for (let i = arr.length - 1; i >= 0; i--) {
                let a = arr[i];
                if (t - a.t >= this.checkDuration) {
                    arr.splice(i, 1);
                    this._clear(a.o);
                }
            }
            if (arr.length == 0) this.cacheMap.delete(type);
        }
    }
}
/**全局缓存池,适用于非节点数据或节点的父节点不固定的情况，如果是节点且其父节点固定，用全局缓存池会导致dc增加 */
export const cachePool = new CachePool();