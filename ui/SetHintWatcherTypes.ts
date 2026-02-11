import { HintWatcher } from '../extend/hint/HintWatcher';
import { ccclass } from '../yj';
import { HackUi } from './HackUi';

/**
 * 
 * Author mqsy_yj
 * DateTime Thu Feb 01 2024 11:18:11 GMT+0800 (中国标准时间)
 *
 */

@ccclass('SetHintWatcherTypes')
/**
 * 提示监视器类型设置组件
 * 用于动态设置YJHintWatcher组件的可监听提示类型
 * 
 * @示例 
 * // 设置监视器监听类型为字符串数组
 * { types: ["item_get", "level_up"] }
 * 
 * // 或使用完整对象格式配置
 * { types: [
 *   { type: "quest", priority: 1 },
 *   { type: "system", priority: 2 }
 * ]}
 */
export class SetHintWatcherTypes extends HackUi {

    /**
     * 数据变更处理函数
     * @param data 配置数据对象，应包含types字段。支持两种格式：
     * - 简单字符串数组：["type1", "type2"]
     * - 配置对象数组：[{type:string, priority?:number}]
     * @示例
     * // 基本类型配置
     * onDataChange({ types: ["achievement", "collection"] });
     * 
     * // 带优先级的详细配置 
     * onDataChange({ types: [{type: "emergency", priority: 0}] });
     */
    protected onDataChange(data: any) {
        // 获取关联的提示监视器组件并更新类型配置
        this.getComponent(HintWatcher).setHintTypes(data);
    }
}
