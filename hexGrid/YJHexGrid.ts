
/**
 * 
 * Author mqsy_yj
 * DateTime Tue Aug 29 2023 17:12:31 GMT+0800 (中国标准时间)
 *
 */

import { AStar } from "../a_star/AStar";
import { Hex } from "./HexGrid";


export enum OrientationType {
    Flat = 0,
    Pointy
};
export class YJHexGrid {
    /**
     * 以(0,0)为初始hex，通过directions生成相邻的一组hexs
     * @param directions 相对于hex六个面的方向，0~5（从hex右边面开始顺时针方向数）
     * @returns 按方向序列生成的六边形坐标数组
     * @example
     * // 生成向右、右下、左下方向的hex序列：
     * directionsToHexs([0, 2, 4]) → 
     * [Hex(0,0,0), Hex(1,0,-1), Hex(1,-1,0), Hex(0,-1,1)]
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
     * @param hexs 需要序列化的六边形坐标数组
     * @returns 二维数组格式的坐标数据（每个元素为[q, r]）
     * @example
     * serializeHexs([Hex(1,2), Hex(3,4)]) → [[1,2], [3,4]]
     */
    public static serializeHexs(hexs: Hex[]): number[][] {
        let arr: number[][] = [];
        for (let i = 0; i < hexs.length; i++) {
            arr.push(hexs[i].toNumbers());
        }
        return arr;
    }

    /**
     * 将[q,r]数组反序列化成一组hexs
     * @param arr 二维数组格式的坐标数据（每个元素为[q, r]）
     * @returns 还原后的六边形坐标数组
     * @example
     * deserializeHexs([[1,2], [3,4]]) → [Hex(1,2,-3), Hex(3,4,-7)]
     */
    public static deserializeHexs(arr: number[][]): Hex[] {
        let hexs: Hex[] = [];
        for (let i = 0; i < arr.length; i++) {
            hexs.push(Hex.new(arr[i]));
        }
        return hexs;
    }

    /**
     * 将一组hexs转换成targetHex在direction方向上相邻的hex
     * @param targetHex 目标基准六边形坐标
     * @param hexs 需要转换的原始六边形坐标数组
     * @param direction 相邻方向（0-5）
     * @returns 转换后的新六边形坐标数组
     * @example
     * // 将原点周围坐标转换到Hex(2,3)的右侧相邻位置：
     * convertToNeighbor(Hex(2,3), [Hex(0,0), Hex(1,0)], 0) → 
     * [Hex(3,3,-6), Hex(4,3,-7)]
     */
    public static convertToNeighbor(targetHex: Hex, hexs: Hex[], direction: number): Hex[] {
        let a = targetHex.neighbor(direction), b: Hex, arr: Hex[] = [];
        for (let i = 0; i < hexs.length; i++) {
            if (!b) {
                arr.push(a);
                b = a.subtract(hexs[i]); // 计算坐标偏移量
            } else {
                arr.push(hexs[i].add(b)); // 应用偏移量到所有坐标
            }
        }
        return arr;
    }

    /**
     * A*寻路算法实现
     * @param startHex 路径起点六边形坐标
     * @param endHex 路径终点六边形坐标
     * @param unobstructedHexs 可通过的六边形坐标数组（障碍物补集）
     * @returns 找到的路径数组（如不可达返回空数组）
     * @example
     * // 在3x3网格中寻找从中心到右上的路径：
     * findPath(Hex(0,0), Hex(1,-1), [Hex(0,0), Hex(1,0), Hex(0,-1), Hex(1,-1)]) 
     * → [Hex(0,0,0), Hex(1,0,-1), Hex(1,-1,0)]
     */
    public static findPath(startHex: Hex, endHex: Hex, unobstructedHexs?: Hex[]): Hex[] {
        const task = new AStar.Task();
        task.setStart(startHex.toNumbers());
        task.setEnd(endHex.toNumbers());
        let arr: number[][] = [], path: Hex[] = [];
        for (let i = 0, len = unobstructedHexs.length; i < len; i++) {
            arr[i] = unobstructedHexs[i].toNumbers();
        }
        task.setEmptyGroundFromArray(arr);
        let pathArr = task.findPath();
        for (let i = 0; i < pathArr.length; i++) {
            path.push(Hex.new(pathArr[i].x, pathArr[i].y));
        }
        return path;
    }

    /**
     * 将角度转换为六边形方向
     * @param angle 输入角度（0-360度）
     * @param orientation 网格朝向类型（平顶/尖顶）
     * @returns 对应的方向编号（0-5）
     * @example
     * // 平顶布局下：
     * angleToDirection(45°, Flat) → 5
     * // 尖顶布局下： 
     * angleToDirection(45°, Pointy) → 0
     */
    public static angleToDirection(angle: number, orientation: OrientationType): number {
        if (orientation == OrientationType.Flat) {
            if (angle < 60) return 5;   // 右上方
            if (angle < 120) return 4;  // 左上方
            if (angle < 180) return 3;  // 左方
            if (angle < 240) return 2;  // 左下方
            if (angle < 300) return 1;  // 右下方
            if (angle < 360) return 0;  // 右方
        } else {
            if (angle < 30) return 0;   // 右方
            if (angle < 90) return 5;   // 右上方
            if (angle < 150) return 4;  // 左上方
            if (angle < 210) return 3;  // 左方
            if (angle < 270) return 2;  // 左下方
            if (angle < 330) return 1;  // 右下方
            if (angle < 360) return 0;  // 右方
        }
    }

    /**
     * 获取相反方向
     * @param dirention 原始方向（0-5）
     * @returns 相反方向编号
     * @example 
     * oppositeDirection(1) → 4
     * oppositeDirection(5) → 2
     */
    public static oppositeDirection(dirention: number): number {
        if (dirention < 3) return dirention + 3;
        return dirention - 3;
    }
}
