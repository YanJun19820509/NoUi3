/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 09:21:43 GMT+0800 (中国标准时间)
 *
 */

import { no } from "@hackUi/no";
import { random, Vec2, Vec3 } from "@hackUi/yj";

export namespace mathUtils {
    /**
     * 从数组中随机抽取指定数量的元素
     * @param arr 源数组（支持任意类型元素）
     * @param n 需要抽取的元素数量（默认1，当n=1时返回单个元素，否则返回数组）
     * @param repeatable 是否允许重复抽取（默认false）
     * @param except 需要排除的元素数组（可选）
     * @returns 随机抽取的元素或元素数组
     * @example
     * // 基本用法：从数字数组中随机1个
     * const num = no.arrayRandom([1,2,3,4,5]);
     * 
     * // 抽取3个不重复的字母
     * const letters = no.arrayRandom(['a','b','c','d','e'], 3);
     * 
     * // 排除特定元素后抽取
     * const colors = no.arrayRandom(['red','green','blue','yellow'], 2, false, ['red']);
     * 
     * // 允许重复抽取（可能得到相同元素）
     * const roles = no.arrayRandom(['战士','法师','牧师'], 5, true);
     * 
     * // 处理空数组情况
     * const empty = no.arrayRandom([]); // 返回null
     */
    export function arrayRandom(arr: any[], num = 1, repeatable = false, except?: any[], needArr = false): any {
        if (!arr || arr.length == 0) return [];
        if (arr.length == 1) return needArr ? arr : arr[0];
        let a: any[] = [];
        if (except) {
            a = [];
            for (let i = 0, n = arr.length; i < n; i++) {
                let has = false;
                for (let j = 0, m = except.length; j < m; j++) {
                    if (arr[i] === except[j]) {
                        has = true;
                        break;
                    }
                }
                if (!has) {
                    a[a.length] = arr[i];
                }
            }
        } else {
            a = arr.slice();
        }
        let c = [];
        for (var i = 0; i < num; i++) {
            let al = a.length;
            if (al == 0) break;
            let b = floor(random() * al);
            if (!repeatable)
                c = [].concat(c, a.splice(b, 1));
            else
                c = [].concat(c, a[b]);
        }
        return needArr ? c : num == 1 ? c[0] : c;
    }

    /**
     * 根据权重值进行随机选择（支持排除特定索引）
     * @param weight 权重数组（数值越大被选中的概率越高）
     * @param except 需要排除的权重数组索引（可选）
     * @returns 被选中的权重项索引
     * @example
     * // 基础权重随机
     * no.weightRandom([70, 20, 10]); // 70%概率返回0，20%返回1，10%返回2
     * 
     * // 排除不可选项
     * no.weightRandom([50, 0, 50], [0]); // 只会返回2（索引0被排除）
     * 
     * // 处理全排除情况
     * no.weightRandom([10, 20], [0,1]); // 返回undefined（需调用方处理）
     */
    export function weightRandom(weight: number[], except?: number[]): number {
        if (!weight) return 0;
        let sum = 0;
        except = except || [];
        for (let i = 0; i < weight.length; i++) {
            if (except.indexOf(i) == -1) {
                sum += Number(weight[i]);
            }
        }
        let r = random() * sum;
        let n = weight.length;
        let a = 0;
        for (let i = 0; i < n; i++) {
            let m = Number(weight[i]);
            if (m == 0 || except.indexOf(i) > -1) continue;
            a += m;
            if (r <= a) {
                return i;
            }
        }
    }

    /**
     * 根据对象数组中的指定属性进行权重随机
     * @param weight 对象数组（每个元素需包含权重属性）
     * @param key 权重值对应的属性名
     * @returns 被选中的对象数组索引
     * @example
     * // 随机游戏事件
     * const events = [
     *   { id:1, prob:80 }, 
     *   { id:2, prob:15 },
     *   { id:3, prob:5 }
     * ];
     * no.weightRandomObject(events, 'prob'); // 80%概率返回0
     * 
     * // 处理无效键
     * no.weightRandomObject([{a:10}], 'b'); // 所有权重为NaN，返回0
     */
    export function weightRandomObject(weight: any[], key: string): number {
        if (!weight) return 0;
        let a: number[] = [];
        for (let i = 0; i < weight.length; i++) {
            a[a.length] = Number(weight[i][key]);
        }
        return weightRandom(a);
    }

    /**
     * 数字精度转换（解决浮点数计算精度问题）
     * @param v 需要处理的数字
     * @param x 保留的小数位数（默认12位）
     * @returns 精确处理后的数字
     * @example
     * float(0.1 + 0.2)          // 0.3
     * float(1.2345678901234)    // 1.234567890123
     * float(Math.PI, 4)         // 3.1416
     * float(2.0000000000001)    // 2
     */
    export function float(v: number, x = 12): number {
        let a = Math.pow(10, 12),
            b = Math.pow(10, 12 - x),
            c = Math.pow(10, x);
        return Math.floor(Math.ceil(v * a) / b) / c;
    }

    /**
     * 数值取整（优化版）
     * @param v - 需要处理的数值
     * @returns 取整后的数值
     * @example
     * no.floor(3.7)   // 3
     * no.floor(-1.2)  // -1（与Math.floor(-1.2)=-2不同）
     * no.floor(0.999) // 0
     * no.floor(12345678901234567890.5) // 精度可能丢失（超过安全整数范围时）
     */
    export function floor(v: number): number {
        if (v < 1 && v >= 0) return 0;
        let a = v | 0;
        if (a == 0 || (v > 0 && a < 0) || (v < 0 && a > 0)) return Math.floor(v);
        return a;
    }

    /**
     * 获取数值的小数部分
     * @param v - 需要处理的数值
     * @returns 小数部分（0到1之间的浮点数）
     * @example
     * no.fract(3.14)  // 0.14
     * no.fract(-2.5)  // 0.5
     * no.fract(100)   // 0
     */
    export function fract(v: number): number {
        let s = String(v).split('.');
        s[0] = '0';
        return Number(s.join('.'));
    }

    /**
     * 向上取整（优化版）
     * @param v - 需要处理的数值
     * @returns 向上取整后的数值
     * @example
     * no.ceil(2.3)   // 3
     * no.ceil(-2.7)  // -2
     * no.ceil(5)     // 5
     */
    export function ceil(v: number): number {
        let a = floor(v);
        if (a < 0 || a >= v) return a;
        return a + 1;
    }

    /**
     * 循环数值（环形数值处理）
     * @param v - 当前值
     * @param min - 最小值（包含）
     * @param max - 最大值（包含）
     * @returns 循环后的数值
     * @example
     * no.cyclic(5, 0, 4)   // 0
     * no.cyclic(-1, 0, 4)  // 4
     * no.cyclic(2.5, 0, 4) // 2.5
     */
    export function cyclic(v: number, min: number, max: number): number {
        if (v < min) return max;
        if (v > max) return min;
        return v;
    }

    /**
     * 数值钳制（限制在指定范围内）
     * @param v - 需要处理的数值
     * @param min - 最小值
     * @param max - 最大值
     * @returns 限制后的数值
     * @example
     * no.clamp(10, 0, 5)  // 5
     * no.clamp(-3, 0, 5)  // 0
     * no.clamp(3.5, 0, 5) // 3.5
     */
    export function clamp(v: number, min: number, max: number): number {
        if (v < min) return min;
        if (v > max) return max;
        return v;
    }

    /**
     * 是否在范围内
     * @param v 
     * @param min 
     * @param max 
     * @returns 
     */
    export function inRange(v: number, min: number, max: number): boolean {
        return v >= min && v <= max;
    }

    /**
     * 循环索引（适用于环形数组访问）
     * @param n - 当前索引
     * @param min - 最小索引值（通常为0）
     * @param max - 最大索引值（通常为数组长度-1）
     * @returns 循环后的索引
     * @example
     * no.circleIndex(5, 0, 4)  // 0
     * no.circleIndex(-1, 0, 4) // 4
     * no.circleIndex(3, 0, 4)  // 3
     */
    export function circleIndex(n: number, min: number, max: number): number {
        if (n < min) return max;
        if (n > max) return min;
        return n;
    }

    /**
     * 平滑过渡计算（返回0-1标准化值）
     * @param v - 当前值
     * @param min - 范围最小值
     * @param max - 范围最大值
     * @returns 标准化后的0-1值
     * @example
     * no.smoothStep(5, 0, 10)  // 0.5
     * no.smoothStep(15, 10, 20) // 0.5
     * no.smoothStep(25, 10, 20) // 1
     */
    export function smoothStep(v: number, min: number, max: number): number {
        if (v < min) return 0;
        if (v > max) return 1;
        return (v - min) / (max - min);
    }

    /**
     * 获取数字科学计数法表示的指数值
     * @param n - 需要解析的数字
     * @returns 科学计数法指数部分的值（无科学计数法时返回0）
     * @example
     * eIndex(1.23e5)  // 5
     * eIndex(0.0003)  // 0
     */
    function eIndex(n: number): number {
        let s = n.toString().toLowerCase();
        let a = s.split('e');
        if (!a[1]) return 0;
        return Number(a[1]);
    }

    /**
     * 计算数字的实际小数位数（考虑科学计数法）
     * @param n - 需要计算的数字
     * @returns 修正后的有效小数位数
     * @example
     * decimalDigits(0.123)    // 3
     * decimalDigits(1.23e-2) // 5（实际值为0.0123）
     */
    function decimalDigits(n: number): number {
        let a = n.toString().toLowerCase().split('e')[0].split('.');
        return (!!a[1] ? a[1].length : 0) - eIndex(n);
    }

    /**
     * 精确加法运算（解决浮点数精度问题）
     * @param n1 - 被加数
     * @param n2 - 加数
     * @returns 精确相加结果
     * @example
     * add(0.1, 0.2)   // 0.3
     * add(1e-3, 2e-3) // 0.003
     * add(5, 3.1)     // 8.1
     */
    export function add(n1: number, n2: number): number {
        let r1: number = decimalDigits(n1),
            r2: number = decimalDigits(n2),
            m: number = Math.pow(10, Math.max(r1, r2));
        return (n1 * m + n2 * m) / m;
    }

    /**
     * 精确减法运算（解决浮点数精度问题）
     * @param n1 - 被减数
     * @param n2 - 减数
     * @returns 精确相减结果
     * @example
     * minus(0.3, 0.1) // 0.2
     * minus(2e-2, 1e-2) // 0.01
     * minus(5, 2.3)   // 2.7
     */
    export function minus(n1: number, n2: number): number {
        let r1: number = decimalDigits(n1),
            r2: number = decimalDigits(n2),
            n: number = Math.max(r1, r2),
            m: number = Math.pow(10, n);
        return Number(((n1 * m - n2 * m) / m).toFixed(n));
    }

    /**
     * 精确乘法运算（解决浮点数精度问题）
     * @param n1 - 被乘数
     * @param n2 - 乘数
     * @returns 精确相乘结果
     * @example
     * mutiply(0.1, 0.2) // 0.02
     * mutiply(3e3, 2e2) // 600000
     * mutiply(1.5, 3)   // 4.5
     */
    export function mutiply(n1: number, n2: number): number {
        let m: number = decimalDigits(n1) + decimalDigits(n2),
            s1 = n1.toString().toLowerCase().split('e')[0].replace('.', ''),
            s2 = n2.toString().toLowerCase().split('e')[0].replace('.', '');
        return Number(s1) * Number(s2) / Math.pow(10, m);
    }

    /**
     * 精确除法运算（解决浮点数精度问题）
     * @param n1 - 被除数
     * @param n2 - 除数
     * @returns 精确相除结果
     * @example
     * divide(0.3, 0.1) // 3
     * divide(1e6, 2e2) // 5000
     * divide(4.5, 1.5) // 3
     */
    export function divide(n1: number, n2: number): number {
        let r1: number = decimalDigits(n1),
            r2: number = decimalDigits(n2),
            s1 = n1.toString().toLowerCase().split('e')[0].replace('.', ''),
            s2 = n2.toString().toLowerCase().split('e')[0].replace('.', '');
        return (Number(s1) / Number(s2)) * Math.pow(10, r2 - r1);
    }

    /**
     * 计算阶乘（递归实现，n >= 0）
     * @param n - 要计算的阶数
     * @returns n的阶乘结果
     * @example
     * factorial(5); // 120
     * factorial(0); // 1
     * factorial(10); // 3628800
     */
    export function factorial(n: number): number {
        if (n == 0) return 1;
        return n * factorial(n - 1);
    }

    /**
     * 计算组合数C(n, i)（n个元素取i个的组合数）
     * @param n - 元素总数（n >= 0）
     * @param i - 选取数量（i <= n）
     * @returns 组合数计算结果
     * @example
     * combination(5, 2); // 10
     * combination(10, 3); // 120
     * combination(4, 4); // 1
     * 
     * // 参数错误示例
     * combination(3, 5); // 返回NaN（因n-i为负数）
     */
    export function combination(n: number, i: number): number {
        let _1 = factorial(n),
            _2 = factorial(i),
            _3 = factorial(n - i);
        return _1 / _2 / _3;
    }

    /**
     * 二次贝塞尔曲线专用公式
     * @param t 
     * @param p0 
     * @param p1 
     * @param p2 
     * @returns 
     */
    export const bezierQuadratic = (t: number, p0: { x: number, y: number }, p1: { x: number, y: number }, p2: { x: number, y: number }): { x: number, y: number } => ({
        x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x,
        y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y
    });

    /**
     * 三次贝塞尔曲线专用公式
     * @param t 
     * @param p0 
     * @param p1 
     * @param p2 
     * @param p3 
     * @returns 
     */
    export const bezierCubic = (t: number, p0: { x: number, y: number }, p1: { x: number, y: number }, p2: { x: number, y: number }, p3: { x: number, y: number }): { x: number, y: number } => ({
        x: (1 - t) ** 3 * p0.x + 3 * (1 - t) ** 2 * t * p1.x + 3 * (1 - t) * t ** 2 * p2.x + t ** 3 * p3.x,
        y: (1 - t) ** 3 * p0.y + 3 * (1 - t) ** 2 * t * p1.y + 3 * (1 - t) * t ** 2 * p2.y + t ** 3 * p3.y
    });


    /**
     * 计算两个数值的百分比比例
     * @param min 当前值（分子）
     * @param max 最大值（分母）
     * @param maxNum 比例基数（如要转换为0-100的百分比则传100）
     * @returns 计算后的比例数值（向下取整）
     * @example
     * // 计算进度条比例（0-100）
     * const progress = no.twoNumPercentage2Num(25, 50, 100); // 50
     * 
     * // 计算血量显示比例（0-1）
     * const hpRatio = no.twoNumPercentage2Num(75, 150, 1); // 0
     * 
     * // 处理越界值
     * const safeValue = no.twoNumPercentage2Num(200, 100, 1000); // 1000
     */
    export function twoNumPercentage2Num(min: number, max: number, maxNum: number): number {
        if (min > max) {
            min = max;
        }
        return floor(min / max * maxNum);
    }

    /**
     * 获取指定范围内的随机值（支持整数/浮点数和排除值）
     * @param min 最小值（包含）
     * @param max 最大值（包含）
     * @param except 需要排除的数值数组 或 是否取整（默认true）
     * @returns 范围内的随机数值
     * @example
     * // 基础用法：生成1-6的随机整数（骰子）
     * const dice = no.randomBetween(1, 6);
     * 
     * // 生成0-1的随机浮点数
     * const precise = no.randomBetween(0, 1, false);
     * 
     * // 排除特定值：生成1-10但不包含5和7
     * const safeNum = no.randomBetween(1, 10, [5, 7]);
     * 
     * // 颜色通道生成：0-255整数且排除纯黑
     * const colorChannel = no.randomBetween(0, 255, [0,0,0]);
     * 
     * // 边界测试：当min等于max时
     * const fixed = no.randomBetween(100, 100); // 总是返回100
     */
    export function randomBetween(min: number, max: number, except?: number[]): number;
    export function randomBetween(min: number, max: number, isInt?: boolean): number;
    export function randomBetween(min: number, max: number, except?: number[] | boolean): number {
        if (min == max) return min;
        if (min == null || max == null) return min || max;
        let isInt = true;
        if (except === false) isInt = false;
        const a = random() * (max - min + 1);
        const b = (isInt ? floor(a) : a) + min;
        if (Array.isArray(except) && except.includes(b)) return randomBetween(min, max, except);
        return b;
    }
}