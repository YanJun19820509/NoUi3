
import { ccclass, property, executeInEditMode } from '../yj';
import { SetComponentPropertyValue } from './SetComponentPropertyValue';

/**
 * Predefined variables
 * Name = SetComponentEnable
 * DateTime = Mon Sep 19 2022 14:57:34 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetComponentEnable.ts
 * FileBasenameNoExtension = SetComponentEnable
 * URL = db://assets/NoUi3/ui/SetComponentEnable.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

/**
 * 组件启用状态控制组件
 * 
 * @功能说明
 * - 动态设置目标组件的enabled状态
 * - 支持通过数据驱动和API调用两种方式控制
 * - 在编辑模式下实时预览效果
 * - 自动适配任意继承cc.Component的组件
 * 
 * @使用示例
 * // 通过数据驱动启用组件
 * a_setData(true);
 * 
 * // 通过数据驱动禁用组件
 * a_setData(false);
 * 
 * // 直接调用启用方法
 * a_enable();
 * 
 * // 直接调用禁用方法 
 * a_disable();
 * 
 * @实现说明
 * 1. 继承自SetComponentPropertyValue基类
 * 2. 固定设置属性名为'enabled'
 * 3. 使用executeInEditMode装饰器支持编辑器实时预览
 * 4. 通过重写propertyNames限定只操作enabled属性
 */
@ccclass('SetComponentEnable')
@executeInEditMode()
export class SetComponentEnable extends SetComponentPropertyValue {

    @property({ visible() { return false }, override: true })
    property: number = 0;
    @property({ visible() { return false }, override: true })
    propertyNames: string[] = ['enabled'];

    protected setPropertyEnum() {

    }

    public a_enable(): void {
        this.onDataChange(true);
    }

    public a_disable(): void {
        this.onDataChange(false);
    }

}
