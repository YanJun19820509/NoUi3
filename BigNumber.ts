
const UNITS = ['', 'K', 'M', 'B', 'T', 'P', 'E', 'Z', 'Y', 'S', 'L', 'X', 'D', 'C', 'H', 'I', 'N', 'A', 'F', 'G', 'J', 'O'];
/**
 * 格式化数值
 * @param value - 数值
 * @returns [数值, 指数]
 */
function formatValue(value: number): number[] {
    let e = value.toExponential().toUpperCase().split('E');
    return [Number(e[0]), Number(e[1])];
}
/**
 * 大数计算类
 */
export class BigNumber {
    private value: number = 0;
    private unitIndex: number = 0;
    private digits: number = 1;

    /**
     * 创建一个BigNumber对象
     * @param value - 数字
     * @param unit - 单位 'K', 'M', 'B', 'T', 'P', 'E', 'Z', 'Y', 'S', 'L', 'X', 'D', 'C', 'H', 'I', 'N', 'A', 'F', 'G', 'J', 'O'
     * @param digits - 保留的小数位数
     */
    constructor(value?: number, unit?: string, digits: number = 1) {
        this.unitIndex = 0;
        this.digits = digits;
        if (!value) {
            this.value = 0;
        } else if (value < 1000) {
            this.value = value;
        } else {
            let n = String(value).length;
            let m = n % 3;
            this.unitIndex = (n - m) / 3;
            this.value = Math.floor(value / Math.pow(10, this.unitIndex * 3 - digits)) / Math.pow(10, digits);
        }
        this.unitIndex += unit ? UNITS.indexOf(unit.toUpperCase()) : 0;
    }

    /**
     * 创建一个BigNumber对象
     * @param v - 数字或字符串
     * @param digits - 保留的小数位数
     * @returns BigNumber对象
     */
    public static new(v: number | string, digits: number = 1): BigNumber {
        if (typeof v === 'string') {
            let u = v.slice(-1).toUpperCase();
            if (UNITS.includes(u)) {
                return new BigNumber(Number(v.slice(0, -1)), u, digits);
            } else {
                return new BigNumber(Number(v), '', digits);
            }
        }
        return new BigNumber(v, '', digits);
    }

    /**
     * 设置值
     * @param value - 数字
     * @returns BigNumber对象
     */
    public setValue(value: number): BigNumber {
        if (value < 1000) {
            if (value < 1) {
                let [v, n] = formatValue(value);
                let m = n % 3;
                if (m < 0) {
                    this.unitIndex += (n - m) / 3 - 1;
                    this.value = Math.floor(v * Math.pow(10, m + 3 + this.digits)) / Math.pow(10, this.digits);
                } else {
                    this.unitIndex += (n - m) / 3;
                    this.value = Math.floor(v * Math.pow(10, m + this.digits)) / Math.pow(10, this.digits);
                }
            } else {
                this.value = Math.floor(value * Math.pow(10, this.digits)) / Math.pow(10, this.digits);
            }
        } else {
            let [v, n] = formatValue(value);
            let m = n % 3;
            let u = (n - m) / 3;
            this.value = Math.floor(value / Math.pow(10, u * 3 - this.digits)) / Math.pow(10, this.digits);
            this.unitIndex += u;
        }
        return this;
    }

    /**
     * 设置单位
     * @param unit - 单位
     * @returns BigNumber对象
     */
    public setUnit(unit: string): BigNumber {
        return this.setUnitIndex(UNITS.indexOf(unit.toUpperCase()));
    }

    private setUnitIndex(index: number): BigNumber {
        this.unitIndex = index;
        return this;
    }

    /**
     * 转换为字符串
     * @param digits - 保留的小数位数
     * @returns 字符串
     */
    public toString(digits: number = this.digits): string {
        if (this.unitIndex > 0) {
            return `${this.value}${UNITS[this.unitIndex]}`;
        } else {
            return `${Math.floor(this.value * Math.pow(10, this.unitIndex * 3) * Math.pow(10, digits)) / Math.pow(10, digits)}`;
        }
    }

    /**
     * 转换为科学计数法字符串
     * @returns 字符串
     */
    public toStringE(): string {
        return `${this.value}e${this.unitIndex >= 0 ? '+' : ''}${this.unitIndex * 3}`;
    }

    /**
     * 加法
     * @param other - 数字或字符串或BigNumber对象
     * @returns BigNumber对象
     */
    public add(other: number | string | BigNumber): BigNumber {
        if (other instanceof BigNumber) {
            const bn = new BigNumber(0, '', this.digits);
            if (this.unitIndex > other.unitIndex) {
                bn.setUnitIndex(other.unitIndex);
                bn.setValue(this.value * Math.pow(10, (this.unitIndex - other.unitIndex) * 3) + other.value);
            } else if (this.unitIndex < other.unitIndex) {
                bn.setUnitIndex(this.unitIndex);
                bn.setValue(this.value + other.value * Math.pow(10, (other.unitIndex - this.unitIndex) * 3));
            } else {
                bn.setUnitIndex(this.unitIndex);
                bn.setValue(this.value + other.value);
            }
            return bn;
        } else {
            return this.add(BigNumber.new(other, this.digits));
        }
    }

    /**
     * 减法
     * @param other - 数字或字符串或BigNumber对象
     * @returns BigNumber对象
     */
    public minus(other: number | string | BigNumber): BigNumber {
        if (other instanceof BigNumber) {
            const bn = new BigNumber(0, '', this.digits);
            if (this.unitIndex > other.unitIndex) {
                bn.setUnitIndex(other.unitIndex);
                bn.setValue(this.value * Math.pow(10, (this.unitIndex - other.unitIndex) * 3) - other.value);
            } else if (this.unitIndex < other.unitIndex) {
                bn.setUnitIndex(this.unitIndex);
                bn.setValue(this.value - other.value * Math.pow(10, (other.unitIndex - this.unitIndex) * 3));
            } else {
                bn.setUnitIndex(this.unitIndex);
                bn.setValue(this.value - other.value);
            }
            return bn;
        } else {
            return this.minus(BigNumber.new(other, this.digits));
        }
    }

    /**
     * 乘法
     * @param other - 数字或字符串或BigNumber对象
     * @returns BigNumber对象
     */
    public multiply(other: number | string | BigNumber): BigNumber {
        if (other instanceof BigNumber) {
            const bn = new BigNumber(0, '', this.digits);
            bn.setUnitIndex(this.unitIndex + other.unitIndex);
            bn.setValue(this.value * other.value);
            return bn;
        } else {
            return this.multiply(BigNumber.new(other, this.digits));
        }
    }

    /**
     * 除法
     * @param other - 数字或字符串或BigNumber对象
     * @returns BigNumber对象
     */
    public divide(other: number | string | BigNumber): BigNumber {
        if (other instanceof BigNumber) {
            const bn = new BigNumber(0, '', this.digits);
            bn.setUnitIndex(this.unitIndex - other.unitIndex);
            bn.setValue(this.value / other.value);
            return bn;
        } else {
            return this.divide(BigNumber.new(other, this.digits));
        }
    }

    /**
     * 是否大于
     * @param other - 数字或字符串或BigNumber对象
     * @returns 是否大于
     */
    public isBigger(other: number | string | BigNumber): boolean {
        if (other instanceof BigNumber) {
            if (this.unitIndex == other.unitIndex) {
                return this.value > other.value;
            } else if (this.unitIndex > other.unitIndex) {
                return this.value * Math.pow(10, (this.unitIndex - other.unitIndex) * 3) > other.value;
            } else {
                return this.value > other.value * Math.pow(10, (other.unitIndex - this.unitIndex) * 3);
            }
        } else {
            return this.isBigger(BigNumber.new(other, this.digits));
        }
    }

    /**
     * 是否等于
     * @param other - 数字或字符串或BigNumber对象
     * @returns 是否等于
     */
    public isEqual(other: number | string | BigNumber): boolean {
        if (other instanceof BigNumber) {
            return this.value == other.value && this.unitIndex == other.unitIndex;
        } else {
            return this.isEqual(BigNumber.new(other, this.digits));
        }
    }

    /**
     * 是否大于等于
     * @param other - 数字或字符串或BigNumber对象
     * @returns 是否大于等于
     */
    public isBiggerOrEqual(other: number | string | BigNumber): boolean {
        return this.isBigger(other) || this.isEqual(other);
    }

    /**
     * 静态加法运算
     * @param a - 数字或字符串
     * @param b - 数字或字符串
     * @returns 字符串
     */
    public static add(a: string | number, b: string | number, digits: number = 1): string {
        return this.new(a).add(this.new(b)).toString(digits);
    }

    /**
     * 静态减法运算
     * @param a - 数字或字符串
     * @param b - 数字或字符串
     * @returns 字符串
     */
    public static minus(a: string | number, b: string | number, digits: number = 1): string {
        return this.new(a).minus(this.new(b)).toString(digits);
    }
    /**
     * 静态乘法运算
     * @param a - 数字或字符串
     * @param b - 数字或字符串
     * @returns 字符串
     */
    public static multiply(a: string | number, b: string | number, digits: number = 1): string {
        return this.new(a).multiply(this.new(b)).toString(digits);
    }

    /**
     * 静态除法运算
     * @param a - 数字或字符串
     * @param b - 数字或字符串
     * @returns 字符串
     */
    public static divide(a: string | number, b: string | number, digits: number = 1): string {
        return this.new(a).divide(this.new(b)).toString(digits);
    }

    /**
     * 静态是否大于
     * @param a - 数字或字符串
     * @param b - 数字或字符串
     * @returns 是否大于
     */
    public static isBigger(a: string | number, b: string | number): boolean {
        return this.new(a).isBigger(this.new(b));
    }

    /**
     * 静态是否等于
     * @param a - 数字或字符串
     * @param b - 数字或字符串
     * @returns 是否等于
     */
    public static isEqual(a: string | number, b: string | number): boolean {
        return this.new(a).isEqual(this.new(b));
    }

    /**
     * 静态是否大于等于
     * @param a - 数字或字符串
     * @param b - 数字或字符串
     * @returns 是否大于等于
     */
    public static isBiggerOrEqual(a: string | number, b: string | number): boolean {
        return this.new(a).isBiggerOrEqual(this.new(b));
    }
}