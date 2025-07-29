
import { ccclass, menu } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetPositionX
 * DateTime = Mon Jan 17 2022 12:10:32 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPositionX.ts
 * FileBasenameNoExtension = SetPositionX
 * URL = db://assets/Script/NoUi3/ui/SetPositionX.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetPositionX')
@menu('NoUi/ui/SetPositionX(设置x坐标:number)')
/**
 * 设置节点X坐标    
 * 功能说明：
 * - 通过数据驱动方式设置节点X坐标
 * - 支持数字、字符串等多种数据类型
 * - 自动处理NaN/undefined等异常值
 * 
 * 使用示例：
 * // 设置X坐标为100
 * this.a_setData(100);
 * // 通过字符串设置
 * this.a_setData("200.5"); // 转换为200.5
 */
export class SetPositionX extends HackUi {

    /**
     * 设置节点X坐标数据处理器
     * @param data 支持的输入格式：
     * - 数字类型：直接作为X坐标值
     * - 字符串类型：可转换为数字的字符串
     * - 其他类型：会尝试转换为数字，失败则使用0
     * @example 
     * // 设置X坐标为100
     * this.a_setData(100);
     * // 通过字符串设置
     * this.a_setData("200.5"); // 转换为200.5
     * 
     * @实现说明：
     * - 使用Number强制转换保证数值类型安全
     * - 通过no.x工具方法设置坐标，内部已处理NaN等异常情况
     * - 继承自HackUi，支持通过节点事件驱动数据变化
     */
    protected onDataChange(data: any) {
        // 使用Number强制转换保证数值类型安全
        // no.x方法内部已包含NaN/undefined等异常值处理逻辑
        // 当转换失败时会自动使用当前X坐标值（保持原位置不变）
        no.x(this.node, Number(data));
    }
}
