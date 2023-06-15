
import { _decorator, Component, Node } from './yj';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJTimeFormatDecorator
 * DateTime = Tue Jul 12 2022 09:36:00 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTimeFormatDecorator.ts
 * FileBasenameNoExtension = YJTimeFormatDecorator
 * URL = db://assets/NoUi3/base/YJTimeFormatDecorator.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//时间格式化装饰器
@ccclass('YJTimeFormatDecorator')
export class YJTimeFormatDecorator extends Component {
    public format(v: any): string {
        return '';
    }
}
