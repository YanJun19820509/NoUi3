
import { ccclass, property, Size, size, ScrollView, UITransform } from '../../yj';
import { YJDataWork } from '../../base/YJDataWork';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJComboBox
 * DateTime = Fri Apr 01 2022 10:32:46 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJComboBox.ts
 * FileBasenameNoExtension = YJComboBox
 * URL = db://assets/NoUi3/widget/combobox/YJComboBox.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * data :: {
 *      list: {id: string, title: string, icon?:string, checked?: boolean}[],
 *      selected?: 0
 * }
 */
@ccclass('YJComboBox')
/**
 * 组合框组件，支持下拉列表选择功能
 * @example
 * // 数据结构示例：
 * {
 *     list: [
 *         {id: 'opt1', title: '选项1', icon: 'textures/icon1', checked: false},
 *         {id: 'opt2', title: '选项2', checked: true}
 *     ],
 *     selected: 'opt2'
 * }
 * 
 * // 事件绑定示例：
 * // 在属性面板设置：
 * // type: 'COMBOBOX_SELECT'  // 自定义事件类型
 * // onChange: 绑定目标节点的处理函数
 */
export class YJComboBox extends YJDataWork {
    /** 下拉列表的最大显示尺寸（宽高） */
    @property({ displayName: '列表最大尺寸' })
    size: Size = size();

    /** 展开/收起动画的过渡时间（单位：秒） */
    @property({ displayName: '动画时长', min: 0, step: 0.01 })
    duration: number = 0.1;

    /** 是否在初始化时自动显示下拉列表 */
    @property({ displayName: '默认显示列表' })
    autoShow: boolean = false;

    /** 自定义事件类型，用于跨组件通信 */
    @property({ displayName: '事件类型' })
    type: string = '';
    
    /** 列表展开时触发的事件 */
    @property(no.EventHandlerInfo)
    onShow: no.EventHandlerInfo[] = [];
    
    /** 列表收起时触发的事件 */
    @property(no.EventHandlerInfo)
    onHide: no.EventHandlerInfo[] = [];
    
    /** 选项变更时触发的事件，传递选中项数据 */
    @property(no.EventHandlerInfo)
    onChange: no.EventHandlerInfo[] = [];

    private isShow: boolean = false;

    onLoad() {
        super.onLoad();
        // 初始化滚动视图尺寸
        let sv = this.getComponentInChildren(ScrollView);
        sv.node.getComponent(UITransform).setContentSize(this.size);
        // 注册自定义事件监听
        if (this.type)
            no.evn.on(this.type, this.a_onSelect, this);
    }

    onDestroy() {
        // 移除所有事件监听
        no.evn.targetOff(this);
    }

    /**
     * 数据初始化后处理
     * @description 初始化完成后：
     * 1. 根据autoShow设置显示/隐藏列表
     * 2. 设置默认选中项
     */
    protected afterDataInit() {
        this.setListVisible(this.autoShow);
        this.setChecked(this.data.selected);
    }

    /** 切换列表显示状态（公共方法，可用于按钮点击事件） */
    public a_changeVisible(): void {
        this.setListVisible(!this.isShow);
    }

    /** 强制隐藏列表（公共方法） */
    public a_hideList(): void {
        this.setListVisible(false);
    }

    /**
     * 选项选择处理
     * @param d 选中项数据 {id: string, ...}
     * @description 处理流程：
     * 1. 隐藏下拉列表
     * 2. 执行变更事件
     * 3. 更新选中状态
     */
    public a_onSelect(d: any): void {
        this.setListVisible(false);
        no.EventHandlerInfo.execute(this.onChange, d);
        this.setChecked(d.id);
    }

    /** 条件隐藏列表（内部保护方法） */
    private hideList() {
        if (this.isShow) this.a_changeVisible();
    }

    /**
     * 控制列表显示状态
     * @param v 是否显示
     * @description 实现功能：
     * - 尺寸动画（高度过渡）
     * - 透明度动画
     * - 位置偏移防止点击穿透
     * - 触发显示/隐藏事件
     */
    private setListVisible(v: boolean) {
        this.isShow = v;
        // 更新动画参数
        this.data = {
            visible_ani: {
                duration: this.duration,
                to: 1,
                props: {
                    size: [this.size.width, v ? this.size.height : 0],
                    opacity: v ? 255 : 0
                }
            },
            dir: v ? -1 : 1,       // 箭头方向
            x: v ? 0 : -10000,     // 隐藏时移出屏幕
            isShow: v
        };
        // 触发对应事件
        v ? no.EventHandlerInfo.execute(this.onShow) : no.EventHandlerInfo.execute(this.onHide);

        // 显示时需要刷新列表数据
        if (v) {
            this.setListData()
        }
    }

    /** 更新列表数据到渲染器 */
    private setListData() {
        this.data = {
            arr: this.data.list
        }
    }

    /**
     * 设置选中项
     * @param id 要选中的项目ID
     * @description 处理逻辑：
     * 1. 遍历所有选项更新checked状态
     * 2. 更新当前选中数据
     * 3. 刷新列表显示
     */
    private setChecked(id: string) {
        let list = this.data.list;
        if (list) {
            for (let i = 0, n = list.length; i < n; i++) {
                const a = list[i];
                a.checked = a.id == id;
                if (a.checked) {
                    this.data = a;  // 更新当前选中项数据
                }
            }
        }
        this.data = { list: list }; // 刷新列表状态
    }
}
