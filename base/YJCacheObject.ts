
import { ccclass, property, menu, Component, Node } from '../yj';
import { no } from '../no';

/**
 * Predefined variables
 * Name = YJCacheObject
 * DateTime = Fri Jan 14 2022 17:52:43 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCacheObject.ts
 * FileBasenameNoExtension = YJCacheObject
 * URL = db://assets/Script/NoUi3/base/YJCacheObject.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJCacheObject')
@menu('NoUi/base/YJCacheObject(缓存对象)')
/**
 * 对象缓存组件
 * @class 用于游戏对象的缓存和回收管理，支持自动回收和手动回收两种模式
 * @remarks 通过缓存池实现对象复用，提升游戏性能
 * @example
 * // 编辑器配置示例：
 * // - 回收类型: bullet
 * // - 禁用时回收: true
 * // - 需要释放: false
 * 
 * @example
 * // 代码调用示例：
 * const cache = this.getComponent(YJCacheObject);
 * cache.recycle();
 */
export class YJCacheObject extends Component {
    /** 缓存池类型标识，对应缓存池的键值 */
    @property({ displayName: '回收类型' })
    recycleType: string = '';
    
    /** 是否在组件禁用时自动回收对象 */
    @property
    recycleOnDisable: boolean = false;
    
    /** 回收时是否彻底释放资源（否则只是放回缓存池） */
    @property({ displayName: '需要释放' })
    needRelease: boolean = true;

    /** 回收状态标记，防止重复回收 */
    private _recycled: boolean = false;

    /** 组件启用时重置回收状态 */
    onEnable() {
        this._recycled = false;
    }

    /** 组件禁用时根据配置执行自动回收 */
    onDisable() {
        this.recycleOnDisable && !this._recycled && this.recycle();
    }

    /**
     * 手动执行对象回收
     * @method 将对象回收到指定类型的缓存池
     * @param {string} recycleType - 缓存池类型标识（可选，默认使用组件配置的类型）
     */
    public recycle(): void {
        if (!this.enabled) return;
        this._recycled = true;
        no.cachePool.recycle(this.recycleType, this.node, this.needRelease);
    }
}
