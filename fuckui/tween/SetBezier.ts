
import { _decorator, tween, Vec2, v2, Vec3, v3 } from 'cc';
import { no } from '../../no';
import { SetNodeTweenAction } from '../SetNodeTweenAction';
const { ccclass, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetBezier
 * DateTime = Fri Jan 14 2022 18:35:36 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetBezier.ts
 * FileBasenameNoExtension = SetBezier
 * URL = db://assets/Script/NoUi3/tween/SetBezier.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

/**
 * 设置贝塞尔曲线动效
 * @data {
 *     delay?: 1,
*      duration: 1,
*      points: [{x:number,y:number}],//偏移量
*      segment?: 3
 * }
 */
@ccclass('SetBezier')
@menu('NoUi/tween/SetBezier(贝塞尔曲线动效:object')
export class SetBezier extends SetNodeTweenAction {
    protected createAction(data: any): no.TweenSet | no.TweenSet[] {
        let points = this.bezier(data.points, data.segment || 3);
        points.shift();
        let d = [];
        let t = data.duration / points.length;
        points.forEach(p => {
            d[d.length] = {
                duration: t,
                to: 1,
                props: {
                    pos: [p.x, p.y]
                }
            };
        });
        return no.parseTweenData(d, this.node);
    }

    private bezier(points: { x: number, y: number }[], segment: number): Vec2[] {
        let arr: Vec2[] = [];
        let cPoints = this.getControlPoints(points);
        let n = cPoints.length;
        let coms = [];
        for (let i = 0; i < n; i++) {
            coms[coms.length] = no.combination(n - 1, i);
        }
        for (let i = 0; i < segment; i++) {
            let t = i / segment;
            let p = new Vec2();

            for (let j = 0; j < n; j++) {
                let pp = cPoints[j];
                let v = coms[j] * Math.pow((1 - t), (n - 1 - j)) * Math.pow(t, j);
                p.add(v2(pp.x, pp.y).multiplyScalar(v));
            }
            arr[arr.length] = p;
        }
        let end = cPoints[cPoints.length - 1];
        arr[arr.length] = v2(end.x, end.y);
        return arr;
    }

    private getControlPoints(points: { x: number, y: number }[]): Vec3[] {
        let p = this.node.position;
        let ps: Vec3[] = [p];
        points.forEach(point => {
            ps[ps.length] = v3(point.x + p.x, point.y + p.y);
        });
        return ps;
    }
}