
import { ccclass, property, Component, Node, math, isValid, Size } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJSyncContentSizeToTarget
 * DateTime = Tue Jul 19 2022 11:26:54 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSyncContentSizeToTarget.ts
 * FileBasenameNoExtension = YJSyncContentSizeToTarget
 * URL = db://assets/NoUi3/base/node/YJSyncContentSizeToTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//同步目标节点的contentSize，受scale影响
@ccclass('YJSyncContentSizeToTarget')
/**
 * 节点尺寸同步组件
 * @remarks
 * - 实现两个节点之间的尺寸同步，支持双向同步
 * - 支持缩放系数计算和自定义偏移量
 * - 提供尺寸变化事件回调
 * - 适用于自适应布局、动态尺寸同步等场景
 * 
 * @example
 * // 编辑器配置示例：
 * 1. 添加到需要尺寸同步的节点
 * 2. 拖拽目标节点到target属性
 * 3. 设置检测模式（检测自己或检测目标）
 * 4. 配置偏移量和缩放同步选项
 * 
 * // 代码动态创建示例：
 * const node = new Node('SyncNode');
 * const comp = node.addComponent(YJSyncContentSizeToTarget);
 * comp.target = targetNode; // 设置同步目标
 * comp.checkSelf = true;    // 开启主动检测模式
 * comp.syncScale = false;   // 禁用缩放同步
 */
export class YJSyncContentSizeToTarget extends Component {
    /** 
     * 同步目标节点 
     * @tip 需要建立尺寸关联的另一个节点
     */
    @property(Node)
    target: Node = null;

    /** 
     * 尺寸偏移量 
     * @tip 最终尺寸 = 计算尺寸 + 偏移量（可正可负）
     */
    @property
    offset: Size = math.size();

    /** 
     * 尺寸检测模式
     * @tip
     * - true: 主动模式（监听自己尺寸变化，同步到目标节点）
     * - false: 被动模式（监听目标尺寸变化，同步到自己节点）
     */
    @property({ displayName: '检测自己', tooltip: '为勾选后将自己的size同步到target，否则将target的size同步到自己' })
    checkSelf: boolean = false;

    /** 
     * 尺寸变化事件回调 
     * @tip 每次完成尺寸同步后触发的事件列表
     */
    @property(no.EventHandlerInfo)
    onChange: no.EventHandlerInfo[] = [];

    /** 
     * 缩放同步开关 
     * @tip 开启时会计算节点的缩放系数对最终尺寸的影响
     */
    @property({ displayName: '是否同步scale' })
    syncScale: boolean = true;

    /** 
     * 测试模式开关 
     * @tip 编辑器模式下用于手动触发尺寸检查
     */
    @property({ displayName: '测试' })
    public get test(): boolean {
        return false;
    }

    public set test(v: boolean) {
        if (v) {
            this.check()
        }
    }

    /** 组件启用时注册尺寸变化监听 */
    protected onEnable(): void {
        this.check();
        // 根据检测模式注册对应节点的尺寸变化事件
        if (this.checkSelf)
            this.node.on(Node.EventType.SIZE_CHANGED, this.check, this);
        else this.target?.on(Node.EventType.SIZE_CHANGED, this.check, this);
    }

    /** 组件禁用时移除尺寸变化监听 */
    protected onDisable(): void {
        // 移除对应节点的事件监听
        if (this.checkSelf)
            this.node.targetOff(this);
        else this.target?.targetOff(this);
    }

    /** 
     * 执行尺寸同步检查
     * @remarks
     * 执行流程：
     * 1. 校验节点有效性
     * 2. 根据检测模式选择同步方向
     * 3. 调用实际同步方法
     */
    private check() {
        if (!this.target || !isValid(this?.node)) {
            return;
        }
        if (this.checkSelf) {
            this.syncSize(this.node, this.target);
        } else {
            this.syncSize(this.target, this.node);
        }
    }

    /**
     * 执行实际尺寸同步
     * @param from 尺寸来源节点
     * @param to 尺寸目标节点
     * @remarks
     * 计算逻辑：
     * 1. 获取原始尺寸和缩放系数
     * 2. 根据syncScale决定是否计算缩放影响
     * 3. 应用偏移量
     * 4. 设置目标节点尺寸
     * 5. 触发回调事件
     */
    private syncSize(from: Node, to: Node) {
        let size = no.size(from);
        let scale = no.scale(from);
        // 计算缩放影响后的实际尺寸
        if (this.syncScale) {
            size.width *= scale.x;
            size.height *= scale.y;
        }
        // 应用偏移量
        size.width += this.offset.width;
        size.height += this.offset.height;
        // 设置目标节点尺寸并触发事件
        no.size(to, size);
        no.EventHandlerInfo.execute(this.onChange);
    }

    /**
     * 手动设置节点尺寸并触发同步
     * @param size 新的尺寸值
     * @tip 可用于程序控制尺寸变化时的强制同步
     */
    public setSize(size: Size) {
        no.size(this.node, size);
        this.check();
    }
}
