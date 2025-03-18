
import { EDITOR, ccclass, property, menu, executeInEditMode, UIOpacity } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetVisibility
 * DateTime = Mon Jan 17 2022 14:44:31 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetVisibility.ts
 * FileBasenameNoExtension = SetVisibility
 * URL = db://assets/Script/NoUi3/ui/SetVisibility.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetVisibility')
@menu('NoUi/ui/SetVisibility(设置显隐:bool)')
@executeInEditMode()
/**
 * 显隐控制组件
 * @功能说明：
 * - 通过布尔值控制节点显隐状态
 * - 支持取反逻辑、透明度控制、默认激活状态
 * - 提供快捷方法控制显隐状态
 * 
 * @使用示例：
 * // 显示节点（考虑取反设置）
 * this.a_show();
 * 
 * // 隐藏节点（考虑取反设置）
 * this.a_hide();
 * 
 * // 切换当前显隐状态
 * this.a_changeVisible();
 */
export class SetVisibility extends HackUi {
    /**
     * 显隐取反控制
     * @规则：
     * - true时实际显示状态与输入值相反
     * - false时直接使用输入值
     * @示例 
     * reverse=true时，输入true实际隐藏节点
     */
    @property({ displayName: '取反' })
    reverse: boolean = false;

    /**
     * 默认激活状态
     * @特性：
     * - 编辑器可见属性
     * - 设置时会立即更新节点显隐状态
     * @示例 
     * defaultActive=true时节点默认可见
     */
    @property({ displayName: '默认激活' })
    public get defaultActive(): boolean {
        return this.default;
    }

    public set defaultActive(v: boolean) {
        if (this.default == v) return;
        this.default = v;
        no.visible(this.node, v);
    }

    /**
     * 透明度控制模式
     * @功能说明：
     * - true时通过修改透明度实现显隐（保留节点active状态）
     * - false时直接修改节点active属性
     * @实现细节：
     * - 启用时会自动添加UIOpacity组件
     * - 禁用时移除UIOpacity组件
     */
    @property({ displayName: '改变透明度' })
    public get opacity(): boolean {
        return this.isOpacity;
    }

    public set opacity(v: boolean) {
        this.isOpacity = v;
        if (v) {
            if (!this.getComponent(UIOpacity)) this.addComponent(UIOpacity);
        } else this.getComponent(UIOpacity)?.destroy();
    }

    // 默认显隐状态存储字段
    @property({ serializable: true, visible() { return false; } })
    protected default: boolean = true;
    // 透明度模式状态存储字段
    @property({ serializable: true, visible() { return false; } })
    protected isOpacity: boolean = false;

    /** @deprecated 已废弃的默认设置需求标记 */
    private _needSetDefault: boolean = true;

    /**
     * 节点加载回调
     * @执行逻辑：
     * - 非编辑器环境下应用默认显隐状态
     * - 继承父类onLoad逻辑
     */
    onLoad() {
        super.onLoad();
        if (!EDITOR) {
            this.setDefault();
        }
    }

    /**
     * 数据变更处理
     * @param data 输入数据支持类型：
     * - 对象：检查对象所有属性值，全部为true时显示
     * - 字符串'null'：强制隐藏
     * - 其他类型：转换为布尔值
     * @示例 
     * 输入{visible:true, enabled:true} → 显示
     * 输入{visible:false} → 隐藏
     * 输入"null" → 隐藏
     * 输入"true" → 显示
     */
    protected onDataChange(data: any) {
        this._needSetDefault = false;
        if (!this.enabled) return;
        
        if (data instanceof Object) {
            let allTrue = true;
            // 遍历对象所有属性检查是否全为真值
            const keys = Object.keys(data);
            for (let i = 0; i < keys.length; i++) {
                if (!data[keys[i]]) {
                    allTrue = false;
                    break;
                }
            }
            this.show(allTrue);
        } else {
            // 处理特殊字符串'null'情况
            if (data == 'null') this.show(false);
            else this.show(Boolean(data));
        }
    }

    /**
     * 应用默认显隐状态
     * @执行条件：
     * - 组件处于启用状态
     * - 需要设置默认状态标记为true
     */
    private setDefault() {
        if (!this.enabled || !this._needSetDefault) return;
        this._show(this.default);
    }

    /**
     * 处理显示逻辑（考虑取反设置）
     * @param v 原始显示状态
     */
    private show(v: boolean) {
        if (!this.enabled) return;
        // 应用取反逻辑
        if (this.reverse) v = !v;
        this._show(v);
    }

    /**
     * 实际显隐控制方法
     * @param v 最终显示状态
     * @实现细节：
     * - 根据opacity设置选择显隐方式
     * - 使用no工具类方法处理具体逻辑
     */
    private _show(v: boolean) {
        if (this.isOpacity) {
            no.visibleByOpacity(this.node, v);
        } else {
            no.visible(this.node, v);
        }
    }

    /**
     * 显示节点快捷方法
     * @示例 
     * this.a_show(); // 考虑reverse设置后的显示
     */
    public a_show(): void {
        this.a_setData(this.reverse ? false : true);
    }

    /**
     * 隐藏节点快捷方法
     * @示例 
     * this.a_hide(); // 考虑reverse设置后的隐藏
     */
    public a_hide(): void {
        this.a_setData(this.reverse ? true : false);
    }

    /**
     * 切换当前显隐状态
     * @实现逻辑：
     * - 获取当前实际显示状态
     * - 设置为相反状态
     * @示例 
     * 当前显示时调用后隐藏，反之亦然
     */
    public a_changeVisible(): void {
        const currentVisible = this.isOpacity ? 
            no.visibleByOpacity(this.node) : 
            no.visible(this.node);
        this.a_setData(!currentVisible);
    }
}
