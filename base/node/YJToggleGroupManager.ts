
import { EDITOR, ccclass, property, menu, executeInEditMode, Component, Node, ToggleContainer, Toggle, EventTouch } from '../../yj';
import { } from 'cc/env';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJToggleGroupManager
 * DateTime = Thu Mar 24 2022 16:42:14 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJToggleGroupManager.ts
 * FileBasenameNoExtension = YJToggleGroupManager
 * URL = db://assets/common/base/node/YJToggleGroupManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//无需也不能与ToggleContainer的checkEvents绑定

@ccclass('YJToggleGroupManager')
@menu('NoUi/node/YJToggleGroupManager(ToggleGroup管理)')
/**
 * Toggle组管理器
 * @remarks
 * - 扩展ToggleContainer功能，提供更灵活的Toggle组控制
 * - 支持默认选中项设置和程序化控制
 * - 提供带事件和不带事件的两种选中方式
 * - 自动维护单选组状态有效性
 * 
 * @example
 * // 编辑器配置示例：
 * 1. 添加到Toggle容器节点
 * 2. 设置默认选中项索引（从0开始）
 * 3. 绑定toggle选中事件回调
 * 4. 子节点添加Toggle组件
 * 
 * // 代码动态控制示例：
 * const group = node.getComponent(YJToggleGroupManager);
 * group.a_check(2); // 选中第三个toggle并触发事件
 * group.a_checkWithoutEvent(1); // 静默选中第二个toggle
 */
export class YJToggleGroupManager extends ToggleContainer {
    /** 
     * 默认选中的toggle索引
     * @property {number} defaultCheckedIdx
     * @range [-1, Infinity]
     * @tip 
     * - -1 表示初始不选中任何toggle
     * - 超出toggle数量时自动修正到有效范围
     */
    @property({ displayName: '默认选中项', min: -1, step: 1, tooltip: '当为-1时都不选中' })
    defaultCheckedIdx: number = 0;

    /** 
     * toggle选中事件处理器列表
     * @property {no.EventHandlerInfo[]} onToggleChecked
     * @tip 事件回调参数为选中toggle的索引号
     */
    @property(no.EventHandlerInfo)
    onToggleChecked: no.EventHandlerInfo[] = [];
    @property(no.EventHandlerInfo)
    onToggleUnchecked: no.EventHandlerInfo[] = [];

    /** 
     * 当前选中toggle的唯一标识 
     * @private 用于防止重复触发相同toggle的事件
     */
    private checkedToggleUuid: string = null;

    /** 
     * 组件加载时初始化
     * @override
     * @tip 编辑器环境下跳过事件注册，避免影响编辑器操作
     */
    onLoad() {
        if (EDITOR) return;
        // 注册toggle选中事件监听
        this.checkEvents.push(no.createEventHandler(this.node, YJToggleGroupManager, 'a_onCheck'));
    }

    /** 
     * 组件禁用时清理状态
     * @override
     * @tip 保持与父类行为一致的同时重置选中状态
     */
    onDisable() {
        super.onDisable();
        this.checkedToggleUuid = null;
    }

    /** 
     * 验证并维护toggle组状态
     * @public
     * @tip 在以下情况自动调用：
     * 1. Toggle组状态可能不一致时
     * 2. 动态添加/移除toggle后需要刷新状态
     * 
     * @example
     * // 强制刷新组状态：
     * group.ensureValidState();
     */
    public ensureValidState() {
        const toggles = this.toggleItems;
        if (toggles.length == 0) return;
        // 如果不允许全部关闭且有toggle时,确保默认选中项被选中
        if (!this._allowSwitchOff && toggles.length !== 0) {
            const toggle = toggles[this.defaultCheckedIdx];
            if (toggle && !toggle.isChecked) {
                // 强制设置默认选中项
                toggle.isChecked = true;
                this.notifyToggleCheck(toggle);
            } else {
                // 触发选中回调
                this.a_onCheck(toggle);
            }
        }

        // 处理多选情况
        const activeToggles = this.activeToggles();
        if (activeToggles.length > 1) {
            // 保留默认选中项，关闭其他toggle
            const firstToggle = activeToggles[this.defaultCheckedIdx];
            for (let i = 0; i < activeToggles.length; ++i) {
                const toggle = activeToggles[i];
                if (toggle === firstToggle) {
                    continue;
                }
                toggle.isChecked = false;
            }
        }

        if (this._allowSwitchOff) {
            for (let i = 0, n = toggles.length; i < n; i++) {
                toggles[i].clickEvents.push(no.createEventHandler(this.node, YJToggleGroupManager, 'a_onUncheck'))
            }
        }
    }

    /** 
     * toggle选中回调处理
     * @param d 事件源（Toggle组件或触摸事件）
     * @tip 支持两种事件来源：
     * 1. 直接传递Toggle组件
     * 2. 通过触摸事件获取Toggle组件
     */
    public a_onCheck(d: any): void {
        // 解析事件源获取Toggle组件
        let toggle: Toggle = d instanceof Toggle ? d :
            d instanceof EventTouch ? d.target.getComponent(Toggle) : null;
        if (!toggle || this.checkedToggleUuid === toggle.uuid) return;

        // 更新选中状态并触发事件
        this.checkedToggleUuid = toggle.uuid;
        const index = this.toggleItems.indexOf(toggle);
        no.EventHandlerInfo.execute(this.onToggleChecked, index);
    }

    public a_onUncheck(d: any): void {
        // 解析事件源获取Toggle组件
        let toggle: Toggle = d instanceof Toggle ? d :
            d instanceof EventTouch ? d.target.getComponent(Toggle) : null;
        if (!toggle || !toggle.isChecked) return;

        // 更新选中状态并触发事件
        this.checkedToggleUuid = null;
        const index = this.toggleItems.indexOf(toggle);
        no.EventHandlerInfo.execute(this.onToggleUnchecked, index);
    }

    /** 
     * 程序化选中指定toggle
     * @param idx 要选中的toggle索引
     * @tip 会触发onToggleChecked事件
     * 
     * @example
     * // 选中第二个toggle：
     * group.a_check(1);
     */
    public a_check(idx: number): void {
        idx = Number(idx);
        const items = this.getComponentsInChildren(Toggle);

        if (!items[idx]) {
            // 索引无效时仅更新默认索引
            this.defaultCheckedIdx = idx;
            return;
        }

        // 避免重复触发事件
        if (items[idx].isChecked) {
            this.a_onCheck(items[idx]);
        } else {
            items[idx].isChecked = true;
        }
    }

    /** 
     * 静默选中指定toggle
     * @param idx 要选中的toggle索引
     * @tip 不会触发任何事件
     * 
     * @example
     * // 初始化静默设置选中项：
     * group.a_checkWithoutEvent(0);
     */
    public a_checkWithoutEvent(idx: number) {
        idx = Number(idx);
        const items = this.getComponentsInChildren(Toggle);
        for (let i = 0, n = items.length; i < n; i++) {
            items[i].setIsCheckedWithoutNotify(i == idx);
        }
    }

    public a_uncheck(idx: number) {
        idx = Number(idx);
        const items = this.getComponentsInChildren(Toggle);

        if (!items[idx]) {
            return;
        }

        // 避免重复触发事件
        if (items[idx].isChecked) {
            this.a_onUncheck(items[idx]);
            items[idx].isChecked = false;
        }
    }
}

