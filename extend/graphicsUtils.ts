/**
 * 
 * Author mqsy_yj
 * DateTime Mon Feb 09 2026 14:20:04 GMT+0800 (中国标准时间)
 *
 */

import { Graphics, Vec2, view, Node, UITransform, v3 } from "../yj";

/**
 * 图形工具类
 * @namespace graphicsUtils
 * @description 提供绘制图形路径的工具函数
 * @example
 * // 创建线段
 * const line = graphicsUtils.createGraphicLineData([new Vec2(0,0), new Vec2(100,100)], 2, '#FF0000');
 * // 创建圆弧
 * const arc = graphicsUtils.createGraphicArcData(new Vec2(100,100), 50, 0, Math.PI/2, false, 2, '#FF0000');
 */
export namespace graphicsUtils {
    /** 
     * 绘制图形的类型枚举
     * @example
     * // 创建线段时使用
     * const lineType = GraphicsType.Line;
     * 
     * // 创建圆形时使用
     * const circleType = GraphicsType.Circle;
     */
    export enum GraphicsType {
        /** 线*/
        Line = 'line',
        /** 圆弧*/
        Arc = 'arc',
        /** 椭圆*/
        Ellipse = 'ellipse',
        /** 圆*/
        Circle = 'circle',
        /** 矩形*/
        Rect = 'rect',
        /** 贝赛尔曲线*/
        Bezier = 'bezier'
    };

    /** 
     * 绘制图形路径的通用数据结构
     * @example
     * // 创建矩形数据示例
     * const rectData: GraphicsData = {
     *   points: [10, 10],      // 起始坐标
     *   size: [100, 50],       // 宽高
     *   radius: 5,             // 圆角半径
     *   fillColor: '#FF0000',  // 填充颜色
     *   stroke: true           // 启用描边
     * };
     */
    export type GraphicsData = {
        /** 坐标点集合（不同图形含义不同）：
         * - 矩形/贝塞尔曲线：起始坐标或控制点坐标
         * - 线：路径点坐标
         * - 圆/椭圆/圆弧：中心点坐标 */
        points: number[],
        /** 半径配置：
         * - 矩形：圆角半径 [左上, 右上, 右下, 左下]
         * - 椭圆：[x轴半径, y轴半径]
         * - 圆/圆弧：单一数值 */
        radius?: number[] | number,
        /** 尺寸（仅矩形使用）：[宽度, 高度] */
        size?: number[],
        /** 弧度范围（仅圆弧使用）：[起始角度, 结束角度]（单位：弧度） */
        startEndAngles?: number[],
        /** 绘制方向：true=逆时针，false=顺时针（默认） */
        counterclockwise?: boolean,
        /** 线条宽度（像素） */
        lineWidth?: number,
        /** 填充颜色（十六进制格式） */
        fillColor?: string,
        /** 描边颜色（十六进制格式） */
        strokeColor?: string,
        /** 是否填充图形 */
        fill?: boolean,
        /** 是否描边图形 */
        stroke?: boolean,
        /** 是否闭合路径 */
        close?: boolean,
    };

    const _createGraphicLineDataCache: GraphicsData = { points: [], lineWidth: 0, strokeColor: '', fillColor: '' };
    /**
     * 创建线段路径数据
     * @param d 线段配置参数
     * @param d.points 线段路径点数组（至少需要2个点）
     * @param d.lineWidth 线宽（默认0）
     * @param d.strokeColor 描边颜色
     * @param d.fillColor 填充颜色
     * @returns 线段图形数据
     * @example
     * // 创建红色线段
     * const line = createGraphicLineData({
     *   points: [new Vec2(0,0), new Vec2(100,100)],
     *   lineWidth: 2,
     *   strokeColor: '#FF0000'
     * });
     */
    export function createGraphicLineData(points: Vec2[] | { x: number, y: number }[], lineWidth?: number, strokeColor?: string, fillColor?: string): GraphicsData {
        _createGraphicLineDataCache.points = [];
        _createGraphicLineDataCache.lineWidth = 0;
        _createGraphicLineDataCache.strokeColor = '';
        _createGraphicLineDataCache.fillColor = '';
        for (let i = 0; i < points.length; i++) {
            _createGraphicLineDataCache.points[_createGraphicLineDataCache.points.length] = points[i].x;
            _createGraphicLineDataCache.points[_createGraphicLineDataCache.points.length] = points[i].y;
        }
        _createGraphicLineDataCache.lineWidth = lineWidth || 0;
        _createGraphicLineDataCache.strokeColor = strokeColor;
        _createGraphicLineDataCache.fillColor = fillColor;
        return _createGraphicLineDataCache;
    }

    const _createGraphicArcDataCache: GraphicsData = { points: [], radius: [], startEndAngles: [], counterclockwise: false, lineWidth: 0, strokeColor: '', fillColor: '' };
    /**
     * 创建绘制圆弧路径的数据
     * @param d 圆弧配置参数
     * @param d.center 圆心坐标
     * @param d.radius 圆弧半径（像素）
     * @param d.startAngle 起始角度（单位：弧度）
     * @param d.endAngle 结束角度（单位：弧度）
     * @param d.lineWidth 线宽（默认0）
     * @param d.strokeColor 描边颜色（十六进制）
     * @param d.fillColor 填充颜色（十六进制）
     * @param d.counterclockwise 绘制方向（默认false顺时针）
     * @returns 圆弧图形数据
     * @example
     * // 创建红色半圆弧（90度到270度）
     * const arc = createGraphicArcData({
     *   center: new Vec2(100, 100),
     *   radius: 50,
     *   startAngle: Math.PI/2,
     *   endAngle: Math.PI*1.5,
     *   lineWidth: 2,
     *   strokeColor: '#FF0000'
     * });
     * 
     * // 创建填充扇形（闭合路径）
     * const sector = createGraphicArcData({
     *   center: new Vec2(200, 200),
     *   radius: 80,
     *   startAngle: 0,
     *   endAngle: Math.PI/3,
     *   fillColor: '#FFA500',
     *   close: true
     * });
     */
    export function createGraphicArcData(center: Vec2, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean, lineWidth?: number, strokeColor?: string, fillColor?: string): GraphicsData {
        _createGraphicArcDataCache.points = [center.x, center.y];
        _createGraphicArcDataCache.radius = [radius];
        _createGraphicArcDataCache.startEndAngles = [startAngle, endAngle];
        _createGraphicArcDataCache.counterclockwise = counterclockwise || false;
        _createGraphicArcDataCache.lineWidth = lineWidth || 0;
        _createGraphicArcDataCache.strokeColor = strokeColor;
        _createGraphicArcDataCache.fillColor = fillColor;
        return _createGraphicArcDataCache;
    }

    const _createGraphicEllipseDataCache: GraphicsData = { points: [], radius: [], lineWidth: 0, strokeColor: '', fillColor: '' };
    /**
     * 创建绘制椭圆路径的数据
     * @param d 椭圆配置参数
     * @param d.center 椭圆中心坐标
     * @param d.rx X轴半径（像素）
     * @param d.ry Y轴半径（像素）
     * @param d.lineWidth 线宽（默认0）
     * @param d.strokeColor 描边颜色（十六进制）
     * @param d.fillColor 填充颜色（十六进制）
     * @returns 椭圆图形数据
     * @example
     * // 创建蓝色描边椭圆
     * const ellipse = createGraphicEllipseData({
     *   center: new Vec2(150, 150),
     *   rx: 100,
     *   ry: 60,
     *   lineWidth: 3,
     *   strokeColor: '#0000FF'
     * });
     * 
     * // 创建填充绿色椭圆
     * const filledEllipse = createGraphicEllipseData({
     *   center: new Vec2(300, 200),
     *   rx: 80,
     *   ry: 80,
     *   fillColor: '#00FF00'
     * });
     */
    export function createGraphicEllipseData(center: Vec2, rx: number, ry: number, lineWidth?: number, strokeColor?: string, fillColor?: string): GraphicsData {
        _createGraphicEllipseDataCache.points = [center.x, center.y];
        _createGraphicEllipseDataCache.radius = [rx, ry];
        _createGraphicEllipseDataCache.lineWidth = lineWidth || 0;
        _createGraphicEllipseDataCache.strokeColor = strokeColor;
        _createGraphicEllipseDataCache.fillColor = fillColor;
        return _createGraphicEllipseDataCache;
    }

    const _createGraphicCircleDataCache: GraphicsData = { points: [], radius: [], lineWidth: 0, strokeColor: '', fillColor: '' };
    /**
     * 创建绘制圆路径的数据
     * @param center 
     * @param r 
     * @param lineWidth 
     * @param strokeColor 
     * @param fillColor 
     * @returns 
     */
    export function createGraphicCircleData(center: Vec2, r: number, lineWidth?: number, strokeColor?: string, fillColor?: string): GraphicsData {
        _createGraphicCircleDataCache.points = [center.x, center.y];
        _createGraphicCircleDataCache.radius = [r];
        _createGraphicCircleDataCache.lineWidth = lineWidth || 0;
        _createGraphicCircleDataCache.strokeColor = strokeColor;
        _createGraphicCircleDataCache.fillColor = fillColor;
        return _createGraphicCircleDataCache;
    }

    const _createGraphicRectDataCache: GraphicsData = { points: [], size: [], lineWidth: 0, strokeColor: '', fillColor: '' };
    /**
     * 创建绘制矩形路径的数据
     * @param d.x 矩形左上角X坐标
     * @param d.y 矩形左上角Y坐标
     * @param d.width 矩形宽度
     * @param d.height 矩形高度
     * @param d.lineWidth 线宽（0表示不描边）
     * @param d.strokeColor 描边颜色（十六进制字符串 如#FF0000）
     * @param d.fillColor 填充颜色（十六进制字符串 如#00FF00）
     * @returns 矩形图形数据
     * @example
     * // 创建红色边框矩形
     * const rect = createGraphicRectData({
     *   x: 100, y: 200,
     *   width: 300, height: 150,
     *   lineWidth: 2,
     *   strokeColor: '#FF0000'
     * });
     * 
     * // 创建填充蓝色矩形
     * const filledRect = createGraphicRectData({
     *   x: 50, y: 50,
     *   width: 200, height: 200,
     *   fillColor: '#0000FF'
     * });
     */
    export function createGraphicRectData(x: number, y: number, width: number, height: number, lineWidth?: number, strokeColor?: string, fillColor?: string): GraphicsData {
        _createGraphicRectDataCache.points = [x, y];
        _createGraphicRectDataCache.size = [width, height];
        _createGraphicRectDataCache.lineWidth = lineWidth || 0;
        _createGraphicRectDataCache.strokeColor = strokeColor;
        _createGraphicRectDataCache.fillColor = fillColor;
        return _createGraphicRectDataCache;
    }

    const _createGraphicRoundRectDataCache: GraphicsData = { points: [], size: [], radius: [], lineWidth: 0, strokeColor: '', fillColor: '' };
    /**
     * 创建绘制圆角矩形路径的数据
     * @param d.x 矩形左上角X坐标
     * @param d.y 矩形左上角Y坐标
     * @param d.width 矩形宽度
     * @param d.height 矩形高度 
     * @param d.r 圆角半径（单位：像素）
     * @param d.lineWidth 线宽（0表示不描边）
     * @param d.strokeColor 描边颜色（十六进制）
     * @param d.fillColor 填充颜色（十六进制）
     * @returns 圆角矩形图形数据
     * @example
     * // 创建绿色圆角矩形
     * const roundRect = createGraphicRoundRectData({
     *   x: 150, y: 150,
     *   width: 200, height: 100,
     *   r: 15,
     *   lineWidth: 3,
     *   strokeColor: '#00FF00'
     * });
     * 
     * // 创建填充橙色圆角矩形
     * const filledRound = createGraphicRoundRectData({
     *   x: 300, y: 300,
     *   width: 150, height: 150,
     *   r: 20,
     *   fillColor: '#FFA500'
     * });
     */
    export function createGraphicRoundRectData(x: number, y: number, width: number, height: number, r: number, lineWidth?: number, strokeColor?: string, fillColor?: string): GraphicsData {
        _createGraphicRoundRectDataCache.points = [x, y];
        _createGraphicRoundRectDataCache.size = [width, height];
        _createGraphicRoundRectDataCache.radius = [r];
        _createGraphicRoundRectDataCache.lineWidth = lineWidth || 0;
        _createGraphicRoundRectDataCache.strokeColor = strokeColor;
        _createGraphicRoundRectDataCache.fillColor = fillColor;
        return _createGraphicRoundRectDataCache;
    }

    const _createGraphicBezierDataCache: GraphicsData = { points: [], lineWidth: 0, strokeColor: '', fillColor: '' };
    /**
     * 创建绘制贝塞尔曲线路径的数据
     * @param d.points 控制点坐标数组（格式说明）：
     *   - 2个点：起点 + 终点（直线）
     *   - 3个点：二次贝塞尔曲线（起点 + 控制点 + 终点）
     *   - 4个点：三次贝塞尔曲线（起点 + 控制点1 + 控制点2 + 终点）
     * @param d.lineWidth 线宽（0表示不描边）
     * @param d.strokeColor 描边颜色（十六进制）
     * @param d.fillColor 填充颜色（十六进制）
     * @returns 贝塞尔曲线图形数据
     * @example
     * // 创建二次贝塞尔曲线
     * const quadCurve = createBezierData({
     *   points: [
     *     new Vec2(100, 100),  // 起点
     *     new Vec2(200, 50),   // 控制点
     *     new Vec2(300, 100)   // 终点
     *   ],
     *   lineWidth: 2,
     *   strokeColor: '#FF00FF'
     * });
     * 
     * // 创建三次贝塞尔曲线
     * const cubicCurve = createBezierData({
     *   points: [
     *     new Vec2(50, 200),
     *     new Vec2(150, 100),
     *     new Vec2(250, 300),
     *     new Vec2(350, 200)
     *   ],
     *   lineWidth: 3,
     *   strokeColor: '#00FFFF'
     * });
     */
    export function createBezierData(points: Vec2[] | { x: number, y: number }[], lineWidth?: number, strokeColor?: string, fillColor?: string): GraphicsData {
        let ps: number[] = [];
        for (let i = 0; i < points.length; i++) {
            ps[ps.length] = points[i].x;
            ps[ps.length] = points[i].y;
        }
        _createGraphicBezierDataCache.points = ps;
        _createGraphicBezierDataCache.lineWidth = lineWidth || 0;
        _createGraphicBezierDataCache.strokeColor = strokeColor;
        _createGraphicBezierDataCache.fillColor = fillColor;
        return _createGraphicBezierDataCache;
    }

    const _getGraphicUVInWorldCache: { minX: number, minY: number, maxX: number, maxY: number } = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    /**
     * 计算自定义图形在屏幕空间中的UV范围（归一化坐标，左上角为原点）
     * @param cx 图形中心点x（本地坐标系）
     * @param cy 图形中心点y（本地坐标系）
     * @param width 图形宽度（像素）
     * @param height 图形高度（像素）
     * @param graphicsNode 图形节点（用于坐标系转换）
     * @returns [minU, minV, maxU, maxV] UV坐标范围数组
     * @example
     * // 计算按钮控件在屏幕中的UV范围
     * const buttonUV = getGraphicUVInWorld(0, 0, 200, 50, buttonNode);
     * // 结果可能为：[0.3, 0.8, 0.5, 0.85] 表示占据屏幕横向30%-50%，纵向80%-85%区域
     */
    export function getGraphicUVInWorld(cx: number, cy: number, width: number, height: number, graphicsNode: Node): { minX: number, minY: number, maxX: number, maxY: number } {
        _getGraphicUVInWorldCache.minX = 0;
        _getGraphicUVInWorldCache.minY = 0;
        _getGraphicUVInWorldCache.maxX = 0;
        _getGraphicUVInWorldCache.maxY = 0;
        let worldSize = view.getVisibleSize();
        // 世界坐标系原点为左下角，需要转换为左上角为原点的UV坐标系
        let trans = graphicsNode.getComponent(UITransform);
        let p1 = trans.convertToWorldSpaceAR(v3(cx - width / 2, cy - height / 2));
        let p2 = trans.convertToWorldSpaceAR(v3(cx + width / 2, cy + height / 2));
        _getGraphicUVInWorldCache.minX = p1.x / worldSize.width;
        _getGraphicUVInWorldCache.minY = 1 - p2.y / worldSize.height;
        _getGraphicUVInWorldCache.maxX = p2.x / worldSize.width;
        _getGraphicUVInWorldCache.maxY = 1 - p1.y / worldSize.height;
        return _getGraphicUVInWorldCache;
    }
    /**
     * 创建线段/多边形
     * @param g 图形组件实例
     * @param data 线段数据数组
     * @示例数据
     * [{
     *   points: [0,0, 100,100], // 线段坐标
     *   lineWidth: 2,          // 线宽
     *   strokeColor: '#ff0000' // 描边颜色
     * }]
     */
    export function createLines(g: Graphics, data: GraphicsData[]) {
        let d: GraphicsData;
        for (let i = 0, n = data.length; i < n; i++) {
            d = data[i];
            _moveLineTo(g, d.points);
            if (d.lineWidth) g.lineWidth = d.lineWidth;
            if (d.fillColor) g.fillColor.fromHEX(d.fillColor);
            if (d.strokeColor) g.strokeColor.fromHEX(d.strokeColor);
            if (d.close) g.close();
            if (d.strokeColor || d.stroke) g.stroke();
            if (d.fillColor || d.fill) g.fill();
        }
    }

    /**
     * 创建圆弧
     * @param g 图形组件实例
     * @param data 圆弧数据数组
     * @示例数据
     * [{
     *   points: [100,100],     // 圆心坐标
     *   radius: 50,            // 半径
     *   startEndAngles: [0, 90]// 起始/结束角度
     * }]
     */
    export function createArcs(g: Graphics, data: GraphicsData[]) {
        let d: GraphicsData;
        for (let i = 0, n = data.length; i < n; i++) {
            d = data[i];
            g.arc(d.points[0], d.points[1], d.radius[0], d.startEndAngles[0], d.startEndAngles[1], d.counterclockwise);
            _fillWidthColor(g, d);
        }
    }

    /**
     * 创建椭圆
     * @param g 图形组件实例
     * @param data 椭圆数据数组
     * @示例数据
     * [{
     *   points: [100,100], // 中心坐标
     *   radius: [80,50]    // 长轴/短轴半径
     * }]
     */
    export function createEllipses(g: Graphics, data: GraphicsData[]) {
        let d: GraphicsData;
        for (let i = 0, n = data.length; i < n; i++) {
            d = data[i];
            g.ellipse(d.points[0], d.points[1], d.radius[0], d.radius[1]);
            _fillWidthColor(g, d);
        }
    }

    /**
     * 创建圆形
     * @param g 图形组件实例
     * @param data 圆形数据数组
     * @示例数据
     * [{
     *   points: [100,100], // 圆心坐标
     *   radius: 60         // 半径
     * }]
     */
    export function createCircles(g: Graphics, data: GraphicsData[]) {
        let d: GraphicsData;
        for (let i = 0, n = data.length; i < n; i++) {
            d = data[i];
            g.circle(d.points[0], d.points[1], d.radius[0]);
            _fillWidthColor(g, d);
        }
    }

    /**
     * 创建矩形/圆角矩形
     * @param g 图形组件实例
     * @param data 矩形数据数组
     * @示例数据
     * [{
     *   points: [50,50],   // 起始坐标
     *   size: [200,100],   // 宽高
     *   radius: 10         // 圆角半径（可选）
     * }]
     */
    export function createRects(g: Graphics, data: GraphicsData[]) {
        let d: GraphicsData;
        for (let i = 0, n = data.length; i < n; i++) {
            d = data[i];
            if (d.radius?.[0])
                g.roundRect(d.points[0], d.points[1], d.size[0], d.size[1], d.radius[0]);
            else
                g.rect(d.points[0], d.points[1], d.size[0], d.size[1]);
            _fillWidthColor(g, d);
        }
    }

    /**
     * 创建贝塞尔曲线
     * @param g 图形组件实例
     * @param data 曲线数据数组
     * @示例数据
     * [{
     *   points: [cp1x,cp1y, endX,endY] // 二次贝塞尔曲线
     * },{
     *   points: [cp1x,cp1y, cp2x,cp2y, endX,endY] // 三次贝塞尔曲线
     * }]
     */
    export function createBeziers(g: Graphics, data: GraphicsData[]) {
        let d: GraphicsData;
        for (let i = 0, n = data.length; i < n; i++) {
            d = data[i];
            if (d.points.length == 4)
                createQuadratic(g, d);
            else if (d.points.length == 6)
                g.bezierCurveTo(d.points[0], d.points[1], d.points[2], d.points[3], d.points[4], d.points[5]);
            _fillWidthColor(g, d);
        }
    }

    /**
     * 创建二次贝塞尔曲线
     * @param g 图形组件实例
     * @param d 单条曲线数据
     */
    export function createQuadratic(g: Graphics, d: GraphicsData) {
        g.quadraticCurveTo(d.points[0], d.points[1], d.points[2], d.points[3]);
    }

    /**
     * 移动绘制起点并连接线段
     * @param g 图形组件实例
     * @param points 坐标点数组 [x1,y1,x2,y2,...]
     */
    function _moveLineTo(g: Graphics, points: number[]) {
        g.moveTo(points[0], points[1]);
        for (let i = 2, n = points.length; i < n; i += 2) {
            if (i == n - 2 && points[i] == points[0] && points[i + 1] == points[1]) g.close();
            else g.lineTo(points[i], points[i + 1]);
        }
    }

    /**
     * 统一设置图形样式
     * @param g 图形组件实例
     * @param d 样式配置对象
     * @配置参数
     * - lineWidth: 线宽
     * - strokeColor: 描边颜色（HEX）
     * - fillColor: 填充颜色（HEX）
     * - close: 是否闭合路径
     * - stroke: 是否强制描边
     * - fill: 是否强制填充
     */
    function _fillWidthColor(g: Graphics, d: { lineWidth?: number, strokeColor?: string, fillColor?: string, close?: boolean, stroke?: boolean, fill?: boolean }) {
        if (d.lineWidth) g.lineWidth = d.lineWidth;
        if (d.strokeColor) g.strokeColor.fromHEX(d.strokeColor);
        if (d.fillColor) g.fillColor.fromHEX(d.fillColor);
        if (d.close) g.close();
        if (d.strokeColor || d.stroke) g.stroke();
        if (d.fillColor || d.fill) g.fill();
    }
}