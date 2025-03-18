
import { EDITOR, ccclass, menu, property, executeInEditMode, requireComponent, Toggle } from '../yj';
import { YJDataWork } from '../base/YJDataWork';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetToggleCheck
 * DateTime = Mon Jan 17 2022 14:41:35 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetToggleCheck.ts
 * FileBasenameNoExtension = SetToggleCheck
 * URL = db://assets/Script/NoUi3/ui/SetToggleCheck.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetToggleCheck')
@menu('NoUi/ui/SetToggleCheck(设置复选框选中状态:bool)')
@executeInEditMode()
@requireComponent(Toggle)
/**
 * Toggle复选框状态控制组件
 * @功能说明：
 * - 通过数据驱动设置Toggle的选中状态
 * - 支持反向逻辑处理
 * - 支持静默设置（不触发回调）
 * - 可绑定数据工作组件
 * 
 * @使用示例：
 * // 通过数据绑定设置状态：
 * this.a_setData(true)  // 直接设置选中状态
 * 
 * // 通过方法设置状态：
 * this.a_setChecked()    // 设置为选中状态
 * this.a_setNotChecked() // 设置为未选中状态
 */
export class SetToggleCheck extends HackUi {
    /**
     * 是否取反数据值
     * @规则：
     * - true时实际选中状态与传入数据相反
     * @示例 
     * reverse = true 时：
     * - 传入true → 实际显示未选中
     * - 传入false → 实际显示选中
     */
    @property({ displayName: '取反' })
    reverse: boolean = false;

    /**
     * 静默设置模式
     * @功能说明：
     * - true时使用setIsCheckedWithoutNotify方法设置状态
     * - 避免触发checkEvents回调
     * @示例 
     * 批量更新多个Toggle时使用可优化性能
     */
    @property({ tooltip: '设置 isChecked 而不调用 checkEvents 回调' })
    setCheckedWithoutNotify: boolean = false;

    /**
     * 关联的数据工作组件
     * @功能说明：
     * - 用于数据绑定工作流
     * - 在编辑器模式下自动获取父节点组件
     * @示例 
     * // 在层级中自动查找父节点的YJDataWork组件
     * this.dataWork = parent.getComponent(YJDataWork)
     */
    @property({ type: YJDataWork })
    dataWork: YJDataWork = null;

    /**
     * 绑定checkEvents事件
     * @实现原理：
     * - 设置时自动创建事件处理器
     * - 将Toggle的checkEvents绑定到onCheckChange方法
     * @示例 
     * // 在编辑器中勾选bindCheckEvents属性即可自动绑定
     */
    @property
    public get bindCheckEvents(): boolean {
        return false;
    }
    
    public set bindCheckEvents(v: boolean) {
        this.getComponent(Toggle).checkEvents = [no.createEventHandler(this.node, SetToggleCheck, 'onCheckChange')];
    }

    onLoad() {
        super.onLoad();
        // 编辑器模式下自动获取父级数据工作组件
        if (EDITOR) {
            this.dataWork = no.getComponentInParents(this.node, YJDataWork);
            return;
        }
    }

    /**
     * 数据变更处理核心方法
     * @实现流程：
     * 1. 转换输入数据为布尔值
     * 2. 应用反向逻辑（reverse=true时取反）
     * 3. 获取Toggle组件
     * 4. 触发点击事件（当设置为选中状态时）
     * 5. 设置最终选中状态
     * @参数说明：
     * @param data 支持类型：
     * - boolean: 直接使用
     * - string: "true"/"1"视为true，其他为false
     * - number: 0为false，非0为true
     */
    protected onDataChange(data: any) {
        // 转换为布尔值并应用反向逻辑
        let a = Boolean(data);
        if (this.reverse) a = !a;
        
        const toggle = this.getComponent(Toggle);
        
        // 当设置为选中状态时触发所有点击事件
        if (a) {
            // 使用传统for循环遍历事件列表
            for (let i = 0; i < toggle.clickEvents.length; i++) {
                toggle.clickEvents[i].emit([toggle]);
            }
        }
        
        // 根据模式设置选中状态
        if (this.setCheckedWithoutNotify)
            toggle.setIsCheckedWithoutNotify(a);
        else
            toggle.isChecked = a;
    }

    /**
     * 设置为选中状态快捷方法
     * @示例 
     * button.clickHandler = () => this.getComponent(SetToggleCheck).a_setChecked()
     */
    public a_setChecked(): void {
        this.a_setData('true');
    }

    /**
     * 设置为未选中状态快捷方法
     * @示例 
     * resetButton.clickHandler = () => this.getComponent(SetToggleCheck).a_setNotChecked()
     */
    public a_setNotChecked(): void {
        this.a_setData('false');
    }
}
