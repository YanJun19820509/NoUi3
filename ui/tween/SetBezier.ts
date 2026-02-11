
import { ccclass, menu } from '../../yj';
import { SetNodeTweenAction } from '../SetNodeTweenAction';
import { TweenSet, parseTweenData } from '../../extend/TweenSet';
import { vecUtils } from '../../extend/vecUtils';

/**
 * Predefined variables
 * Name = SetBezier
 * DateTime = Fri Jan 14 2022 18:35:36 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetBezier.ts
 * FileBasenameNoExtension = SetBezier
 * URL = db://assets/Script/common/tween/SetBezier.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

/**
 * 设置贝塞尔曲线动效
 * @data {
 *     delay?: 1,
*      duration: 1,
*      points: [{x:number,y:number}],//偏移量
*      segment?: 50
 * }
 */
@ccclass('SetBezier')
@menu('NoUi/tween/SetBezier(贝塞尔曲线动效:object')
export class SetBezier extends SetNodeTweenAction {
    /**
     * 创建贝塞尔曲线动画
     * @param data 配置数据 {
     *     delay?: 延迟时间,
     *     duration: 总持续时间,
     *     points: 控制点数组（相对坐标）,
     *     segment?: 曲线分段数（默认50）
     * }
     * @returns 生成的动画数据集
     * 
     * @example
     * createAction({
     *     duration: 2,
     *     points: [{x:100,y:0}, {x:50,y:-100}, {x:0,y:0}],
     *     segment: 30
     * })
     */
    protected createAction(data: any): TweenSet | TweenSet[] {
        // 生成贝塞尔曲线路径点（世界坐标）
        let points = vecUtils.bezierPoints(this.getControlPoints(data.points), data.segment || 50);
        points.shift(); // 移除起始点（节点当前位置）

        // 构建每段动画数据
        let arr: any[] = [];
        if (data.delay) {
            arr.push({ delay: data.delay });
        }
        let t = data.duration / points.length; // 计算每段持续时间
        for (let i = 0; i < points.length; i++) {
            arr.push({
                duration: t,
                to: 1, // 插值方式：1表示线性插值
                props: {
                    pos: [points[i].x, points[i].y] // 目标位置
                }
            });
        }
        const tweenData = parseTweenData(arr, this.node);
        points = null;
        arr = null;
        return tweenData;
    }

    // /**
    //  * 计算贝塞尔曲线路径点
    //  * @param points 控制点数组（相对坐标）
    //  * @param segment 曲线分段数
    //  * @returns 世界坐标路径点数组
    //  * 
    //  * @原理 
    //  * 使用伯恩斯坦多项式计算贝塞尔曲线：
    //  * B(t) = Σ (n-1 choose i) * (1-t)^(n-1-i) * t^i * P_i
    //  * 其中n为控制点数量，t∈[0,1]
    //  */
    // private bezier(points: { x: number, y: number }[], segment: number): Vec2[] {
    //     let arr: Vec2[] = [];
    //     let cPoints = this.getControlPoints(points); // 获取世界坐标控制点
    //     let n = cPoints.length;

    //     // 预计算组合数
    //     let combinations = [];
    //     for (let i = 0; i < n; i++) {
    //         combinations[combinations.length] = no.combination(n - 1, i);
    //     }

    //     // 计算曲线上的点
    //     for (let i = 0; i < segment; i++) {
    //         let t = i / segment;
    //         let p = new Vec2();

    //         // 贝塞尔曲线公式实现
    //         for (let j = 0; j < n; j++) {
    //             let pp = cPoints[j];
    //             let v = combinations[j] * Math.pow((1 - t), (n - 1 - j)) * Math.pow(t, j);
    //             p.add(v2(pp.x, pp.y).multiplyScalar(v));
    //         }
    //         arr[arr.length] = p;
    //     }

    //     // 添加终点确保精度
    //     let end = cPoints[cPoints.length - 1];
    //     arr[arr.length] = v2(end.x, end.y);
    //     return arr;
    // }

    /**
     * 将相对坐标转换为世界坐标
     * @param points 相对坐标点数组
     * @returns 世界坐标点数组（包含起始点）
     * 
     * @示例
     * 节点当前位置(100,200)，输入[{x:50,y:0}]
     * 返回 [
     *   Vec3(100,200),
     *   Vec3(150,200)
     * ]
     */
    private getControlPoints(points: { x: number, y: number }[]): { x: number, y: number }[] {
        let p = this.node.position;
        let ps: { x: number, y: number }[] = [{ x: p.x, y: p.y }];
        for (let i = 0; i < points.length; i++) {
            ps[ps.length] = { x: points[i].x, y: points[i].y };
        }
        return ps;
    }
}