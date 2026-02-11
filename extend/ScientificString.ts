/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 09:29:04 GMT+0800 (中国标准时间)
 *
 */

import { MathUtils } from "./MathUtils";

let units = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",];
/**用科学计数格式表示的字符串 */
export class ScientificString {
    /** 系数（1 ≤ |系数| < 10） */
    private _coefficient: number = 0;
    /** 指数（10的幂次） */
    public index: number = 0;

    /**
     * 构造科学计数法字符串
     * @param v - 初始化值（支持数字/字符串/已有科学计数对象）
     * @example
     * // 从对象初始化
     * new ScientificString({_coefficient: 1.5, index: 3}); // 1.5E3
     * // 从数字初始化
     * new ScientificString(2500); // 2.5E3
     * // 从字符串初始化
     * new ScientificString("3.6E8"); // 3.6E8
     */
    constructor(v?: string | number | { _coefficient: number, index: number }) {
        v = v || 0;
        if (v['_coefficient'] !== undefined) {
            this._coefficient = v['_coefficient'];
            this.index = v['index'];
        }
        else
            this.value = String(v);
    }

    /** 新建零值科学计数对象 */
    public static get new(): ScientificString {
        return new ScientificString(0);
    }

    /**
     * 设置数值（自动解析为科学计数格式）
     * @example
     * // 设置普通数字
     * ss.value = 1234; // 转换为1.234E3
     * // 设置科学计数字符串
     * ss.value = "5.67E+5"; // 转换为5.67E5
     */
    public set value(v: string | number) {
        if (v == null) return;
        if (typeof v == 'number') {
            v = String(v);
        }
        if (v != null && v != '') {
            v = v.toUpperCase();
            if (!v.includes('E')) {
                v = Number(v).toExponential().toUpperCase();
            }
            let e = v.split('E');
            this._coefficient = Number(e[0]);
            this.index = Number(e[1]);
        }
    }

    /** 获取科学计数法字符串表示 */
    public get value(): string {
        return `${this._coefficient}E${this.index}`;
    }

    /**
     * 链式设置值
     * @example
     * new ScientificString().setValue("2.5E3").add(100);
     */
    public setValue(v: string | number): ScientificString {
        this.value = v;
        return this;
    }

    /** 获取/设置系数（设置时会自动调整指数） */
    public get coefficient(): number {
        return this._coefficient;
    }

    public set coefficient(v: number) {
        if (v == 0 || v == null) {
            this._coefficient = 0;
            this.index = 0;
        } else {
            let e = v.toExponential().toUpperCase().split('E');
            this._coefficient = Number(e[0]);
            this.index += Number(e[1]);
        }
    }

    /**
     * 创建副本
     * @example
     * const original = new ScientificString("3E8");
     * const copy = original.clone; // 独立副本
     */
    public get clone(): ScientificString {
        let a = ScientificString.new;
        a._coefficient = this.coefficient;
        a.index = this.index;
        return a;
    }

    /**
     * 复制到目标对象
     * @param other - 目标科学计数对象（将被覆盖）
     * @example
     * const source = new ScientificString("1.2E5");
     * const target = new ScientificString();
     * source.cloneTo(target); // target变为1.2E5
     */
    public cloneTo(other: ScientificString) {
        if (other == null) return;
        this._coefficient = other._coefficient;
        this.index = other.index;
    }

    /**
     * 加法运算（支持链式调用）
     * @param other - 要相加的值（科学计数对象/数字/字符串）
     * @returns 当前对象的新值
     * @example
     * // 实例方法使用
     * const a = new ScientificString("1.2E3");
     * a.add("3E2").toString(); // 结果："1.5E3"
     * 
     * // 链式调用
     * new ScientificString(5e4).add(2.5e3).add("1E5"); // 结果："1.525E5"
     */
    public add(other: ScientificString | number | string): ScientificString {
        if (other == null) return this;
        if (other instanceof ScientificString) {
            this.coefficient = MathUtils.add(this._coefficient, other._coefficient * Math.pow(10, other.index - this.index));
        } else {
            other = new ScientificString(other);
            this.add(other);
        }
        return this;
    }

    /**
     * 静态加法运算（适合快速计算）
     * @param s1 - 被加数字符串
     * @param s2 - 加数字符串
     * @param out - 可选输出对象（避免重复创建对象）
     * @returns 计算结果的新实例
     * @example
     * // 直接计算两个科学计数字符串的和
     * ScientificString.add("2.5E3", "1.2E4").toString(); // 结果："1.45E4"
     * 
     * // 复用输出对象
     * const result = new ScientificString();
     * ScientificString.add("3E8", "5E7", result); // result值为3.5E8
     */
    public static add(s1: string, s2: string, out?: ScientificString): ScientificString {
        out = out || new ScientificString();
        out.value = s1;
        let sc2 = new ScientificString(s2);
        out.add(sc2);
        return out;
    }

    /**
     * 减法运算（支持链式调用）
     * @param other - 要相减的值（科学计数对象/数字/字符串）
     * @returns 当前对象的新值
     * @example
     * // 实例方法使用
     * new ScientificString("5E3").minus("2E3").toString(); // 结果："3E3"
     * 
     * // 混合类型计算
     * new ScientificString(1e5).minus(25000).toString(); // 结果："7.5E4"
     */
    public minus(other: ScientificString | number | string): ScientificString {
        if (other == null) return this;
        if (other instanceof ScientificString) {
            this.coefficient = MathUtils.minus(this._coefficient, other._coefficient * Math.pow(10, other.index - this.index));
        } else {
            other = new ScientificString(other);
            this.minus(other);
        }
        return this;
    }

    /**
     * 静态减法运算
     * @param s1 - 被减数字符串
     * @param s2 - 减数字符串
     * @param out - 可选输出对象
     * @returns 计算结果的新实例
     * @example
     * // 计算能量差值
     * ScientificString.minus("1.5E6", "7.5E5").toString(); // 结果："7.5E5"
     */
    public static minus(s1: string, s2: string, out?: ScientificString): ScientificString {
        out = out || new ScientificString();
        out.value = s1;
        let s = new ScientificString(s2);
        out.minus(s);
        return out;
    }

    /**
     * 乘法运算（支持链式调用）
     * @param other - 要相乘的值（科学计数对象/数字/字符串）
     * @returns 当前对象的新值
     * @example
     * // 计算面积
     * new ScientificString("2.5E3").mul("3E2").toString(); // 结果："7.5E5"
     * 
     * // 连续相乘
     * new ScientificString(2).mul(1e3).mul("4E2"); // 结果："8E5"
     */
    public mul(other: ScientificString | number | string): ScientificString {
        if (other == null) return this;
        if (other instanceof ScientificString) {
            this.coefficient = MathUtils.mutiply(this._coefficient, other._coefficient);
            this.index += other.index;
        } else {
            other = new ScientificString(other);
            this.mul(other);
        }
        return this;
    }

    /**
     * 静态乘法运算
     * @param s1 - 被乘数字符串
     * @param s2 - 乘数字符串
     * @param out - 可选输出对象
     * @returns 计算结果的新实例
     * @example
     * // 计算功率（电压×电流）
     * ScientificString.mul("2.2E3", "1.5E3").toString(); // 结果："3.3E6"
     */
    public static mul(s1: string, s2: string, out?: ScientificString): ScientificString {
        out = out || new ScientificString();
        out.value = s1;
        let s = new ScientificString(s2);
        out.mul(s);
        return out;
    }

    /**
     * 除法运算（支持链式调用）
     * @param other - 要相除的值（科学计数对象/数字/字符串）
     * @returns 当前对象的新值
     * @example
     * // 计算密度
     * new ScientificString("6E3").div("2E1").toString(); // 结果："3E2"
     * 
     * // 混合类型计算
     * new ScientificString(1e6).div(2e2).toString(); // 结果："5E3"
     */
    public div(other: ScientificString | number | string): ScientificString {
        if (other == null) return this;
        if (other instanceof ScientificString) {
            this.coefficient = MathUtils.divide(this._coefficient, other._coefficient);
            this.index -= other.index;
        } else {
            other = new ScientificString(other);
            this.div(other);
        }
        return this;
    }

    /**
     * 静态除法运算
     * @param s1 - 被除数字符串
     * @param s2 - 除数字符串
     * @param out - 可选输出对象
     * @returns 计算结果的新实例
     * @example
     * // 计算速度（距离/时间）
     * ScientificString.div("1.5E3", "5E0").toString(); // 结果："3E2"
     */
    public static div(s1: string, s2: string, out?: ScientificString): ScientificString {
        out = out || new ScientificString();
        out.value = s1;
        let s = new ScientificString(s2);
        out.div(s);
        return out;
    }

    /**
     * 值比较（支持与多种类型比较）
     * @param other - 比较对象（支持科学计数对象/数字/字符串）
     * @returns 负值：当前对象小于比较对象，0：等于，正值：当前对象大于比较对象
     * @example
     * // 比较两个科学计数对象
     * const a = new ScientificString("1.5E3");
     * const b = new ScientificString("2E3");
     * a.compareTo(b); // 返回-0.5
     * 
     * // 与数字直接比较
     * new ScientificString("3E5").compareTo(250000); // 返回0.5
     * 
     * // 与字符串比较
     * new ScientificString("5E8").compareTo("1E9"); // 返回-0.5
     */
    public compareTo(other: ScientificString | string | number): number {
        if (other == null) return 1;
        if (!(other instanceof ScientificString))
            other = new ScientificString(other);
        if (this.index == other.index) {
            return this.coefficient - other.coefficient;
        } else {
            return this.index > other.index ? 1 : -1;
        }
    }

    /**
     * 静态值比较方法（适合快速比较两个字符串值）
     * @param s1 - 科学计数字符串1（格式如"1.2E3"）
     * @param s2 - 科学计数字符串2（格式如"1.5E3"）
     * @returns 负值：s1 < s2，0：等于，正值：s1 > s2
     * @example
     * // 直接比较两个字符串值
     * ScientificString.compareTo("3.6E8", "3.6E8"); // 返回0
     * ScientificString.compareTo("2E5", "3E5"); // 返回-1
     */
    public static compareTo(s1: string, s2: string): number {
        if (s1 == null) return -1;
        if (s2 == null) return 1;
        let e1 = new ScientificString(s1),
            e2 = new ScientificString(s2);
        return e1.compareTo(e2);
    }

    /** 
     * 带单位的格式化值（自动处理千分位单位）
     * @example
     * new ScientificString(1500).unitValue;   // "1500"
     * new ScientificString(15000).unitValue;  // "15k" 
     * new ScientificString(1.5e6).unitValue;  // "1.5m"
     * new ScientificString(3e9).unitValue;    // "3b"
     * new ScientificString(5e12).unitValue;   // "5A"
     */
    public get unitValue(): string {
        if (this.index < 3) {
            return `${this.numberValue}`;
        }
        let a = MathUtils.floor(this.index / 3),
            b = this.index % 3,
            u: string;
        if (a < 4) {
            u = ["k", "m", "b"][a - 1];
        } else {
            u = this.getUnit(a - 3);
        }
        return `${MathUtils.floor(MathUtils.mutiply(this._coefficient, Math.pow(10, b + 2))) / 100}${u}`;
    }

    /**
     * 递归生成单位字符串（内部使用）
     * @param a - 单位层级（每26个字母进位）
     * @returns 组合单位字符串
     * @example
     * getUnit(1) => "A"
     * getUnit(26) => "Z"
     * getUnit(27) => "AA"
     * getUnit(28) => "AB"
     */
    private getUnit(a: number): string {
        let u: string;
        let len = units.length;
        a -= 1;
        if (a < len)
            u = units[a];
        else {
            let c = MathUtils.floor(a / len);
            u = units[a % len];
            u = this.getUnit(c) + u;
        }
        return u;
    }

    /** 
     * 获取原始数值（将科学计数转换为普通数字）
     * @example
     * new ScientificString("1.5E3").numberValue; // 1500
     * new ScientificString("3E8").numberValue;   // 300000000
     */
    public get numberValue(): number {
        return MathUtils.mutiply(this._coefficient, Math.pow(10, this.index));
    }

    /**
     * 带单位字符串格式化（支持自定义单位体系）
     * @param units - 自定义单位数组（需按单位量级顺序排列）
     * @param step - 单位换算步进值（默认每3位进一个单位，如千/百万等）
     * @param digits - 保留小数位数（默认2位）
     * @returns 格式化后的字符串 如：1.23AA / 4.56万
     * @example
     * // 使用中文单位体系
     * new ScientificString(12345).toUnitString(["", "万", "亿"], 4); // "1.23万"
     * 
     * // 使用自定义游戏单位
     * new ScientificString(1e6).toUnitString(["K", "M", "B"], 3); // "1.00M"
     * 
     * // 处理极小数值
     * new ScientificString(123).toUnitString(["千"], 3, 0); // "123"
     */
    public toUnitString(units: string[], step = 3, digits = 2): string {
        if (this.index < step) {
            return `${MathUtils.float(MathUtils.mutiply(this._coefficient, Math.pow(10, this.index)), digits)}`;
        }
        let a = MathUtils.floor(this.index / step),
            b = this.index % step,
            u: string = units[a - 1];
        return `${MathUtils.float(MathUtils.mutiply(this._coefficient, Math.pow(10, b)), digits)}${u}`;
    }

    /**
     * 取负值到一个新的ScientificString（保持原对象不变）
     * @returns 新的负值ScientificString实例
     * @example
     * // 转换正值
     * new ScientificString(1500).toNegative().toString(); // "-1.5E3"
     * 
     * // 链式调用
     * new ScientificString(2e5).add(3e4).toNegative();
     */
    public toNegative(): ScientificString {
        let a = this.clone;
        a._coefficient = -Math.abs(a._coefficient);
        return a;
    }

    /**
     * 取正值到一个新的ScientificString（保持原对象不变）
     * @returns 新的正值ScientificString实例
     * @example
     * // 确保数值为正
     * new ScientificString(-5e3).toPositive().toString(); // "5E3"
     * 
     * // 处理用户输入
     * const userInput = new ScientificString("-3.2E4");
     * const safeValue = userInput.toPositive();
     */
    public toPositive(): ScientificString {
        let a = this.clone;
        a._coefficient = Math.abs(a._coefficient);
        return a;
    }

    /**
     * 静态方法快速转换单位字符串（使用内置单位体系）
     * @param v - 要转换的数值（支持数字/科学计数字符串）
     * @returns 自动单位转换后的字符串
     * @example
     * // 快速转换数值
     * ScientificString.toUnitString(2500); // "2.5k"
     * 
     * // 转换科学计数
     * ScientificString.toUnitString("3.6E8"); // "360M"
     */
    public static toUnitString(v: string | number): string {
        const a = new ScientificString(v);
        return a.unitValue;
    }
}

export function scientificString(v: number | string): ScientificString {
    return new ScientificString(v);
}