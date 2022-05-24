
import { _decorator, Component, Node, Graphics } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = SetGraphics
 * DateTime = Tue May 24 2022 09:20:39 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetGraphics.ts
 * FileBasenameNoExtension = SetGraphics
 * URL = db://assets/NoUi3/fuckui/SetGraphics.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 数据格式:{
 *  [no.GraphicType]: [GraphicsData,...]
 * }
 */
@ccclass('SetGraphics')
@requireComponent(Graphics)
export class SetGraphics extends FuckUi {
    @property
    clearOnDisable: boolean = false;

    onDisable() {
        if (this.clearOnDisable) {
            this.a_clearData();
            this.getComponent(Graphics)?.clear();
        }
    }

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

    private createLines(g: Graphics, data: no.GraphicsData[]) {
        data.forEach(d => {
            this._moveLineTo(g, d.points);
            if (d.lineWidth) g.lineWidth = d.lineWidth;
            if (d.fillColor) g.fillColor.fromHEX(d.fillColor) && g.fill();
            if (d.strokeColor) g.strokeColor.fromHEX(d.strokeColor) && g.stroke();
        });
    }

    private createArcs(g: Graphics, data: no.GraphicsData[]) {
        data.forEach(d => {
            g.arc(d.points[0], d.points[1], d.radius[0], d.startEndAngles[0], d.startEndAngles[1], d.counterclockwise);
            this._fillWidthColor(g, d);
        });
    }

    private createEllipses(g: Graphics, data: no.GraphicsData[]) {
        data.forEach(d => {
            g.arc(d.points[0], d.points[1], d.radius[0], d.startEndAngles[0], d.startEndAngles[1], d.counterclockwise);
            this._fillWidthColor(g, d);
        });
    }

    private createCircles(g: Graphics, data: no.GraphicsData[]) {
        data.forEach(d => {
            g.circle(d.points[0], d.points[1], d.radius[0]);
            this._fillWidthColor(g, d);
        });
    }

    private createRects(g: Graphics, data: no.GraphicsData[]) {
        data.forEach(d => {
            if (d.radius?.[0])
                g.roundRect(d.points[0], d.points[1], d.size[0], d.size[1], d.radius[0]);
            else
                g.rect(d.points[0], d.points[1], d.size[0], d.size[1]);
            this._fillWidthColor(g, d);
        });
    }

    private createBeziers(g: Graphics, data: no.GraphicsData[]) {
        data.forEach(d => {
            if (d.points.length == 4)
                this.createQuadratic(g, d);
            else if (d.points.length == 6)
                g.bezierCurveTo(d.points[0], d.points[1], d.points[2], d.points[3], d.points[4], d.points[5]);
            this._fillWidthColor(g, d);
        });
    }

    private createQuadratic(g: Graphics, d: no.GraphicsData) {
        g.quadraticCurveTo(d.points[0], d.points[1], d.points[2], d.points[3]);
    }

    private _moveLineTo(g: Graphics, points: number[]) {
        g.moveTo(points[0], points[1]);
        for (let i = 2, n = points.length; i < n; i += 2) {
            if (i == n - 2 && points[i] == points[0] && points[i + 1] == points[1]) g.close();
            else g.lineTo(points[i], points[i + 1]);
        }
    }

    private _fillWidthColor(g: Graphics, d: { lineWidth?: number, strokeColor?: string, fillColor?: string }) {
        if (d.lineWidth) g.lineWidth = d.lineWidth;
        if (d.strokeColor) g.strokeColor.fromHEX(d.strokeColor) && g.stroke();
        if (d.fillColor) g.fillColor.fromHEX(d.fillColor) && g.fill();
    }
}
