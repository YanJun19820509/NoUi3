/**
 * 临时数据类型，用于存储临时数据，避免频繁创建和销毁，仅针对临时的Object、Array变量
 */

import { FixedSizeArray } from "./FixedSizeArray";

export class YJTempData {
    private static _arrays: Map<string, FixedSizeArray<any>> = new Map();
    private static _objects: Map<string, { [key: string]: any }> = new Map();
    private static _maps: Map<string, Map<any, any>> = new Map();

    /**
     * 获取临时对象
     * @param name 对象名称
     * @returns 临时对象
     */
    public static object(name: string, v?: any) {
        if (!this._objects.has(name)) {
            this._objects.set(name, v || {});
        }
        return this._objects.get(name);
    }

    /**
     * 获取临时数组
     * @param name 数组名称
     * @param initialCapacity 初始容量
     * @returns 临时数组
     */
    public static array<T>(name: string, initialCapacity = 10): FixedSizeArray<T> {
        if (!this._arrays.has(name)) {
            this._arrays.set(name, new FixedSizeArray<T>(initialCapacity));
        }
        return this._arrays.get(name) as FixedSizeArray<T>;
    }

    /**
     * 获取临时map
     * @param name map名称
     * @returns 
     */
    public static map<K, T>(name: string) {
        if (!this._maps.has(name)) {
            this._maps.set(name, new Map<K, T>());
        }
        return this._maps.get(name) as Map<K, T>;
    }

    /**
     * 清除所有临时数据
     */
    public static clear() {
        this._arrays.forEach(v => v?.clear());
        this._objects.forEach(v => v = null);
        this._maps.forEach(v => v?.clear());
        this._arrays.clear();
        this._objects.clear();
        this._maps.clear();
    }
}