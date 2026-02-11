/**
 * 临时数据类型，用于存储临时数据，避免频繁创建和销毁，仅针对临时的Object、Array变量
 */

import { FixedSizeArray } from "./FixedSizeArray";

export class YJTempData {
    private static _arrays: Map<string, FixedSizeArray<any>> = new Map();
    private static _objects: Map<string, { [key: string]: any } | any> = new Map();
    private static _maps: Map<string, Map<any, any>> = new Map();
    private static _funs: Map<string, { f: Function, args: any[] }> = new Map();

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
     * 给临时对象赋值
     * @param name 对象名称
     * @param v 值（KV），赋值完后会置为null
     * @returns 
     */
    public static setObject(name: string, v: any) {
        const o = this.object(name);
        for (const k in v) {
            o[k] = v[k];
        }
        v = null;
        return o;
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
     * 设置临时函数
     * @param name 函数名
     * @param f 函数体
     */
    public static fun(name: string, f: Function, ...args: any[]) {
        this._funs.set(name, { f, args });
    }

    /**
     * 是否存在临时函数
     * @param name 函数名
     * @returns 是否存在
     */
    public static hasFun(name: string): boolean {
        return this._funs.has(name);
    }

    /**
     * 执行临时函数
     * @param name 函数名
     * @param args1 参数
     * @returns 是否执行成功
     */
    public static runFun(name: string, ...args1: any[]) {
        if (!this._funs.has(name)) return false;
        const { f, args } = this._funs.get(name);
        f(...args, ...args1);
        return true;
    }

    /**
     * 执行临时函数并清除
     * @param name 函数名
     * @param args1 参数
     * @returns 是否执行成功
     */
    public static runFunAndClear(name: string, ...args1: any[]) {
        return this.runFun(name, ...args1) && this.clearFun(name);
    }

    /**
     * 清空临时函数
     * @param name 函数名
     */
    public static clearFun(name: string) {
        if (!this._funs.has(name)) return;
        let f = this._funs.get(name);
        f.f = null;
        f.args = null;
        f = null;
        this._funs.delete(name);
    }

    /**
     * 临时回调函数，用于避免闭包长时间持有外部变量，导致内存泄漏
     * @param cb 回调函数
     * @param args 参数
     * @returns 临时回调函数
     */
    public static tempCb(cb: Function, ...args: any[]) {
        let f = (...args1: any[]) => {
            cb(...args, ...args1);
            cb = null;
            f = null;
        }
        return f;
    }

    /**
     * 清除所有临时数据
     */
    public static clear() {
        this._arrays.forEach(v => v?.clear());
        this._objects.forEach(v => v = null);
        this._maps.forEach(v => v?.clear());
        this._funs.forEach((v, k) => this.clearFun(k));
        this._arrays.clear();
        this._objects.clear();
        this._maps.clear();
        this._funs.clear();
    }
}