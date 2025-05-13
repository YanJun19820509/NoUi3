
import { ccclass, menu } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetAngle
 * DateTime = Mon Jan 17 2022 09:58:42 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetAngle.ts
 * FileBasenameNoExtension = SetAngle
 * URL = db://assets/Script/common/ui/SetAngle.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetAngle')
@menu('NoUi/ui/SetAngle(设置旋转角度:number)')
/**
 * 节点旋转角度设置组件
 * 
 * @功能说明
 * - 通过数据驱动方式设置UI节点的旋转角度
 * - 自动将输入数据转换为数值类型
 * - 支持数字和数字字符串的自动转换
 * 
 * @使用示例
 * // 设置精确角度值
 * a_setData(45);      // 旋转到45度
 * 
 * // 字符串参数自动转换
 * a_setData("30.5");  // 旋转到30.5度
 * 
 * // 配合动画系统使用
 * a_setData(90);      // 直接跳转到90度
 */
export class SetAngle extends HackUi {
    /**
     * 数据变更处理核心方法
     * @param data 旋转角度值，支持格式：
     * - number: 直接设置角度值
     * - string: 数字字符串自动转换（如"45" → 45）
     * - 其他类型: 会尝试转换为数字（无效值会变为0）
     * 
     * @实现说明
     * 1. 使用Number()进行类型转换保证数值类型
     * 2. 直接修改node.angle属性实现即时旋转效果
     * 
     * @示例
     * onDataChange(180)    → 节点旋转180度
     * onDataChange("90.5") → 节点旋转90.5度
     * onDataChange(null)   → 节点旋转0度
     */
    protected onDataChange(data: any) {
        // 强制转换为数值类型（无效值转为0）
        // 注意：Cocos Creator的angle属性以度为单位
        this.node.angle = Number(data);
    }
}
