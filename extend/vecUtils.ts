/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 11:55:16 GMT+0800 (中国标准时间)
 *
 */

import { no } from "../no";
import { Rect, v2, Vec2, Vec3 } from "../yj";
import { mathUtils } from "./mathUtils";

export namespace vecUtils {

    const _angleToCache: { angle: number, radian: number } = { angle: 0, radian: 0 };
    /**
     * 计算两点之间的角度（以p1为圆心，从水平正X轴到p2的夹角）
     * @param p1 圆心/起点坐标（支持Vec2或Vec3类型）
     * @param p2 目标点坐标（支持Vec2或Vec3类型）
     * @returns 包含角度（0-360度）和弧度（-π~π）的对象
     * @example
     * // 计算玩家朝向敌人的角度
     * const playerPos = new Vec3(0, 0, 0);
     * const enemyPos = new Vec3(1, 1, 0);
     * const angleInfo = angleTo(playerPos, enemyPos);
     * console.log(`攻击角度：${angleInfo.angle}度`);
     * 
     * // 处理2D坐标
     * const from = new Vec2(0, 0);
     * const to = new Vec2(0, 1);
     * console.log(angleTo(from, to).radian); // 输出1.5708（π/2）
     */
    export function angleTo(p1: Vec2 | Vec3 | { x: number, y: number }, p2: Vec2 | Vec3 | { x: number, y: number }): { angle: number, radian: number } {
        if (p1 == null || p2 == null) {
            _angleToCache.angle = 0;
            _angleToCache.radian = 0;
            return _angleToCache;
        }
        const b = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        _angleToCache.angle = radianToAngle(b);
        _angleToCache.radian = b;
        return _angleToCache;
    }

    export const RAD_TO_DEG = 180 / Math.PI;
    /**
     * 将弧度转换为角度
     * @param radian 弧度
     * @returns 角度
     */
    export function radianToAngle(radian: number): number {
        const angle = radian * RAD_TO_DEG;
        return angle >= 0 ? angle : angle + 360;
    }

    const sinTable: number[] = [];
    const cosTable: number[] = [];
    const SinCosSize = 124;
    for (let i = 0; i <= SinCosSize; i++) {
        const angle = (i - 62) * 0.1;
        sinTable[i] = Math.sin(angle);
        cosTable[i] = Math.cos(angle);
    }
    export function fastSin(radian: number): number {
        radian = radian % (2 * Math.PI);
        const index = (radian * 10 + 62) | 0;
        return sinTable[index] || 0;
    }
    export function fastCos(radian: number): number {
        radian = radian % (2 * Math.PI);
        const index = (radian * 10 + 62) | 0;
        return cosTable[index] || 0;
    }
    /**
     * 将角度转换为弧度
     * @param angle 角度
     * @returns 弧度
     */
    export function angleToRadian(angle: number): number {
        if (angle > 180) angle -= 360;
        return angle / 180 * Math.PI;
    }

    /**
     * 计算两点之间的距离
     * @param p1 点1坐标
     * @param p2 点2坐标
     * @returns 距离
     * @example
     * // 计算玩家与目标点之间的距离
     * const playerPos = new Vec3(0, 0, 0);
     * const targetPos = new Vec3(1, 1, 0);
     * const distance = distance(playerPos, targetPos);
     */
    export function distance(p1: Vec2 | Vec3 | { x: number, y: number }, p2: Vec2 | Vec3 | { x: number, y: number }): number {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    /**
     * 粗略判断两个点是否靠近
     * @param pos1 点1坐标
     * @param pos2 点2坐标
     * @param radius1 点1的检测半径
     * @param radius2 点2的检测半径
     * @returns 是否在范围内
     */
    export function isNear(pos1: { x: number, y: number }, pos2: { x: number, y: number }, radius1: number, radius2: number) {
        return !(pos2.x < pos1.x - radius1 - radius2
            || pos2.x > pos1.x + radius1 + radius2
            || pos2.y < pos1.y - radius1 - radius2
            || pos2.y > pos1.y + radius1 + radius2);
    }

    /**
     * 判断直线是否与矩形相交
     * @param line 直线段对象，包含起点p1和终点p2
     * @param rect 矩形区域（需使用Rect类型）
     * @returns 是否相交（true表示相交，false表示不相交）
     * @example
     * // 创建测试直线和矩形
     * const line1 = { p1: v2(10, 10), p2: v2(300, 200) };
     * const rect1 = new Rect(50, 50, 200, 150);
     * console.log(lineIntersetsRect(line1, rect1)); // true
     * 
     * // 完全在矩形内部的直线
     * const line2 = { p1: v2(60, 60), p2: v2(180, 120) };
     * console.log(lineIntersetsRect(line2, rect1)); // true
     * 
     * // 完全在矩形外部的直线
     * const line3 = { p1: v2(0, 0), p2: v2(30, 30) };
     * console.log(lineIntersetsRect(line3, rect1)); // false
     */
    export function lineIntersetsRect(line: { p1: Vec2, p2: Vec2 }, rect: Rect): boolean {
        const { p1, p2 } = line;
        if (rect.contains(p1) || rect.contains(p2)) return true;
        if (p1.x < rect.xMin && p2.x < rect.xMin) return false;
        if (p1.x > rect.xMax && p2.x > rect.xMax) return false;
        if (p1.y < rect.yMin && p2.y < rect.yMin) return false;
        if (p1.y > rect.yMax && p2.y > rect.yMax) return false;
        const pMin = v2(), pMax = v2();
        if (p1.x < rect.xMin) {
            pMin.x = rect.xMin;
            pMin.y = rect.yMin;
            pMax.x = rect.xMin;
            pMax.y = rect.yMax;
        } else if (p1.x > rect.xMax) {
            pMin.x = rect.xMax;
            pMin.y = rect.yMin;
            pMax.x = rect.xMax;
            pMax.y = rect.yMax;
        } else if (p1.y < rect.yMin) {
            pMin.x = rect.xMin;
            pMin.y = rect.yMin;
            pMax.x = rect.xMax;
            pMax.y = rect.yMin;
        } else if (p1.y > rect.yMax) {
            pMin.x = rect.xMin;
            pMin.y = rect.yMax;
            pMax.x = rect.xMax;
            pMax.y = rect.yMax;
        }
        const a_p1_pMin = angleTo(p1, pMin).angle,
            a_p1_pMax = angleTo(p1, pMax).angle,
            a_p1_p2 = angleTo(p1, p2).angle;
        return a_p1_p2 >= a_p1_pMin && a_p1_p2 <= a_p1_pMax || a_p1_p2 >= a_p1_pMax && a_p1_p2 <= a_p1_pMin;
    }

    /**
     * 矩形相交
     * @param rect1 矩形1
     * @param rect2 矩形2
     * @returns 是否相交
     */
    export function rectIntersectsRect(rect1: { minX: number, minY: number, maxX: number, maxY: number }, rect2: { minX: number, minY: number, maxX: number, maxY: number }) {
        // 判断两个矩形是否相交
        // 只要有一条边不重叠就不相交
        return !(
            rect1.maxX < rect2.minX ||
            rect1.minX > rect2.maxX ||
            rect1.maxY < rect2.minY ||
            rect1.minY > rect2.maxY
        );
    }

    /**
     * 点是否在矩形内
     * @param point 点
     * @param rect 矩形
     * @returns 是否在矩形内
     */
    export function pointInRect(point: { x: number, y: number }, rect: { minX: number, minY: number, maxX: number, maxY: number }) {
        return point.x >= rect.minX && point.x <= rect.maxX && point.y >= rect.minY && point.y <= rect.maxY;
    }

    /**
     * 点是否在矩形内（带旋转）
     * @param point 要检测的点
     * @param pos 矩形中心点
     * @param rect 矩形
     * @param radian 旋转弧度
     * @returns 是否在矩形内
     */
    export function pointInRectWithRotation(point: { x: number, y: number }, pos: { x: number, y: number }, rect: { minX: number, minY: number, maxX: number, maxY: number }, radian: number) {
        const p = rotatePointByCenter(point, pos, -radian);
        return pointInRect(p, rect);
    }

    /**
     * 向量叉积公式
     * @param A 点
     * @param B 点
     * @param P 点
     * @returns 叉积
     */
    function crossProduct(A: Vec2 | { x: number, y: number }, B: Vec2 | { x: number, y: number }, P: Vec2 | { x: number, y: number }): number {
        return (B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x);
    }

    /**
     * 同向法（叉积法）​判断点是否在三角形内
     * 原理​：若点 P 在三角形 ABC 内部，则它必须位于所有边的同一侧（左侧或右侧，取决于三角形方向）。通过叉积符号判断方向
     * @param P 点
     * @param A 三角形顶点
     * @param B 三角形顶点
     * @param C 三角形顶点
     * @returns 是否在三角形内
     */
    export function isPointInTriangle(P: Vec2 | { x: number, y: number }, A: Vec2 | { x: number, y: number }, B: Vec2 | { x: number, y: number }, C: Vec2 | { x: number, y: number }) {
        const cpAB = crossProduct(A, B, P);  // P 相对 AB 的位置
        const cpBC = crossProduct(B, C, P);  // P 相对 BC 的位置
        const cpCA = crossProduct(C, A, P);  // P 相对 CA 的位置

        // 检查是否同侧（包含边界）
        return (
            (cpAB >= 0 && cpBC >= 0 && cpCA >= 0) ||
            (cpAB <= 0 && cpBC <= 0 && cpCA <= 0)
        );
    }



    /**
     * 贝塞尔曲线点数组
     * @param points 控制点数组,可以是二或三个点
     * @param segment 分段数
     * @param isInt 是否取整
     * @returns 贝塞尔曲线点
     */
    export function bezierPoints(points: Vec2[] | { x: number, y: number }[], segment: number, isInt = true): { x: number, y: number }[] {
        let arr: { x: number, y: number }[] = [];
        let n = points.length;
        if (n > 4) {
            //多阶用通用公式计算
            // 预计算组合数
            let combinations = [];
            for (let i = 0; i < n; i++) {
                combinations[combinations.length] = mathUtils.combination(n - 1, i);
            }

            // 计算曲线上的点
            for (let i = 0; i < segment; i++) {
                let t = i / segment;
                let p = { x: 0, y: 0 };

                // 贝塞尔曲线公式实现
                for (let j = 0; j < n; j++) {
                    let pp = points[j];
                    let v = combinations[j] * Math.pow((1 - t), (n - 1 - j)) * Math.pow(t, j);
                    p.x += pp.x * v;
                    p.y += pp.y * v;
                }
                if (isInt) {
                    p.x = Math.floor(p.x);
                    p.y = Math.floor(p.y);
                }
                arr[arr.length] = p;
            }
        } else if (n == 4) {
            //三阶用三次贝塞尔曲线公式计算
            for (let i = 0; i < segment; i++) {
                let t = i / segment;
                let p = mathUtils.bezierCubic(t, points[0], points[1], points[2], points[3]);
                if (isInt) {
                    p.x = Math.floor(p.x);
                    p.y = Math.floor(p.y);
                }
                arr[arr.length] = p;
            }
        } else if (n == 3) {
            //二阶用二次贝塞尔曲线公式计算
            for (let i = 0; i < segment; i++) {
                let t = i / segment;
                let p = mathUtils.bezierQuadratic(t, points[0], points[1], points[2]);
                if (isInt) {
                    p.x = Math.floor(p.x);
                    p.y = Math.floor(p.y);
                }
                arr[arr.length] = p;
            }
        } else if (n == 2) {
            //一阶用线性插值计算
            for (let i = 0; i < segment; i++) {
                let t = i / segment;
                let p = { x: points[0].x + (points[1].x - points[0].x) * t, y: points[0].y + (points[1].y - points[0].y) * t };
                if (isInt) {
                    p.x = Math.floor(p.x);
                    p.y = Math.floor(p.y);
                }
                arr[arr.length] = p;
            }
        }

        // 添加终点确保精度
        let end = points[points.length - 1];
        arr[arr.length] = { x: end.x, y: end.y };
        return arr;
    }

    /**
     * 检查点是否在直线上
     * @param line 直线
     * @param point 点
     * @param precision 精度
     * @returns 是否在直线上
     */
    export function checkPointInLine(line: { x: number, y: number }[], point: { x: number, y: number }, precision: number = 5) {
        if (!line[0] || !line[1] || !point) return false;
        const dis1 = distance(line[0], point);
        const dis2 = distance(line[1], point);
        const dis3 = distance(line[0], line[1]);
        return (dis1 + dis2) <= (dis3 + precision);
    }

    const _tempPoint: { x: number, y: number } = { x: 0, y: 0 };
    /**
     * 旋转点
     * @param point 点
     * @param radian 旋转角度
     * @returns 旋转后的点
     */
    export function rotatePoint(point: { x: number, y: number }, radian: number) {
        if (radian == 0) return point;
        const cos = Math.cos(radian);
        const sin = Math.sin(radian);
        _tempPoint.x = point.x * cos - point.y * sin;
        _tempPoint.y = point.x * sin + point.y * cos;
        point = null;
        return _tempPoint;
    }

    /**
     * 以中心点旋转点
     * @param point 点
     * @param center 中心点
     * @param radian 旋转角度
     * @returns 旋转后的点
     */
    export function rotatePointByCenter(point: { x: number, y: number }, center: { x: number, y: number }, radian: number) {
        let x = point.x - center.x;
        let y = point.y - center.y;
        const rotated = rotatePoint({ x, y }, radian);
        rotated.x += center.x;
        rotated.y += center.y;
        return rotated;
    }

    const _calculateProjectileMotionCache: {
        timeToPeak: number,
        maxHeight: number,
        totalTime: number,
        range: number,
        horizontalSpeed: number,
        verticalSpeed: number,
        peakVelocity: number
    } = { timeToPeak: 0, maxHeight: 0, totalTime: 0, range: 0, horizontalSpeed: 0, verticalSpeed: 0, peakVelocity: 0 };
    /**
     * 计算斜抛运动参数（考虑重力加速度）
     * @param initialSpeed 初速度（单位：米/秒）
     * @param angle 发射角度（单位：度，0-90度）
     * @param gravity 重力加速度（单位：米/秒²，默认9.8）
     * @returns 包含各种运动参数的对象
     * @example
     * // 计算导弹发射参数
     * const missileData = no.calculateProjectileMotion(100, 45, 9.8);
     * console.log(`最高点时间：${missileData.timeToPeak}秒`);
     * console.log(`最大高度：${missileData.maxHeight}米`);
     * console.log(`总飞行时间：${missileData.totalTime}秒`);
     * console.log(`水平射程：${missileData.range}米`);
     * 
     * // 游戏中的子弹轨迹计算
     * const bulletData = no.calculateProjectileMotion(50, 30);
     * this.scheduleOnce(() => {
     *   // 在最高点时触发特效
     *   this.showPeakEffect();
     * }, bulletData.timeToPeak);
     */
    export function calculateProjectileMotion(initialSpeed: number, angle: number, gravity: number, maxDistance?: number): {
        timeToPeak: number,      // 到达最高点时间
        maxHeight: number,       // 最大高度
        totalTime: number,       // 总飞行时间
        range: number,           // 水平射程
        horizontalSpeed: number, // 水平速度分量
        verticalSpeed: number,   // 垂直速度分量
        peakVelocity: number     // 最高点时的水平速度
    } {
        // 将角度转换为弧度
        const angleRad = angleToRadian(angle);

        // 分解速度分量
        _calculateProjectileMotionCache.horizontalSpeed = initialSpeed * Math.cos(angleRad);
        _calculateProjectileMotionCache.verticalSpeed = initialSpeed * Math.sin(angleRad);

        // 计算到达最高点的时间（垂直速度减为0的时间）
        _calculateProjectileMotionCache.timeToPeak = Math.abs(_calculateProjectileMotionCache.verticalSpeed / gravity);

        // 计算最大高度（使用运动学公式：h = v0*t - 0.5*g*t²）
        _calculateProjectileMotionCache.maxHeight = _calculateProjectileMotionCache.verticalSpeed * _calculateProjectileMotionCache.timeToPeak - 0.5 * gravity * _calculateProjectileMotionCache.timeToPeak * _calculateProjectileMotionCache.timeToPeak;

        // 计算总飞行时间（从发射到落地的时间）
        _calculateProjectileMotionCache.totalTime = maxDistance ? Math.abs(maxDistance / _calculateProjectileMotionCache.horizontalSpeed) : 0;

        // 计算水平射程
        _calculateProjectileMotionCache.range = _calculateProjectileMotionCache.horizontalSpeed * _calculateProjectileMotionCache.timeToPeak * 2;

        return _calculateProjectileMotionCache;
    }

    const _calculateProjectileMotionAtTimeCache: { x: number, y: number, angleChange: number, horizontalDistance: number, verticalDistance: number } = { x: 0, y: 0, angleChange: 0, horizontalDistance: 0, verticalDistance: 0 };
    /**
     * 计算斜抛物体在指定时间的运动参数
     * @param initialSpeed 初速度（单位：米/秒）
     * @param angle 发射角度（单位：度，0-90度）
     * @param time 指定时间（单位：秒）
     * @param gravity 重力加速度（单位：米/秒²，默认9.8）
     */
    export function calculateProjectileMotionAtTime(horizontalSpeed: number, verticalSpeed: number, time: number, gravity: number) {
        _calculateProjectileMotionAtTimeCache.x = horizontalSpeed * time;
        _calculateProjectileMotionAtTimeCache.y = verticalSpeed * time - 0.5 * gravity * time * time;
        const newVerticalSpeed = verticalSpeed - gravity * time;

        //计算角度变化
        _calculateProjectileMotionAtTimeCache.angleChange = Math.atan(newVerticalSpeed / horizontalSpeed) * 180 / Math.PI;
        if (horizontalSpeed < 0) _calculateProjectileMotionAtTimeCache.angleChange += 180;
        _calculateProjectileMotionAtTimeCache.horizontalDistance = horizontalSpeed * time;
        _calculateProjectileMotionAtTimeCache.verticalDistance = verticalSpeed * time - 0.5 * gravity * time * time;
        return _calculateProjectileMotionAtTimeCache;
    }

    /**
     * 计算斜抛运动角度
     * @param speed 初速度
     * @param horizontalDistance 水平距离
     * @param verticalDistance 垂直距离
     * @param gravity 重力加速度
     */
    export function calculateProjectileMotionRadian(S: number, H: number, V: number, g: number) {
        if (S <= 0) {
            no.err("初速度 S 必须大于0");
            return null;
        }
        if (g <= 0) {
            no.err("重力加速度 g 必须大于0");
            return null;
        }
        if (H === 0) {
            // 水平位移为0时，抛射角固定为90度（竖直方向）
            return [Math.PI / 2];
        }

        // 计算二次方程系数
        const a = (g * H * H) / (2 * S * S);
        const b = -H;
        const c = V + (g * H * H) / (2 * S * S);

        // 计算判别式
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) {
            no.err("无实数解，给定条件下不存在符合条件的抛物线运动");
            return null;
        }

        // 计算根
        const sqrtDiscriminant = Math.sqrt(discriminant);
        const u1 = (H + sqrtDiscriminant) / (2 * a);
        const u2 = (H - sqrtDiscriminant) / (2 * a);

        // 筛选有效解（tanθ > 0）
        // const validUs = [u1, u2].filter(u => u > 0);
        const validUs = [u1, u2];

        // 转换为抛射角（弧度）
        const angles = validUs.map(u => Math.atan(u));

        // 验证结果非空（理论上至少有一个解，因判别式已检查）
        if (angles.length === 0) {
            no.err("无有效抛射角解");
            return null;
        }

        return angles;
    }

    /**
     * 计算反射角
     * @param dir 入射角
     * @param angle 接触面角度
     * @returns 反射角
     */
    export function calculateReboundAngle(dir: number, angle: number) {
        let a = dir;
        if (a < 0) a += 180;
        else if (a > 180) a -= 180;
        a = 180 - a;//相对于水平面的反射角
        a += angle * 2;//加上接触面角度
        return a;
    }


    /**
     * 将三维坐标转换为二维坐标（丢弃z轴）
     * @param v3 三维坐标对象
     * @returns 二维坐标对象
     * @example
     * // 在2D游戏中处理3D模型位置
     * const model3DPos = new Vec3(100, 200, 0);
     * const uiPos = no.vec3ToVec2(model3DPos);
     * this.uiWidget.node.position = uiPos;
     */
    export function vec3ToVec2(v3: Vec3): Vec2 {
        return new Vec2(v3.x, v3.y);
    }

    /**
     * 将二维坐标转换为三维坐标（z轴默认为0）
     * @param v2 二维坐标对象
     * @returns 三维坐标对象
     * @example
     * // 将UI坐标转换为3D世界坐标
     * const uiPos = new Vec2(300, 150);
     * const worldPos = no.vec2ToVec3(uiPos);
     * this.character.node.position = worldPos;
     * 
     * // 在2.5D游戏中使用
     * const mapCoord = new Vec2(5, 8);
     * const worldCoord = no.vec2ToVec3(mapCoord).addZ(10);
     */
    export function vec2ToVec3(v2: Vec2): Vec3 {
        return new Vec3(v2.x, v2.y);
    }
}