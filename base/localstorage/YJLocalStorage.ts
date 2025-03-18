import { no } from "../../no";
import { ccclass, Component, EditBox, property, Toggle } from "../../yj";

/**
 * 本地存储组件
 * @核心功能
 * - 自动绑定UI组件(Toggle/EditBox)与本地存储
 * - 支持普通本地存储和账号绑定的业务存储
 * - 自动加载存储数据到UI组件
 * @使用场景
 * - 用户设置保存（音效开关、画质选择等）
 * - 表单数据暂存（登录账号记忆、搜索历史等）
 * - 需要持久化的UI状态保存
 */
@ccclass('YJLocalStorage')
export class YJLocalStorage extends Component {
    /** 
     * 存储键值（需保证唯一性）
     * @规则
     * - 同一场景中不同组件需使用不同key
     * - 建议使用"模块_功能"命名方式
     * @示例 
     * "system_music_switch" 系统音乐开关
     */
    @property({ displayName: '缓存数据的key', tooltip: '不支持多key' })
    key: string = '';

    /** 
     * 是否使用业务缓存（与用户账号绑定）
     * @区别
     * - true: 数据存储在账号隔离空间，切换账号后数据独立
     * - false: 使用设备本地存储，全局生效
     */
    @property({ displayName: '是否业务缓存', tooltip: '业务缓存会与账号绑定' })
    usePreKey: boolean = true;

    // 组件类型开关（互斥）
    @property({ displayName: '是否单选框', visible() { return !this.isEditorBox; } })
    isToggle: boolean = false;
    @property({ displayName: '是否输入框', visible() { return !this.isToggle; } })
    isEditorBox: boolean = false;

    // 关联的UI组件
    @property({ type: EditBox, visible() { return this.isEditorBox; } })
    editBox: EditBox = null;
    @property({ type: Toggle, visible() { return this.isToggle; } })
    toggle: Toggle = null;

    /** 
     * 绑定事件开关（编辑器用）
     * @操作说明
     * 1. 勾选后自动绑定UI事件
     * 2. Toggle组件绑定状态改变事件
     * 3. EditBox绑定文本修改事件
     * @示例
     * 勾选后Toggle的isChecked变化时会自动触发保存
     */
    @property({ displayName: '绑定' })
    public get bind(): boolean {
        return false;
    }

    public set bind(v: boolean) {
        if (this.toggle) {
            this.toggle.checkEvents.push(no.createClickEvent(this.node, YJLocalStorage, 'onChange'));
        } else if (this.editBox) {
            this.editBox.textChanged.push(no.createClickEvent(this.node, YJLocalStorage, 'onChange'));
        }
    }

    /** 组件加载时自动加载存储数据 */
    onLoad() {
        if (!this.key) return;
        // 根据存储类型获取数据
        const v = this.usePreKey ? no.dataCache.getLocal(this.key) : localStorage.getItem(this.key);
        if (v == null) return;
        
        // 数据回显到UI组件
        if (this.isToggle) {
            this.toggle.isChecked = v == 'true'; // 转换字符串为boolean
        } else if (this.isEditorBox) {
            this.editBox.string = v; // 直接设置文本内容
        }
    }

    /** 值变更时保存数据到本地 */
    private onChange() {
        if (!this.key) return;
        
        // 根据组件类型获取值并存储
        if (this.isToggle) {
            const value = this.toggle.isChecked;
            this.usePreKey ? 
                no.dataCache.setLocal(this.key, value) : // 业务存储
                localStorage.setItem(this.key, value.toString()); // 设备存储
        } else if (this.isEditorBox) {
            const value = this.editBox.string;
            this.usePreKey ? 
                no.dataCache.setLocal(this.key, value) : 
                localStorage.setItem(this.key, value);
        }
        
        /* 使用示例：
        1. 记住用户选择 - 勾选框保存：
           key: "user_agreement_accepted"
           isToggle: true
           usePreKey: false

        2. 保存用户输入 - 昵称输入框：
           key: "last_nickname"
           isEditorBox: true
           usePreKey: true
        */
    }
}


