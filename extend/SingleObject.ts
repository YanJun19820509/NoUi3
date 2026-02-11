/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 12:06:07 GMT+0800 (中国标准时间)
 *
 */



/**
 * 单例模式基类（需继承使用）
 * @remarks
 * 通过继承实现具体单例类，需在子类中实现clear方法
 * @example
 * // 创建配置管理器单例
 * class ConfigManager extends SingleObject {
 *   private _configs: Map<string, any> = new Map();
 * 
 *   static getInstance() {
 *     return this.instance() as ConfigManager;
 *   }
 * 
 *   // 实现清理逻辑
 *   clear() {
 *     this._configs.clear();
 *   }
 * }
 * //单例扩展：在instance方法中传入不同的key，可以实现不同的单例实例
 */
export class SingleObject {
    /** 单例表 */
    private static _insMap: { [key: string]: { [key: string]: SingleObject } } = {};

    private static get objectName() {
        return this['_singleObjectName'];
    }

    /**
     * 获取单例实例（需在子类中包装此方法）
     * @returns 单例实例
     */
    protected static instance(): SingleObject;
    protected static instance(key: string): SingleObject
    protected static instance(key?: string): SingleObject {
        key = key || '_';
        const name = this.objectName;
        if (!this._insMap[name]) this._insMap[name] = {};
        if (!this._insMap[name][key]) this._insMap[name][key] = new this();
        return this._insMap[name][key];
    }

    /**
     * 销毁单例实例
     * @param key 实例key
     */
    public static destroy(key?: string) {
        key = key || '_';
        const name = this.objectName;
        if (this._insMap[name]) {
            this._insMap[name][key]?.clear();
            this._insMap[name][key] = null;
        }
    }

    public static destroyAll() {
        const name = this.objectName;
        if (this._insMap[name]) {
            const keys = Object.keys(this._insMap[name]);
            for (let i = 0, n = keys.length; i < n; i++) {
                this.destroy(keys[i]);
            }
        }
    }

    /** 
     * 清理单例数据（由管理器调用）
     * @remarks
     * 子类需重写此方法实现具体清理逻辑
     */
    public clear() { }
}

/**
 * 单例对象生命周期管理器
 * @remarks
 * 统一管理所有注册的单例对象，提供批量清理功能
 * @example
 * // 注册单例类
 * SingleObjectManager.register(ConfigManager);
 * 
 * // 游戏切换场景时清理所有单例
 * SingleObjectManager.clear();
 */
export class SingleObjectManager {
    /** 已注册的单例类列表 */
    private static _singleObjects: { [key: string]: Function[] } = {};

    /**
     * 注册需要管理的单例类
     * @param singleObject - 继承自SingleObject的类
     */
    public static register(type: string, singleObject: Function) {
        if (!this._singleObjects[type]) this._singleObjects[type] = [];
        this._singleObjects[type].push(singleObject);
    }

    /**
     * 清理所有注册的单例实例
     * @remarks
     * 遍历所有注册的单例类，调用其clear方法并重置实例
     */
    public static clear(type: string) {
        const arr = this._singleObjects[type];
        if (arr) {
            for (let i = 0, n = arr.length; i < n; i++) {
                arr[i]['destroyAll']?.();
            }
        }
    }

    /**
     * 清理所有注册的单例实例
     * @remarks
     * 遍历所有注册的单例类，调用其clear方法并重置实例
     */
    public static clearAll() {
        for (const key in this._singleObjects) {
            this.clear(key);
        }
    }
}