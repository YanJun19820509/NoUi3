/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 11:05:25 GMT+0800 (中国标准时间)
 *
 */

import { color, Color } from "../yj";

export namespace colorUtils {


    /**
     * 十六进制颜色转RGB对象
     * @param hex 十六进制颜色字符串，支持 # 开头或省略
     * @returns 包含r,g,b属性的对象（值范围0-255），无效格式返回null
     * @example
     * hex2Rgb('#ff0000');    // 返回 {r: 255, g: 0, b: 0}
     * hex2Rgb('00ff00');     // 返回 {r: 0, g: 255, b: 0}
     * hex2Rgb('invalid');    // 返回 null
     */
    export function hex2Rgb(hex: string) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * 字符串转Color对象
     * @param v 颜色字符串，支持十六进制格式（#RGB或#RRGGBB）
     * @returns 对应的Color对象
     * @example
     * str2Color('#ff0000');  // 返回红色
     * str2Color('#0f0');     // 返回绿色
     * str2Color('0000ff');   // 返回蓝色
     */
    export function str2Color(v: string): Color {
        let c = color();
        Color.fromHEX(c, v);
        return c;
    }
}