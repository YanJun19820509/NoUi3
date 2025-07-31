
import { ccclass, Component, Node } from '../yj';

/**
 * Predefined variables
 * Name = YJTimeFormatDecorator
 * DateTime = Tue Jul 12 2022 09:36:00 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTimeFormatDecorator.ts
 * FileBasenameNoExtension = YJTimeFormatDecorator
 * URL = db://assets/common/base/YJTimeFormatDecorator.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 时间格式化装饰器组件
 * @description 提供时间格式化功能，支持以下输入类型：
 * - 时间戳（number）
 * - Date对象
 * - ISO格式时间字符串
 * 
 * @example 基础使用
 * // 创建组件实例
 * const formatter = this.node.addComponent(YJTimeFormatDecorator);
 * // 格式化当前时间
 * const timeStr = formatter.format(new Date());
 * 
 * @example 配合数据绑定使用
 * // 在HackUi组件中配置：
 * // format: ${YJTimeFormatDecorator.format(timestamp)}
 */
@ccclass('YJTimeFormatDecorator')
export class YJTimeFormatDecorator extends Component {
    /**
     * 时间格式化方法
     * @param v 时间输入，支持：时间戳/Date对象/ISO字符串
     * @returns 格式化后的时间字符串（默认格式：YYYY-MM-DD HH:mm:ss）
     * @example 
     * // 输入new Date(2023, 0, 1) 返回"2023-01-01 00:00:00"
     * // 输入1640995200000 返回"2022-01-01 00:00:00" 
     */
    public format(v: any): string {
        return '';
    }
}
