/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 11:03:15 GMT+0800 (中国标准时间)
 *
 */

import { mathUtils } from "./mathUtils";

export namespace arrayUtils {


    export function toArray(v: any) {
        if (!v) return [];
        if (v instanceof Array) return v;
        let t = [].concat(v);
        return t;
    }

    /**
     * 将一维数组分割为二维数组
     * @param array 原始数组
     * @param num 每个子数组的最大长度
     * @returns 二维数组
     * @example
     * // 分页处理数据
     * const data = [1,2,3,4,5];
     * const paged = no.arrayToArrays(data, 2); // 返回 [[1,2],[3,4],[5]]
     * // 矩阵转换
     * const matrix = no.arrayToArrays([1,2,3,4,5,6], 3); // 返回 [[1,2,3],[4,5,6]]
     */
    export function arrayToArrays(array: any[], num: number): any[] {
        if (!array) return [];
        if (!num) return array;
        var dd = [];
        let length = mathUtils.ceil(array.length / num);
        for (var ii = 0; ii < length; ii++) {
            dd[ii] = [];
            for (var jj = 0; jj < num; jj++) {
                if (array[ii * num + jj] == undefined) continue;
                dd[ii][jj] = array[ii * num + jj];
            }
        }
        return dd;
    };

    /**
     * 在对象数组中查找元素索引
     * @param array 目标数组
     * @param item 要查找的元素（可以是对象或属性值）
     * @param key 用于比较的对象属性名
     * @returns 元素索引，未找到返回-1
     * @example
     * // 查找用户ID为3的索引
     * const users = [{id:1,name:'A'}, {id:2,name:'B'}, {id:3,name:'C'}];
     * const index = no.indexOfArray(users, 3, 'id'); // 返回2
     * // 查找完整对象
     * const target = {id:2,name:'B'};
     * const index2 = no.indexOfArray(users, target, 'id'); // 返回1
     */
    export function indexOfArray(array: any[], item: any, key: string): number {
        if (array == null || item == null) return -1;
        for (let i = 0, n = array.length; i < n; i++) {
            let a = array[i];
            if (a[key] == item || a[key] == item[key]) {
                return i;
            }
        }
        return -1;
    }

    /**
     * 在对象数组中查找元素对象
     * @template T 返回类型
     * @param array 目标数组
     * @param value 要查找的值（可以是对象或属性值）
     * @param key 用于比较的对象属性名
     * @returns 找到的元素对象，未找到返回null
     * @example
     * // 查找用户ID为2的用户对象
     * const user = no.itemOfArray(users, 2, 'id'); // 返回 {id:2,name:'B'}
     * // 使用对象查找
     * const partialUser = {id:3};
     * const found = no.itemOfArray(users, partialUser, 'id'); // 返回 {id:3,name:'C'}
     */
    export function itemOfArray<T>(array: any[], value: any, key: string): T {
        if (array == null || value == null || key == null) return null as T;
        for (let i = 0, n = array.length; i < n; i++) {
            const a = array[i];
            if (!a) continue;
            if (a[key] == value || a[key] == value[key]) {
                return a as T;
            }
        }
        return null as T;
    }

    /**
     * 检查数组是否包含另一个数组的任意元素
     * @param array 主数组
     * @param other 要检查的数组
     * @returns 是否包含任意元素
     * @example
     * // 检查权限
     * const userRoles = ['admin', 'editor'];
     * const requiredRoles = ['viewer', 'editor'];
     * const hasAccess = no.isArrayIncludeOther(userRoles, requiredRoles); // 返回true
     */
    export function isArrayIncludeOther(array: any[], other: any[]): boolean {
        for (let i = 0, n = other.length; i < n; i++) {
            if (array.indexOf(other[i]) > -1) return true;
        }
        return false;
    }

    /**
     * 获取两个数组的交集
     * @param array 主数组
     * @param other 要比较的数组
     * @returns 包含共同元素的新数组
     * @example
     * // 获取共同好友
     * const myFriends = ['Alice', 'Bob', 'Charlie'];
     * const yourFriends = ['Bob', 'David', 'Eve'];
     * const common = no.arrayIncludeOther(myFriends, yourFriends); // 返回 ['Bob']
     */
    export function arrayIncludeOther(array: any[], other: any[]): any[] {
        let arr: any[] = [];
        for (let i = 0, n = other.length; i < n; i++) {
            if (array.indexOf(other[i]) > -1) arr[arr.length] = other[i];
        }
        return arr;
    }

    /**
     * 向数组添加元素（支持唯一性检查）
     * @param array 目标数组
     * @param value 要添加的值
     * @param key 唯一性检查的属性名（可选）
     * @returns 是否添加成功
     * @example
     * // 添加唯一用户
     * const users = [];
     * no.addToArray(users, {id:1,name:'A'}, 'id'); // 返回true
     * no.addToArray(users, {id:1,name:'B'}, 'id'); // 返回false
     * 
     * // 普通添加
     * const numbers = [1,2,3];
     * no.addToArray(numbers, 4); // 返回true
     */
    export function addToArray(array: any[], value: any, key?: string): boolean {
        if (!array) return false;
        if (key == null && array.indexOf(value) == -1) {
            array[array.length] = value;
            return true;
        } else if (key != null && indexOfArray(array, value, key) == -1) {
            array[array.length] = value;
            return true;
        }
        return false;
    }

    /**
     * 向数组末尾追加元素
     * @param array 目标数组
     * @param value 要添加的值
     * @example
     * // 记录日志
     * const log = [];
     * no.pushToArray(log, 'error1');
     * no.pushToArray(log, 'error2'); // log: ['error1', 'error2']
     */
    export function pushToArray(array: any[], value: any): void {
        if (!array) return;
        if (value == null) return;
        array[array.length] = value;
    }

    /**
     * 从数组中移除元素
     * @param array 目标数组
     * @param value 要移除的值（可以是对象或属性值）
     * @param key 对象属性名（可选）
     * @example
     * // 移除用户
     * const users = [{id:1}, {id:2}];
     * no.removeFromArray(users, 1, 'id'); // 移除id=1的用户
     * 
     * // 移除普通元素
     * const nums = [10,20,30];
     * no.removeFromArray(nums, 20); // nums变为[10,30]
     */
    export function removeFromArray(array: any[], value: any, key?: string): void {
        let i = -1;
        if (key == null) {
            i = array.indexOf(value);
        } else {
            i = indexOfArray(array, value, key);
        }
        if (i > -1) array.splice(i, 1);
        else {
            // console.log('removeFromArray fail', value);
        }
    }

    /**
     * 将Map的键转换为数组
     * @template K 键类型
     * @template T 值类型
     * @param map 源Map对象
     * @returns 键数组
     * @example
     * // 获取玩家ID列表
     * const players = new Map([[1, 'A'], [2, 'B']]);
     * const ids = no.MapKeys2Array(players); // 返回 [1,2]
     */
    export function MapKeys2Array<K, T>(map: Map<K, T>): K[] {
        let a: K[] = [];
        let keys = map.keys();
        let b = keys.next();
        while (!b.done) {
            a[a.length] = b.value;
            b = keys.next();
        }
        return a;
    }

    /**
     * 将Map的值转换为数组
     * @template K 键类型
     * @template T 值类型
     * @param map 源Map对象
     * @returns 值数组
     * @example
     * // 获取玩家得分列表
     * const scores = new Map([['A', 100], ['B', 200]]);
     * const values = no.MapValues2Array(scores); // 返回 [100,200]
     */
    export function MapValues2Array<K, T>(map: Map<K, T>): T[] {
        if (map == null || map.size == 0) return [];
        let a: T[] = [];
        let values = map.values();
        let b = values.next();
        while (!b.done) {
            a[a.length] = b.value;
            b = values.next();
        }
        return a;
    }

    /**
     * 将对象数组转换为键值对结构
     * @param array 源数组
     * @param keyType 作为键的属性名
     * @returns 键值对对象
     * @example
     * // 转换用户数据
     * const users = [{id:1,name:'A'}, {id:2,name:'B'}];
     * const userMap = no.arrayToKV(users, 'id');
     * // 结果: {1: {id:1,name:'A'}, 2: {id:2,name:'B'}}
     */
    export function arrayToKV(array: any[], keyType: string): any {
        let b: any = {};
        for (let i = 0, n = array.length; i < n; i++) {
            let a = array[i];
            b[a[keyType]] = a;
        }
        return b;
    }


    /**
     * 数组排序（支持自定义比较函数和升降序）
     * @param arr 要排序的数组（会被直接修改）
     * @param handler 自定义比较函数（返回负数表示a在前，正数表示b在前，0不变）
     *                未提供时默认按数字升序排序
     * @param desc 是否降序排列（默认false升序）
     * @example
     * // 基本数字排序
     * const nums = [3, 1, 4];
     * no.sortArray(nums); // [1, 3, 4]
     * 
     * // 降序排列
     * no.sortArray(nums, undefined, true); // [4, 3, 1]
     * 
     * // 对象数组自定义排序（按age升序）
     * const users = [{age:25}, {age:18}];
     * no.sortArray(users, (a, b) => a.age - b.age);
     */
    export function sortArray<T>(arr: T[], handler?: (a: T, b: T) => number, desc = false): void {
        if (arr == null || arr.length == 0) return;
        if (!handler)
            handler = (a: T, b: T) => {
                return <number><undefined>a - <number><undefined>b;
            };
        arr.sort((a, b) => {
            if (desc) return handler(b, a);
            return handler(a, b);
        });
    }

    /**
     * 插入排序算法（适合相对有序的数据，稳定排序）
     * @param arr 要排序的数组（会被直接修改）
     * @param handler 比较函数（返回true时交换位置）
     *                未提供时默认按数字升序排序
     * @param desc 是否降序排列（默认false升序）
     * @example
     * // 基本数字排序
     * const data = [5, 2, 4, 6];
     * no.insertionSort(data); // [2, 4, 5, 6]
     * 
     * // 降序排列对象数组（按score）
     * const items = [{score:80}, {score:95}];
     * no.insertionSort(items, (a, b) => a.score > b.score, true);
     * 
     * // 自定义排序逻辑（字符串长度排序）
     * const strs = ['apple', 'kiwi'];
     * no.insertionSort(strs, (a, b) => a.length > b.length);
     */
    export function insertionSort<T>(arr: T[], handler?: (a: T, b: T) => boolean, desc = false) {
        let n = arr?.length || 0;
        if (n <= 1) return;
        if (!handler)
            handler = (a: T, b: T) => {
                return <number><undefined>a > <number><undefined>b;
            };
        let a1: any, a2: any;
        for (let i = 1; i < n; i++) {
            a2 = arr[i];
            let j: number;
            for (j = i; j > 0; j--) {
                a1 = arr[j - 1];
                if (desc && handler(a2, a1)) arr[j] = a1;
                else if (!desc && handler(a1, a2)) arr[j] = a1;
                else break;
            }
            arr[j] = a2;
        }
    }

    /**
     * 将对象转换为指定键值结构的数组
     * @param obj 源对象（键值对结构）
     * @param keyName 生成的数组元素中用于存储对象键的属性名
     * @param valueName 生成的数组元素中用于存储对象值的属性名
     * @returns 包含键值对对象的数组，无效输入返回null
     * @example
     * // 转换配置表数据
     * const config = { attack: 100, defense: 50 };
     * no.object2Array(config, 'type', 'value'); 
     * // 返回 [{type:'attack', value:100}, {type:'defense', value:50}]
     * 
     * // 处理空值情况
     * no.object2Array(null, 'key', 'value'); // 返回 null
     */
    export function object2Array(obj: any, keyName: string, valueName: string): any[] {
        if (obj == null || keyName == null || valueName == null) return null;
        let arr = new Array();
        let keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
            arr[arr.length] = {
                [keyName]: keys[i],
                [valueName]: obj[keys[i]]
            };
        }
        return arr;
    }

    /**
     * 将对象转换为值列表数组
     * @param obj 源对象（键值对结构）
     * @returns 包含对象所有属性值的数组，无效输入返回空数组
     * @example
     * // 获取用户数据列表
     * const users = { 1: {name:'A'}, 2: {name:'B'} };
     * no.object2List(users); // 返回 [{name:'A'}, {name:'B'}]
     * 
     * // 处理空对象
     * no.object2List({}); // 返回 []
     */
    export function object2List(obj: any): any[] {
        if (obj == null) return [];
        let arr = new Array();
        let keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
            arr[arr.length] = obj[keys[i]];
        }
        return arr;
    }

    /**
     * 计算数值数组的总和
     * @param arr 需要计算的数值数组
     * @returns 数组元素的总和
     * @example
     * // 返回 6
     * sumOfArray([1, 2, 3]);
     * 
     * // 处理空数组返回 0
     * sumOfArray([]);
     */
    export function sumOfArray(arr: number[]) {
        return arr.reduce((a, b) => a + b, 0);
    }
}