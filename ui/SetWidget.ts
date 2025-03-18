
import { ccclass, requireComponent, Widget } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetWidget
 * DateTime = Thu Aug 11 2022 09:36:26 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetWidget.ts
 * FileBasenameNoExtension = SetWidget
 * URL = db://assets/NoUi3/ui/SetWidget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
@ccclass('SetWidget')
@requireComponent(Widget)
/**
 * 设置widget，
 * data: 
 *  {alignType: alignValue}
 * 
 * 如 {top:10,bottom:20,left: 5,right: -5,horizontalCenter: 0,verticalCenter:0}
 */
export class SetWidget extends HackUi {
    /**
     * 处理Widget对齐数据更新
     * @param data 对齐参数对象，格式示例: 
     * {top:10, left:20} 表示顶部对齐距离10像素，左侧对齐距离20像素
     * 支持参数：left/right/top/bottom/horizontalCenter/verticalCenter
     */
    protected onDataChange(data: any) {
        let widget = this.getComponent(Widget);
        // 使用标准for循环替代for...of
        const keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
            const type = keys[i];
            this.setAlignment(widget, type, data[type]);
        }
        widget.updateAlignment(); // 应用所有对齐设置
    }

    /**
     * 设置具体对齐方式
     * @param widget 目标组件
     * @param type 对齐类型
     * @param value 对齐值（像素）
     * @example
     * setAlignment(widget, 'left', 10) // 左对齐，距离左边距10像素
     */
    private setAlignment(widget: Widget, type: string, value: number) {
        switch (type) {
            case 'left':    // 左对齐
                widget.isAlignLeft = true;
                widget.left = value;
                break;
            case 'right':   // 右对齐
                widget.isAlignRight = true;
                widget.right = value;
                break;
            case 'top':     // 顶部对齐
                widget.isAlignTop = true;
                widget.top = value;
                break;
            case 'bottom':  // 底部对齐
                widget.isAlignBottom = true;
                widget.bottom = value;
                break;
            case 'horizontalCenter': // 水平居中
                widget.isAlignHorizontalCenter = true;
                widget.horizontalCenter = value;
                break;
            case 'verticalCenter':   // 垂直居中
                widget.isAlignVerticalCenter = true;  // 修正原始代码错误（原为isAlignLeft）
                widget.verticalCenter = value;
                break;
        }
    }
}
