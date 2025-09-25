/**
 * 临时数据类型，用于存储临时数据，避免频繁创建和销毁，仅针对临时的Object、Array变量
 */

import { FixedSizeArray } from "./FixedSizeArray";

class TempObject {
    private _data: any;

    constructor() {
        this._data = {};
    }

    public set(key: string, value: any) {
        this._data[key] = value;
        return this;
    }

    public get(key: string) {
        return this._data[key];
    }
}

class TempArray<T> {
    private _data: FixedSizeArray<T>;

    constructor() {
        this._data = new FixedSizeArray<T>(10);
    }
    public push(v: T) {
        this._data.push(v);
        return this;
    }
    public shift() {
        return this._data.shift();
    }
    public all(): FixedSizeArray<T> {
        return this._data;
    }
    public set(index: number, v: T) {
        this._data.set(index, v);
        return this;
    }
    public get(index: number): T {
        return this._data[index];
    }
    public size() {
        return this._data.length();
    }
    public includes(v: T) {
        return this._data.indexOf(v) > -1;
    }
    public clear() {
        this._data.clear();
        return this;
    }
}
export class YJTempData {
    private static _arrays: Map<string, TempArray<any>> = new Map();
    private static _objects: Map<string, TempObject> = new Map();

    public static object(name: string) {
        if (!this._objects.has(name)) {
            this._objects.set(name, new TempObject());
        }
        return this._objects.get(name);
    }

    public static array<T>(name: string): TempArray<T> {
        if (!this._arrays.has(name)) {
            this._arrays.set(name, new TempArray<T>());
        }
        return this._arrays.get(name) as TempArray<T>;
    }

    public static clear() {
        this._arrays.forEach(v => v = null);
        this._objects.forEach(v => v = null);
        this._arrays.clear();
        this._objects.clear();
    }
}