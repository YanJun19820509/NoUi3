
import { _decorator, Component, Node, Widget } from './yj';
import { FuckUi } from './FuckUi';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = SetWidget
 * DateTime = Thu Aug 11 2022 09:36:26 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetWidget.ts
 * FileBasenameNoExtension = SetWidget
 * URL = db://assets/NoUi3/fuckui/SetWidget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 设置widget，
 * data: 
 *  {alignType: alignValue}
 * 
 * 如 {top:10,bottom:20,left: 5,right: -5,horizontalCenter: 0,verticalCenter:0}
 */
@ccclass('SetWidget')
@requireComponent(Widget)
export class SetWidget extends FuckUi {
    protected onDataChange(data: any) {
        let widget = this.getComponent(Widget);
        for (const type in data) {
            this.setAlignment(widget, type, data[type]);
        }
        widget.updateAlignment();
    }

    private setAlignment(widget: Widget, type: string, value: number) {
        switch (type) {
            case 'left':
                widget.isAlignLeft = true;
                widget.left = value;
                break;
            case 'right':
                widget.isAlignRight = true;
                widget.right = value;
                break;
            case 'top':
                widget.isAlignTop = true;
                widget.top = value;
                break;
            case 'bottom':
                widget.isAlignBottom = true;
                widget.bottom = value;
                break;
            case 'horizontalCenter':
                widget.isAlignHorizontalCenter = true;
                widget.horizontalCenter = value;
                break;
            case 'verticalCenter':
                widget.isAlignLeft = true;
                widget.verticalCenter = value;
                break;
        }
    }
}
