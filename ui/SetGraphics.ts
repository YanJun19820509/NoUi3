
import { ccclass, property, requireComponent, Graphics } from '../yj';
import { graphicsUtils } from '../extend/graphicsUtils';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetGraphics
 * DateTime = Tue May 24 2022 09:20:39 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetGraphics.ts
 * FileBasenameNoExtension = SetGraphics
 * URL = db://assets/NoUi3/ui/SetGraphics.ts
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
    protected onDataChange(data: { [x: string]: graphicsUtils.GraphicsData[] }) {
        let g = this.getComponent(Graphics);
        g.clear();
        for (const type in data) {
            switch (type) {
                case graphicsUtils.GraphicsType.Arc:
                    graphicsUtils.createArcs(g, data[type]);
                    break;
                case graphicsUtils.GraphicsType.Bezier:
                    graphicsUtils.createBeziers(g, data[type]);
                    break;
                case graphicsUtils.GraphicsType.Circle:
                    graphicsUtils.createCircles(g, data[type]);
                    break;
                case graphicsUtils.GraphicsType.Ellipse:
                    graphicsUtils.createEllipses(g, data[type]);
                    break;
                case graphicsUtils.GraphicsType.Line:
                    graphicsUtils.createLines(g, data[type]);
                    break;
                case graphicsUtils.GraphicsType.Rect:
                    graphicsUtils.createRects(g, data[type]);
                    break;
            }
        }
    }
}
