
import { _decorator, Component, isValid, math, Node } from 'cc';
import { YJDataWork } from '../../base/YJDataWork';
import { no } from '../../no';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJFold
 * DateTime = Tue May 16 2023 09:58:45 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJFold.ts
 * FileBasenameNoExtension = YJFold
 * URL = db://assets/NoUi3/widget/fold/YJFold.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//折叠组件
@ccclass('YJFold')
/**
 * 折叠组件
 * @example
 * // 编辑器配置示例：
 * // 1. 将需要折叠的内容节点拖拽到Content属性
 * // 2. 设置maxSize为200（当内容高度/宽度超过200时显示折叠按钮）
 * // 3. 设置minSize为50（折叠后保留50像素的可见区域）
 * // 4. 绑定dataWork到负责动画控制的YJDataWork组件
 * 
 * // 代码调用示例：
 * // 获取组件引用
 * const foldComp = this.node.getComponent(YJFold);
 * // 手动触发折叠/展开
 * foldComp.a_foldOrUnfold();
 * // 强制展开内容
 * foldComp.a_unfold();
 */
export class YJFold extends Component {
    @property({ displayName: '是否水平折叠', tooltip: '默认为垂直折叠，勾选后为水平\n示例：true-水平方向折叠 false-垂直方向折叠' })
    isHorizontal: boolean = false;

    @property({ type: Node, tooltip: '需要折叠的内容节点\n示例：包含文本内容的ScrollView节点' })
    content: Node = null;

    @property({ tooltip: '触发折叠的阈值尺寸\n当content宽/高大于此值时显示折叠控件\n示例：100-当内容尺寸超过100时显示折叠按钮' })
    maxSize: number = 100;

    @property({ tooltip: '折叠后保留的最小可见尺寸\n示例：30-折叠后保留30像素的可见区域' })
    minSize: number = 0;

    @property({ type: YJDataWork, tooltip: '数据驱动组件，用于控制动画状态\n需要绑定到负责尺寸变化的YJDataWork组件' })
    dataWork: YJDataWork = null;

    // 记录内容节点的原始尺寸（展开状态时的尺寸）
    private targetSize: math.Size;

    /**
     * 切换折叠/展开状态
     * @example
     * // 按钮点击事件绑定：
     * // 在属性面板将按钮的点击事件绑定到该组件，选择a_foldOrUnfold方法
     */
    public a_foldOrUnfold() {
        if (!this.enabled) return;
        if (!isValid(this?.content)) return;
        if (this.isHorizontal) this.foldOrUnfoldHorizontal();
        else this.foldOrUnfoldVertical();
    }

    /**
     * 强制展开内容
     * @description 当内容处于折叠状态时，将其展开到原始尺寸
     * @example
     * // 当检测到用户悬停时自动展开：
     * onMouseEnter() {
     *     this.getComponent(YJFold).a_unfold();
     * }
     */
    public a_unfold() {
        if (!this.enabled) return;
        let size = no.size(this.content);
        if (this.isHorizontal && size.width == this.minSize) this.foldOrUnfoldHorizontal();
        else if (size.height == this.minSize) this.foldOrUnfoldVertical();
    }

    /**
     * 设置目标尺寸并检测是否需要显示折叠控件
     * @description 初始化时调用，用于：
     * 1. 记录内容原始尺寸
     * 2. 根据maxSize判断是否需要显示折叠按钮
     * @example
     * // 在内容尺寸变化后调用：
     * onContentResize() {
     *     this.getComponent(YJFold).a_setTargetSize();
     * }
     */
    public a_setTargetSize() {
        if (!this.enabled) return;
        this.targetSize = no.size(this.content);
        let show = false;
        // 根据折叠方向和内容尺寸判断是否需要显示折叠控件
        if (this.isHorizontal && this.targetSize.width >= this.maxSize) show = true;
        else if (this.targetSize.height >= this.maxSize) show = true;
        this.dataWork.data = {
            show: show
        };
    }

    /**
     * 垂直方向折叠/展开动画
     * @description 修改内容节点的高度实现折叠效果
     * 动画参数说明：
     * - duration: 0.2秒动画时长
     * - to: 1表示动画完成度100%
     * - props.size: [宽度保持不变, 高度在minSize和targetSize之间切换]
     */
    private foldOrUnfoldVertical() {
        let size = no.size(this.content);
        this.dataWork.data = {
            ani: {
                duration: 0.2,
                to: 1,
                props: {
                    size: [size.width, size.height == this.minSize ? this.targetSize.height : this.minSize]
                }
            }
        };
    }

    /**
     * 水平方向折叠/展开动画
     * @description 修改内容节点的宽度实现折叠效果
     * 动画参数说明：
     * - duration: 0.2秒动画时长
     * - to: 1表示动画完成度100%
     * - props.size: [宽度在minSize和targetSize之间切换, 高度保持不变]
     */
    private foldOrUnfoldHorizontal() {
        let size = no.size(this.content);
        this.dataWork.data = {
            ani: {
                duration: 0.2,
                to: 1,
                props: {
                    size: [size.width == this.minSize ? this.targetSize.width : this.minSize, size.height]
                }
            }
        };
    }
}
