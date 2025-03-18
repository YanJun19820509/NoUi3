
import { ccclass, property, menu } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetConditionHandler
 * DateTime = Mon Jan 17 2022 10:39:37 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetConditionHandler.ts
 * FileBasenameNoExtension = SetConditionHandler
 * URL = db://assets/Script/NoUi3/ui/SetConditionHandler.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
@ccclass("ConditionHandlerInfo")
export class ConditionHandlerInfo {
    @property
    condition: string = '';

    @property(no.EventHandlerInfo)
    handlers: no.EventHandlerInfo[] = [];

}
@ccclass('SetConditionHandler')
@menu('NoUi/ui/SetConditionHandler(条件触发行为:string)')
/**
 * 条件触发处理器
 * 
 * @功能说明
 * - 根据传入的条件字符串匹配并执行对应的处理事件
 * - 支持配置多个条件-处理对
 * - 可扩展的事件处理系统（通过no.EventHandlerInfo）
 * 
 * @使用示例
 * // 当收到"open"条件时执行打开界面操作
 * a_setData('open');
 * 
 * // 当收到"close"条件时执行关闭动画和保存数据
 * a_setData('close');
 * 
 * @实现说明
 * 1. 继承自FuckUi实现数据驱动能力
 * 2. 通过infos数组维护条件与处理事件的映射关系
 * 3. 精确字符串匹配条件，支持任意类型数据转换为字符串匹配
 */
export class SetConditionHandler extends HackUi {
    /**
     * 条件-处理配置数组
     * @example
     * 配置结构示例：
     * [{
     *   condition: 'login', // 当收到'login'字符串时触发
     *   handlers: [{
     *     target: mainMenu, // 目标节点
     *     component: 'MainUI', // 组件名
     *     handler: 'showLoginPanel' // 处理方法
     *   }]
     * }]
     */
    @property(ConditionHandlerInfo)
    infos: ConditionHandlerInfo[] = [];

    /**
     * 数据变化处理核心方法
     * @param data 传入的条件参数，自动转换为字符串进行匹配
     * @example
     * // 触发所有condition为'attack'的处理事件
     * onDataChange('attack');
     * 
     * // 支持非字符串类型自动转换，数字123会转为"123"匹配
     * onDataChange(123);
     */
    protected onDataChange(data: any) {
        // 将输入数据统一转为字符串进行匹配
        const condition = String(data);
        
        // 遍历所有配置的条件处理项
        for (let i = 0; i < this.infos.length; i++) {
            const info = this.infos[i];
            // 精确匹配条件字符串
            if (info.condition === condition) {
                // 执行关联的所有事件处理器
                no.EventHandlerInfo.execute(info.handlers);
                
                // 找到第一个匹配项后立即返回（如需支持多个匹配可移除return）
                return;
            }
        }
    }
}
