
import { ccclass, property, requireComponent, Graphics } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetGraphics
 * DateTime = Tue May 24 2022 09:20:39 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetGraphics.ts
 * FileBasenameNoExtension = SetGraphics
 * URL = db://assets/common/ui/SetGraphics.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
@ccclass('SetGraphics')
@requireComponent(Graphics)
/**
 * 图形绘制组件
 * @description 根据输入数据动态绘制多种矢量图形
 * @使用场景
 * 1. 需要根据数据动态生成复杂矢量图形时
 * 2. 需要批量绘制多种类型图形时
 * @示例
 * // 数据示例：
 * {
 *   'line': [{
 *     points: [x1,y1,x2,y2,...],
 *     lineWidth: 2,
 *     strokeColor: '#ff0000',
 *     close: true
 *   }],
 *   'circle': [{
 *     points: [centerX, centerY],
 *     radius: 50,
 *     fillColor: '#00ff00'
 *   }]
 * }
 */
export class SetGraphics extends HackUi {
    /** 组件禁用时是否清除图形（默认保留绘制内容） */
    @property({ tooltip: '组件禁用时是否清除已绘制内容' })
    clearOnDisable: boolean = false;

    /**
     * 组件禁用回调
     * @流程说明
     * 根据配置决定是否清除图形
     */
    onDisable() {
        if (this.clearOnDisable) {
            this.getComponent(Graphics)?.clear();
        }
    }

    /**
     * 数据变更处理核心方法
     * @param data 图形数据集合（按类型分类）
     * @结构说明
     * - key: 图形类型（no.GraphicsType枚举值）
     * - value: 对应类型的图形数据数组
     * @流程说明
     * 1. 获取Graphics组件并清空画布
     * 2. 遍历所有图形类型
     * 3. 调用对应图形绘制方法
     */
    protected onDataChange(data: { [x: string]: no.GraphicsData[] }) {
        let g = this.getComponent(Graphics);
        g.clear();
        for (const type in data) {
            switch (type) {
                case no.GraphicsType.Arc:
                    this.createArcs(g, data[type]);
                    break;
                case no.GraphicsType.Bezier:
                    this.createBeziers(g, data[type]);
                    break;
                case no.GraphicsType.Circle:
                    this.createCircles(g, data[type]);
                    break;
                case no.GraphicsType.Ellipse:
                    this.createEllipses(g, data[type]);
                    break;
                case no.GraphicsType.Line:
                    this.createLines(g, data[type]);
                    break;
                case no.GraphicsType.Rect:
                    this.createRects(g, data[type]);
                    break;
            }
        }
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
    private createLines(g: Graphics, data: no.GraphicsData[]) {
        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            this._moveLineTo(g, d.points);
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
    private createArcs(g: Graphics, data: no.GraphicsData[]) {
        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            g.arc(d.points[0], d.points[1], d.radius[0], d.startEndAngles[0], d.startEndAngles[1], d.counterclockwise);
            this._fillWidthColor(g, d);
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
    private createEllipses(g: Graphics, data: no.GraphicsData[]) {
        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            g.ellipse(d.points[0], d.points[1], d.radius[0], d.radius[1]);
            this._fillWidthColor(g, d);
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
    private createCircles(g: Graphics, data: no.GraphicsData[]) {
        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            g.circle(d.points[0], d.points[1], d.radius[0]);
            this._fillWidthColor(g, d);
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
    private createRects(g: Graphics, data: no.GraphicsData[]) {
        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            if (d.radius?.[0])
                g.roundRect(d.points[0], d.points[1], d.size[0], d.size[1], d.radius[0]);
            else
                g.rect(d.points[0], d.points[1], d.size[0], d.size[1]);
            this._fillWidthColor(g, d);
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
    private createBeziers(g: Graphics, data: no.GraphicsData[]) {
        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            if (d.points.length == 4)
                this.createQuadratic(g, d);
            else if (d.points.length == 6)
                g.bezierCurveTo(d.points[0], d.points[1], d.points[2], d.points[3], d.points[4], d.points[5]);
            this._fillWidthColor(g, d);
        }
    }

    /**
     * 创建二次贝塞尔曲线
     * @param g 图形组件实例
     * @param d 单条曲线数据
     */
    private createQuadratic(g: Graphics, d: no.GraphicsData) {
        g.quadraticCurveTo(d.points[0], d.points[1], d.points[2], d.points[3]);
    }

    /**
     * 移动绘制起点并连接线段
     * @param g 图形组件实例
     * @param points 坐标点数组 [x1,y1,x2,y2,...]
     */
    private _moveLineTo(g: Graphics, points: number[]) {
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
    private _fillWidthColor(g: Graphics, d: { lineWidth?: number, strokeColor?: string, fillColor?: string, close?: boolean, stroke?: boolean, fill?: boolean }) {
        if (d.lineWidth) g.lineWidth = d.lineWidth;
        if (d.strokeColor) g.strokeColor.fromHEX(d.strokeColor);
        if (d.fillColor) g.fillColor.fromHEX(d.fillColor);
        if (d.close) g.close();
        if (d.strokeColor || d.stroke) g.stroke();
        if (d.fillColor || d.fill) g.fill();
    }
}
