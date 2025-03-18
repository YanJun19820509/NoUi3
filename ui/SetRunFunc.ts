import { ccclass, property } from '../../NoUi3/yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * 触发执行
 * Author mqsy_yj
 * DateTime Wed May 22 2024 18:23:36 GMT+0800 (中国标准时间)
 *
 */

@ccclass('SetRunFunc')
/**
 * 事件触发执行组件
 * 功能说明：
 * - 继承自HackUi，通过数据变化触发预定义事件
 * - 支持配置多个事件处理器
 * - 自动将接收到的数据传递给所有注册的事件处理器
 * 
 * @使用示例：
 * // 配置方式（在编辑器中）：
 * 1. 在calls数组添加新项
 * 2. 设置目标组件和方法
 * 3. 配置参数（可选）
 * 
 * // 代码触发方式：
 * // 触发所有注册事件（传递数字参数）
 * this.a_setData(100); 
 * // 触发所有注册事件（传递字符串参数）
 * this.a_setData("start"); 
 * // 触发所有注册事件（传递复杂对象）
 * this.a_setData({type:"attack", value:50});
 */
export class SetRunFunc extends HackUi {
    /**
     * 事件处理器配置数组
     * @property {no.EventHandlerInfo[]} calls
     * @规则：
     * - 每个元素包含以下配置项：
     *   - target: 目标节点
     *   - component: 组件名称
     *   - handler: 方法名称  
     *   - customEventData: 自定义参数（可选）
     * - 在编辑器中通过可视化界面配置
     * @示例：
     * // 配置调用AudioMgr组件的playSound方法
     * {
     *   target: AudioMgrNode,
     *   component: "AudioMgr",
     *   handler: "playSound",
     *   customEventData: "bgm_01"
     * }
     */
    @property({ type: no.EventHandlerInfo })
    calls: no.EventHandlerInfo[] = [];

    /**
     * 数据变化事件处理
     * @param data 传递的参数，支持类型：
     * - 基本类型：number/string/boolean
     * - 复杂对象：Array/Object
     * - 特殊值：null/undefined
     * @实现说明：
     * 1. 遍历所有注册的事件处理器
     * 2. 将data参数传递给每个处理器
     * 3. 处理器会收到两个参数：
     *    - 自定义参数（配置的customEventData）
     *    - 动态传递的data参数
     * 4. 使用传统for循环遍历数组（避免for...of）
     */
    protected onDataChange(data: any) {
        // 使用no模块提供的事件执行方法
        // 内部已处理空数组/无效处理器等情况
        no.EventHandlerInfo.execute(this.calls, data);
    }
}
