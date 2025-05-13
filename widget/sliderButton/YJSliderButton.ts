import { no } from "../../no";
import { Component, EDITOR, ccclass, property, Node } from "../../yj";

/**
 * Predefined variables
 * Name = YJSliderButton
 * DateTime = Fri Jul 14 2023 16:41:49 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSliderButton.ts
 * FileBasenameNoExtension = YJSliderButton
 * URL = db://assets/common/widget/sliderButton/YJSliderButton.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 * 滑块按钮，需要在父节点添加BlockInputEvents组件
 */

@ccclass('YJSliderButton')
/**
 * 滑动开关按钮组件
 * 功能特性：
 * - 支持滑动动画效果
 * - 可配置防连点保护机制
 * - 支持状态切换时显示/隐藏指定节点
 * - 提供状态改变事件回调
 * @example
 * // 基础使用示例：
 * // 创建开关按钮并绑定回调
 * const slider = node.getComponent(YJSliderButton);
 * slider.onChange.push(new no.EventHandlerInfo().setParams('switch_changed'));
 * 
 * // 通过代码切换状态（触发动画和回调）
 * slider.isChecked = true;
 * 
 * // 静默切换状态（不触发回调）
 * slider.isCheckedNoChange = false;
 */
export class YJSliderButton extends Component {
    @property({ tooltip: '是否可交互（false时点击无响应）\n示例：在冷却期间禁用交互' })
    interactable: boolean = true;

    @property({ type: Node, tooltip: '滑动块节点（用于显示滑动动画的UI元素）\n示例：包含背景和滑块的节点' })
    slider: Node = null;

    @property({ type: Node, tooltip: '选中状态需要显示的节点数组\n示例：开启状态图标/文字提示' })
    checkedShowNodes: Node[] = [];

    @property({ type: Node, tooltip: '选中状态需要隐藏的节点数组\n示例：关闭状态图标/禁用提示' })
    checkedHideNodes: Node[] = [];

    @property({
        tooltip: `当前选中状态（getter/setter）
        设置时会触发滑动动画和状态更新
        示例：isChecked = true 触发开关打开动画`
    })
    public get checked(): boolean {
        return this._checked;
    }

    public set checked(v: boolean) {
        if (EDITOR) return;
        if (this._checked == v) return;
        this._checked = v;
        if (this.slider) {
            this.moveSlider();
        }
    }

    @property({ displayName: '防连点间隔时长(s)', tooltip: '两次有效点击的最小间隔时间（秒）\n示例：设为1表示点击后1秒内不再响应新点击' })
    delay: number = 1;

    @property({ type: no.EventHandlerInfo, tooltip: '状态改变事件回调（参数：当前状态）\n示例：播放音效/更新关联UI' })
    onChange: no.EventHandlerInfo[] = [];

    @property({ serializable: true })
    private _checked: boolean = false; // 实际存储的选中状态
    private _done: boolean = true;     // 动画完成标记（防止动画冲突）
    private needWait: boolean = false; // 连点保护标记
    private _first: boolean = true;    // 首次加载标记（用于编辑器预览）

    protected onLoad(): void {
        this.setCheckedNodesVisible();
        // 注册触摸结束事件（使用TOUCH_END而非TOUCH_START以获得更好的点击体验）
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this, true);
    }

    onEnable() {
        this.needWait = false; // 重置等待状态（组件重新启用时恢复交互）
    }

    protected onDestroy(): void {
        this.node.targetOff(this); // 组件销毁时移除所有事件监听
    }

    /**
     * 点击事件处理
     * @description 处理逻辑：
     * 1. 检查交互性状态
     * 2. 防连点检测
     * 3. 切换选中状态
     * 4. 执行滑动动画或直接更新状态
     * 5. 启动连点保护计时器
     */
    private onClick() {
        this._first = false; // 标记非首次操作
        if (!this.interactable || !this.enabled) return;
        if (!this._done) return; // 动画未完成时忽略点击
        if (this.needWait) return; // 连点保护期间忽略点击

        this.needWait = true;
        this._done = false;
        this._checked = !this._checked;

        if (this.slider) {
            this.moveSlider(); // 执行带动画的状态切换
        } else {
            this.setCheckedNodesVisible(); // 无滑块时直接更新状态
            no.EventHandlerInfo.execute(this.onChange, this._checked);
            this._done = true;
        }

        // 启动连点保护计时器
        this.scheduleOnce(() => {
            this.needWait = false;
        }, this.delay);
    }

    /**
     * 移动滑动块
     * @param noChange 是否不触发状态改变回调（用于静默更新）
     */
    private moveSlider(noChange = false) {
        // 计算目标位置：根据当前状态决定滑动方向
        let x = Math.abs(no.x(this.slider));
        x *= this._checked ? 1 : -1;
        this.playAni(x, noChange);
    }

    /**
     * 执行滑动动画
     * @param x 目标X坐标
     * @param noChange 是否不触发回调
     * @description 实现细节：
     * - 编辑器环境下直接设置位置
     * - 运行时使用缓动动画过渡
     */
    private playAni(x: number, noChange: boolean) {
        if (EDITOR || this._first) {
            this._first = false;
            no.x(this.slider, x); // 编辑器模式直接设置位置
            this.setCheckedNodesVisible();
            return;
        }

        // 创建缓动动画配置
        const action = no.parseTweenData({
            duration: 0.1, // 动画持续时间（秒）
            to: 1,
            props: {
                pos: [x, no.y(this.slider)] // 目标位置（保持Y轴不变）
            }
        }, this.slider);

        // 播放动画并在完成后更新状态
        no.TweenSet.play(action, () => {
            if (!noChange) no.EventHandlerInfo.execute(this.onChange, this._checked);
        });
        this.setCheckedNodesVisible();
    }

    /**
     * 更新关联节点可见状态
     * @description 根据当前选中状态：
     * - 显示checkedShowNodes数组中的节点
     * - 隐藏checkedHideNodes数组中的节点
     */
    private setCheckedNodesVisible() {
        this.checkedShowNodes.forEach(n => {
            no.visible(n, this._checked);
        });
        this.checkedHideNodes.forEach(n => {
            no.visible(n, !this._checked);
        });
        this._done = true; // 标记动画完成
    }

    /**
     * 设置开关状态（触发回调）
     * @example
     * // 切换状态并触发动画和事件
     * slider.isChecked = true;
     */
    public set isChecked(v: boolean) {
        this.checked = v;
    }

    /**
     * 静默设置开关状态（不触发回调）
     * @example
     * // 初始化时恢复保存的状态
     * slider.isCheckedNoChange = savedState;
     */
    public set isCheckedNoChange(v: boolean) {
        this._checked = v;
        this.moveSlider(true); // true表示不触发状态改变回调
    }
}
