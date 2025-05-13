
import { ccclass, property, menu, Button } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetClickEvent
 * DateTime = Mon Jan 17 2022 10:35:02 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetClickEvent.ts
 * FileBasenameNoExtension = SetClickEvent
 * URL = db://assets/Script/common/ui/SetClickEvent.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetClickEvent')
@menu('NoUi/ui/SetClickEvent(设置子项点击事件:string|number)')
/**
 * 点击事件处理组件
 * 
 * @功能说明
 * - 管理UI元素的点击事件处理
 * - 支持动态绑定/解绑点击事件
 * - 允许传递静态值或动态数据作为事件参数
 * 
 * 
 * // 事件类型配置示例：
 * // 设置type为"menu_click"，点击时触发全局事件
 */
export class SetClickEvent extends HackUi {
    /**
     * 事件类型标识
     * @配置说明 
     * - 用于全局事件系统的事件类型标识
     * - 非空时通过no.evn.emit触发全局事件
     * - 格式建议：模块名_事件名（如"shop_item_click"）
     */
    @property({ displayName: '事件类型' })
    type: string = '';

    /**
     * 按钮绑定控制属性
     * @功能说明
     * - 当设置为true时自动为节点添加点击事件监听
     * - 依赖Button组件，自动创建或使用现有组件
     * - 实际绑定逻辑在setter中实现
     */
    @property
    public get bind(): boolean {
        return false;
    }

    public set bind(v: boolean) {
        // 获取或添加Button组件，并创建标准点击事件
        this.getComponent(Button)?.clickEvents.push(
            no.createClickEvent(this.node, SetClickEvent, 'a_onClick')
        );
    }

    // 存储动态数据值
    private _v: any;

    /**
     * 数据更新处理方法
     * @param data 接收到的数据，可以是：
     * - 任意类型数据：数字、字符串、对象等
     * - null/undefined：表示清空存储值
     */
    protected onDataChange(data: any) {
        this._v = data;
    }

    /**
     * 点击事件处理核心方法
     * @param e 事件对象（Cocos原生事件）
     * @param v 按钮组件传递的附加参数（可选）
     * 
     * @实现逻辑
     * 1. 优先使用通过onDataChange存储的动态值(_v)
     * 2. 当_v为空时使用按钮直接传递的参数(v)
     * 3. 当type字段有值时触发全局事件系统
     */
    public a_onClick(e: any, v: any) {
        if (this.type != '') {
            // 触发全局事件，参数选择策略：动态数据优先于直接参数
            no.evn.emit(this.type, this._v == null ? v : this._v);
        }
    }
}
