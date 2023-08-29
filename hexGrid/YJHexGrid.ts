
/**
 * 
 * Author mqsy_yj
 * DateTime Tue Aug 29 2023 17:12:31 GMT+0800 (中国标准时间)
 *
 */

import { Hex } from "./HexGrid";

export class YJHexGrid {
    /**
     * 以(0,0)为初始hex，通过directions生成相邻的一组hexs
     * @param directions 相对于hex六个面的方向，0~5，从hex右边面开始顺时针方向数
     */
    public static directionsToHexs(directions: number[]): Hex[] {
        let arr: Hex[] = [Hex.new()];
        for (let i = 0, n = directions.length; i < n; i++) {
            arr[arr.length] = arr[i].neighbor(directions[i]);
        }
        return arr;
    }

    /**
     * 将一组hexs序列化成[q,r]数组
     * @param hexs 
     * @returns 
     */
    public static serializeHexs(hexs: Hex[]): number[][] {
        let arr: number[][] = [];
        hexs.forEach(hex => {
            arr[arr.length] = hex.toNumbers();
        });
        return arr;
    }

    /**
     * 将[q,r]数组反序列化成一组hexs
     * @param arr 
     * @returns 
     */
    public static deserializeHexs(arr: number[][]): Hex[] {
        let hexs: Hex[] = [];
        arr.forEach(a => {
            hexs[hexs.length] = Hex.new(a);
        });
        return hexs;
    }

    /**
     * 将一组hexs转换成targetHex在direction方向上相邻的hex
     * @param targetHex 目标hex
     * @param hexs 需要转换的一组hexs
     * @param direction 相对于targetHex六个面的方向，0~5，从hex右边面开始顺时针方向数
     */
    public static convertToNeighbor(targetHex: Hex, hexs: Hex[], direction: number): Hex[] {
        let a = targetHex.neighbor(direction), b: Hex, arr: Hex[] = [];
        hexs.forEach(hex => {
            if (!b) {
                arr[arr.length] = a;
                b = a.subtract(hex);
            } else {
                arr[arr.length] = hex.add(b);
            }
        });
        return arr;
    }

    
}
