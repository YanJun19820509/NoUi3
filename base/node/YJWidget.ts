import { no } from "@hackUi/no";
import { Range } from "@hackUi/types";
import { ccclass, Component, Enum, property, requireComponent, view, Widget } from "@hackUi/yj";
/**
 * 
 * Author mqsy_yj
 * DateTime Sun Jan 04 2026 14:32:14 GMT+0800 (中国标准时间)
 *
 */

enum WidgetAlignType {
    Left = 0,
    Right,
    Top,
    Bottom,
    HorizontalCenter,
    VerticalCenter,
}

@ccclass('YJWidgetInfo')
export class YJWidgetInfo {
    @property({ type: Enum(WidgetAlignType) })
    alignType: WidgetAlignType = WidgetAlignType.Left;
    @property
    max: number = 0;
}

@ccclass('YJWidget')
@requireComponent(Widget)
export class YJWidget extends Component {
    @property({ type: YJWidgetInfo })
    info: YJWidgetInfo[] = [];

    protected start() {
        let widget = this.node.getComponent(Widget);
        const parentSize = no.size(this.node.parent);
        const nodeSize = no.size(this.node);
        let w = parentSize.width - nodeSize.width;
        let h = parentSize.height - nodeSize.height;
        this.info.forEach(info => {
            switch (info.alignType) {
                case WidgetAlignType.Left:
                    widget.isAlignLeft = true;
                    widget.left = info.max > 0 ? Math.min(info.max, w) : Math.max(info.max, -w);
                    break;
                case WidgetAlignType.Right:
                    widget.isAlignRight = true;
                    widget.right = info.max > 0 ? Math.min(info.max, w) : Math.max(info.max, -w);
                    break;
                case WidgetAlignType.Top:
                    widget.isAlignTop = true;
                    widget.top = info.max > 0 ? Math.min(info.max, h) : Math.max(info.max, -h);
                    break;
                case WidgetAlignType.Bottom:
                    widget.isAlignBottom = true;
                    widget.bottom = info.max > 0 ? Math.min(info.max, h) : Math.max(info.max, -h);
                    break;
                case WidgetAlignType.HorizontalCenter:
                    widget.isAlignHorizontalCenter = true;
                    widget.horizontalCenter = info.max > 0 ? Math.min(info.max, w) : Math.max(info.max, -w);
                    break;
                case WidgetAlignType.VerticalCenter:
                    widget.isAlignVerticalCenter = true;
                    widget.verticalCenter = info.max > 0 ? Math.min(info.max, h) : Math.max(info.max, -h);
                    break;
            }
        });
    }
}