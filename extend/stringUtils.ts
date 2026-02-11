/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 11:00:06 GMT+0800 (中国标准时间)
 *
 */

export namespace stringUtils {


    /**
     * 根据模板格式化字符串
     * @param formatter 模板字符串，支持 {key} 和 {0} 格式的占位符
     * @param data 替换数据，可以是对象或数组
     * @returns 格式化后的字符串
     * @example
     * // 对象参数示例
     * formatString('玩家:{name} 等级:{level}', {name: '张三', level: 99}); // 返回 "玩家:张三 等级:99"
     * // 数组参数示例
     * formatString('坐标:{0},{1}', [120, 240]); // 返回 "坐标:120,240"
     */
    export function formatString(formatter: string, data: any[] | object): string {
        if (data == null) return '';
        let s = String(formatter);
        let keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
            let k = keys[i];
            s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), data[k]);
        }
        return s;
    }

    /**
     * 格式化字符串后执行求值运算
     * @param formatter 可包含变量的表达式模板
     * @param data 替换数据对象
     * @returns 表达式计算结果
     * @example
     * // 计算玩家属性
     * evalFormateStr('{atk} * {critMultiplier}', {atk: 100, critMultiplier: 2.5}); // 返回 250
     * @warning 注意eval的安全风险，请勿用于不可信输入
     */
    export function evalFormateStr(formatter: string, data: any) {
        let str = formatString(formatter, data);
        return eval(str);
    }


    /**
     * 将数字转换为带单位的字符串
     * @param n 要转换的数字
     * @param units 单位数组（按单位从小到大排列，如[ 'K', 'M', 'B']）
     * @param unitLen 每个单位对应的数字长度（如3表示每3位换一个单位）
     * @param digits 小数保留位数（默认2）
     * @example num2strWithUnit(123456, ['K', 'M', 'B'], 3) -> "123.45K"
     * num2strWithUnit(123456, ['万', '亿'], 4) -> "12.34万"
     */
    export function num2strWithUnit(n: number, units: string[], unitLen: number, digits: number = 2): string {
        // 处理空值情况
        if (n == null) return '';

        // 将数字转换为字符串并获取长度
        const s = String(n);
        const len = s.length;
        const ul = unitLen;
        // 如果数字长度小于等于单位长度，直接返回原数字字符串
        if (len <= ul) return String(n);

        // 计算单位层级和余数
        // 例：数字长度5位，单位长度3位时，level=1（对应千位单位），remainder=2
        const level = Math.floor(len / ul);
        const remainder = len % unitLen;

        // 计算格式化数值（保留两位小数）：
        // 1. 确定需要截断的位数 = 单位层级对应的总位数 - 余数处理偏移 - 小数保留位数
        // 2. 截断后除以100得到小数保留位数的小数
        // 例：n=12345（5位），unitLen=3，level=1，remainder=2
        //    截断位数 = 1*3 - (remainder?0:unitLen) -2 = 3 -0 -2 =1 → 10^1=10
        //    n/10=1234.5 → floor=1234 → 1234/100=12.34
        const digitsToCut = level * unitLen - (remainder === 0 ? unitLen : 0) - digits;
        const a = Math.floor(n / Math.pow(10, digitsToCut)) / Math.pow(10, digits);

        // 计算单位索引：
        // 1. 基础索引 = 总单位层级 - 1（数组从0开始）
        // 2. 余数为0时需要再减1（处理整除数情况）
        // 例：数字长度4位，unitLen=3 → level=1，remainder=1 → 索引 1-1=0（对应第一个单位）
        //    数字长度6位，unitLen=3 → level=2，remainder=0 → 索引 2-1-1=0（对应第二个单位需要减1）
        const unitIndex = level - 1 - (remainder === 0 ? 1 : 0);
        return a + units[unitIndex];
    }

    /**
     * 大数字缩写格式化
     * @param n 需要格式化的数字
     * @returns 格式化后的字符串（最多保留1位小数）
     * @example
     * num2str(2500);     // 返回 "2.5K"
     * num2str(1350000);  // 返回 "1.3M"
     * num2str(999);      // 返回 "999"
     * num2str(1234567);  // 返回 "1.2B"
     */
    export function num2str(n: number): string {
        if (n == null) return '';
        if (n < 1000) return String(n);
        let unit = ['K', 'M', 'B'];
        let s = String(n);
        let len = s.length;
        let l = len % 3;

        // 计算显示数值部分
        let displayValue = '';
        if (l === 1) { // 处理类似 1,500 -> 1.5K
            displayValue = `${s[0]}.${s[1]}`;
        } else { // 处理类似 12,500 -> 12.5K 或 123,456 -> 123K
            displayValue = s.slice(0, l || 3);
            if (l === 0) displayValue = s.slice(0, 3);
        }

        // 计算单位索引
        const unitIndex = Math.floor(len / 3) - 1 - (l === 0 ? 1 : 0);
        return displayValue + unit[unitIndex];
    }



    /**
     * 连接多个字符串并过滤空值
     * @param separator 连接分隔符
     * @param strs 要连接的字符串数组（支持null/undefined过滤）
     * @returns 拼接后的字符串
     * @example
     * // 拼接文件路径
     * const path = no.joinStrings('/', 'usr', 'local', 'bin'); // 返回 "usr/local/bin"
     * // 拼接API参数
     * const params = no.joinStrings('&', 'name=John', null, 'age=25'); // 返回 "name=John&age=25"
     */
    export function joinStrings(separator: string, ...strs: string[]): string {
        let a: string[] = [];
        for (let i = 0, n = strs.length; i < n; i++) {
            const str = strs[i];
            if (str != null && str != '') {
                a[a.length] = str;
            }
        }
        return a.join(separator);
    }

    /**
     * 使用点号连接多个字符串
     * @param strs 要连接的字符串数组
     * @returns 拼接后的字符串
     * @example
     * // 组合API版本号
     * const version = no.join('1', '0', '3'); // 返回 "1.0.3"
     * // 创建命名空间
     * const namespace = no.join('game', 'utils', 'math'); // 返回 "game.utils.math"
     */
    export function join(...strs: string[]): string {
        return joinStrings('.', ...strs);
    }


    /**
     * SP加密算法1.0版本 - 加密方法
     * @param b 需要加密的原始数据（支持字符串或对象）
     * @returns 加密后的Base64格式字符串
     * @example
     * // 加密字符串
     * const encrypted = SPEncrypt1_0_Encrypt1('hello123'); 
     * // 加密对象（会自动序列化）
     * const encryptedObj = SPEncrypt1_0_Encrypt1({user: 'admin', score: 100});
     */
    export function SPEncrypt1_0_Encrypt1(b: any) {
        if (b == null) return '';
        b = ToUTF8(b); // 转换为UTF-8字节数组
        // 生成固定加密密钥（1e8的整数形式）
        for (var e = Math.floor(1e8 * 1),
            // 计算需要分割的4字节块数量
            d = (b.length >> 2) + (0 < b.length % 4 ? 1 : 0),
            c = [], a = 0; a < d; a++)
            // 将4个字节组合为32位整数并进行异或加密
            (c[a] = b[4 * a] | (b[4 * a + 1] << 8) | (b[4 * a + 2] << 16) | (b[4 * a + 3] << 24)), (c[a] ^= e);
        c[d] = e; // 在数据末尾附加加密密钥
        // 将加密后的32位整数重新拆分为字节数组
        b = [];
        for (a = 0; a <= d; a++)
            (b[4 * a] = c[a] & 255),          // 取最低8位
                (b[4 * a + 1] = (c[a] >> 8) & 255),  // 次低8位
                (b[4 * a + 2] = (c[a] >> 16) & 255), // 次高8位 
                (b[4 * a + 3] = (c[a] >> 24) & 255); // 最高8位
        return bytes2String(b); // 转换为Base64字符串
    }

    /**
     * 将字符串转换为UTF-8字节数组
     * @param str 需要转换的原始字符串
     * @returns UTF-8编码的字节数组
     * @example
     * // 返回 [97, 98, 99]
     * ToUTF8('abc');
     * 
     * // 处理中文返回多字节数组
     * ToUTF8('中文'); // 返回 [228, 184, 173, 230, 150, 135]
     */
    export function ToUTF8(str: string) {
        if (str == null) return [];
        var result = new Array();
        var k = 0;
        // 逐个字符处理编码
        for (var i = 0; i < str.length; i++) {
            var j = encodeURI(str[i]); // URI编码处理特殊字符
            if (j.length == 1) { // ASCII字符直接转换
                result[k++] = j.charCodeAt(0);
            } else { // 处理多字节编码（如中文）
                var bytes = j.split('%'); // 分割编码单元
                for (var l = 1; l < bytes.length; l++) { // 跳过第一个空元素
                    result[k++] = parseInt('0x' + bytes[l]); // 16进制转十进制
                }
            }
        }
        return result;
    }


    /**
     * 智能拼接路径片段（自动处理斜杠和反斜杠）
     * @param args 路径片段数组（支持空值过滤）
     * @returns 规范化拼接后的路径字符串
     * @example
     * // 基本路径拼接
     * pathjoin('user', 'documents/', 'reports//2024'); // "user/documents/reports/2024"
     * 
     * // 处理混合斜杠和空值
     * pathjoin('C:\\projects', '\\src\\', '\\utils'); // "C/projects/src/utils"
     * 
     * // 处理空字符串参数
     * pathjoin('', 'temp', ''); // "temp"
     */
    export function pathjoin(...args: string[]) {
        let a: string[] = [];
        for (let i = 0, l = args.length; i < l; i++) {
            if (args[i])
                // 统一处理路径片段：移除首尾的斜杠/反斜杠，并清理结尾的路径分隔符
                a[a.length] = args[i].replace('/', '').replace('\\', '').replace(/(\/|\\\\)$/, "");
        }
        return a.join('/');
    }

    /**
     * 从完整路径中提取文件名（支持不同操作系统路径格式）
     * @param path 文件路径字符串
     * @returns 纯文件名（包含扩展名）
     * @example
     * // 基本文件名提取
     * getFileName('downloads/report.pdf'); // "report.pdf"
     * 
     * // 处理Windows路径
     * getFileName('C:\\Users\\docs\\note.txt'); // "note.txt"
     * 
     * // 处理以斜杠结尾的路径
     * getFileName('temp/cache/'); // "cache"
     */
    export function getFileName(path: string): string {
        // 统一处理不同操作系统的路径分隔符，并获取最后一部分
        return path.substring(path.lastIndexOf('/') + 1);
    }


    /**
     * 字符串转字节数组（ASCII编码）
     * @param str 输入字符串
     * @returns Uint8Array字节数组
     * @example
     * string2Bytes("Hello"); // 返回 Uint8Array [72, 101, 108, 108, 111]
     * @note 仅支持ASCII字符，中文等Unicode字符请使用TextEncoder
     */
    export function string2Bytes(str: string): Uint8Array {
        const buffer = new ArrayBuffer(str?.length || 0);
        const bytes = new Uint8Array(buffer);

        if (str) {
            let chars = str.split('');
            for (let i = 0; i < chars.length; i++) {
                bytes[i] = chars[i].charCodeAt(0);
            }
        }

        return bytes;
    }

    /**
     * 字节数组转字符串（ASCII解码）
     * @param bytes Uint8Array字节数组
     * @returns 原始字符串
     * @example
     * bytes2String(new Uint8Array([72, 101, 108, 108, 111])); // 返回 "Hello"
     * @note 仅支持ASCII字符，中文等Unicode字符请使用TextDecoder
     */
    export function bytes2String(bytes: Uint8Array): string {
        let sArr: string[] = [];
        for (let i = 0; i < bytes?.length; i++) {
            sArr[sArr.length] = String.fromCharCode(bytes[i]);
        }
        return sArr.join('');
    }

    /**
     * 字符串转ArrayBuffer（ASCII编码）
     * @param str 输入字符串
     * @returns ArrayBuffer二进制数据
     * @example
     * const buf = string2ArrayBuffer("test");
     * new Uint8Array(buf); // 返回 [116, 101, 115, 116]
     * @see string2Bytes 类似功能的不同返回格式
     */
    export function string2ArrayBuffer(str: string): ArrayBuffer {
        const buffer = new ArrayBuffer(str?.length || 0);
        const bytes = new Uint8Array(buffer);

        if (str) {
            let chars = str.split('');
            for (let i = 0; i < chars.length; i++) {
                bytes[i] = chars[i].charCodeAt(0);
            }
        }

        return buffer;
    }

    /**
     * ArrayBuffer转字符串（ASCII解码）
     * @param buffer 要转换的二进制数据
     * @returns 解码后的字符串
     * @example
     * const buf = new Uint8Array([72, 101, 108, 108, 111]).buffer;
     * arrayBuffer2String(buf); // 返回 "Hello"
     */
    export function arrayBuffer2String(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        return bytes2String(bytes);
    }

    /**
     * Uint8Array转ArrayBuffer（数据复制）
     * @param bytes 要转换的Uint8Array数组
     * @returns 新的ArrayBuffer对象
     * @example
     * const bytes = new Uint8Array([1, 2, 3]);
     * const buffer = Uint8Array2ArrayBuffer(bytes);
     * buffer.byteLength; // 3
     */
    export function Uint8Array2ArrayBuffer(bytes: Uint8Array): ArrayBuffer {
        const arraybuffer = new ArrayBuffer(bytes.length);
        const view = new Uint8Array(arraybuffer);
        view.set(bytes);
        return arraybuffer;
    }

    /**
     * ArrayBuffer转Uint8Array（创建视图）
     * @param buffer 要转换的二进制数据
     * @returns 新的Uint8Array视图
     * @example
     * const buffer = new ArrayBuffer(4);
     * const bytes = ArrayBuffer2Uint8Array(buffer);
     * bytes.length; // 4
     */
    export function ArrayBuffer2Uint8Array(buffer: ArrayBuffer): Uint8Array {
        return new Uint8Array(buffer);
    }

    function testArrayBuffers(buffer1: ArrayBuffer, buffer2: ArrayBuffer): boolean {
        const len1 = buffer1.byteLength;
        const len2 = buffer2.byteLength;
        const view1 = new Uint8Array(buffer1);
        const view2 = new Uint8Array(buffer2);

        if (len1 !== len2) {
            return false;
        }

        for (let i = 0; i < len1; i++) {
            if (view1[i] === undefined || view1[i] !== view2[i]) {
                return false;
            }
        }
        return true;
    }


    /**
     * 填充0
     * @param num 数字
     * @param length 长度
     * @returns 填充0后的字符串
     */
    export function fill0(num: number, length: number) {
        let s = num.toString();
        while (s.length < length) {
            s = '0' + s;
        }
        return s;
    }

    /**
     * 根据分隔符获取字符串的指定索引参数（自动处理越界情况）
     * @param str 原始字符串（非字符串类型直接返回原值）
     * @param split 分隔符（支持多字符分隔）
     * @param index 参数索引（从0开始）
     * @returns 对应索引的参数值（越界时返回最后一个参数）
     * @example
     * // 获取第二个颜色参数
     * getParamByIndex('red,green,blue', ',', 1); // 'green'
     * 
     * // 处理越界索引
     * getParamByIndex('a|b|c', '|', 5); // 'c'
     * 
     * // 处理非字符串输入
     * getParamByIndex(12345, ',', 0); // 12345
     */
    export function getParamByIndex(str: any, split: string, index: number): string {
        if (typeof str !== 'string') return str;
        const a = str.split(split);
        if (a.length > index) {
            return a[index];
        }
        return a[a.length - 1];
    }


    /**
     * 获取字符串字节长度（中文按2字节计算）
     * @param v - 要计算的字符串
     * @returns 字节总长度
     * @example
     * // 返回 7 (中文3字*2 + 英文1字)
     * getStringByteLength('测试a');
     */
    export function getStringByteLength(v: string): number {
        let len = 0;
        for (let i = 0, n = v.length; i < n; i++) {
            v.charCodeAt(i) < 256 ? (len += 1) : (len += 2)
        }
        return len
    }

    /**
     * 按字节长度裁剪字符串
     * @param v - 原始字符串
     * @param maxLen - 最大允许字节长度
     * @param chinese2 - 是否中文按2字节计算（默认true）
     * @returns 裁剪后的字符串
     * @example
     * // 返回 '测试te'（总长度6字节）
     * cutString('测试test', 6);
     */
    export function cutString(v: string, maxLen: number, chinese2 = true): string {
        let len = 0, s: string[] = [];
        for (let i = 0, n = v.length; i < n; i++) {
            v.charCodeAt(i) < 256 ? (len += 1) : (len += 2)
            if (len <= maxLen) {
                s[s.length] = v[i];
            } else break;
        }
        return s.join('');
    }

    /**
     * 将分隔字符串转换为数字数组
     * @param v - 要转换的字符串，如 '1,2,3,4'
     * @param split - 分隔符（默认逗号）
     * @returns 转换后的数字数组
     * @example
     * // 返回 [10, 20, 30]
     * stringToNumberArray('10|20|30', '|');
     */
    export function stringToNumberArray(v: string, split = ','): number[] {
        const a = v.split(split);
        let b: number[] = [];
        for (let i = 0; i < a.length; i++) {
            b[b.length] = Number(a[i]);
        }
        return b;
    }
}