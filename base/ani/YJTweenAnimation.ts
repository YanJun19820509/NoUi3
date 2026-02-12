import { no } from "@hackUi/no";
import { ccclass, Color, Component, Enum, property, SpriteFrame, v2, Vec2, Node, Tween, UITransform, UIOpacity, UIRenderer, Sprite, v3, isValid, color, tween } from "../../yj";
import { EasingType } from "@hackUi/types";
import { getEasingFn } from "./YJTween";
/**
 * 
 * Author mqsy_yj
 * DateTime Thu Feb 12 2026 12:10:18 GMT+0800 (中国标准时间)
 *
 */

enum ActionType {
    To = 1,
    By = 2,
    Set = 3,
    Delay = 4,
    Call = 5,
    Union = 6,
    Repeat = 7,
    RepeatForever = 8,
    Reverse = 9
};

enum TargetType {
    Node = 1,
    UITransform = 2,
    UIOpacity = 3,
    Color = 4,
    SpriteFrame = 5,
}

@ccclass('ActionConfig')
class ActionConfig {
    @property({ type: Enum(TargetType), displayName: '目标类型' })
    targetType: TargetType = TargetType.Node;
    @property({ type: Enum(ActionType), displayName: '动作类型' })
    actionType: ActionType = ActionType.To;
    @property({ displayName: "动画持续时长(秒)", min: 0, visible() { return this.actionType === ActionType.To || this.actionType === ActionType.By || this.actionType === ActionType.Delay; } })
    duration: number = 0.1; // 动画过渡时间（单位：秒），0表示立即设置目标值

    @property({ displayName: '位置', visible() { return this.targetType === TargetType.Node && (this.actionType === ActionType.To || this.actionType === ActionType.By || this.actionType === ActionType.Set) } })
    isPos: boolean = false;
    @property({ displayName: '旋转', visible() { return this.targetType === TargetType.Node && (this.actionType === ActionType.To || this.actionType === ActionType.By || this.actionType === ActionType.Set) } })
    isRotation: boolean = false;
    @property({ displayName: '缩放', visible() { return this.targetType === TargetType.Node && (this.actionType === ActionType.To || this.actionType === ActionType.By || this.actionType === ActionType.Set) } })
    isScale: boolean = false;
    @property({ displayName: '大小', visible() { return this.targetType === TargetType.UITransform && (this.actionType === ActionType.To || this.actionType === ActionType.By || this.actionType === ActionType.Set) } })
    isSize: boolean = false;
    @property({ displayName: '锚点', visible() { return this.targetType === TargetType.UITransform && (this.actionType === ActionType.To || this.actionType === ActionType.By || this.actionType === ActionType.Set) } })
    isAnchor: boolean = false;

    @property({ group: '属性', visible() { return this.isPos } })
    position: Vec2 = v2(0, 0);
    @property({ group: '属性', visible() { return this.isRotation } })
    rotation: number = 0;
    @property({ group: '属性', visible() { return this.isScale } })
    scale: Vec2 = v2(1, 1);

    @property({ group: '属性', visible() { return this.isSize } })
    size: Vec2 = v2(0, 0);
    @property({ group: '属性', visible() { return this.isAnchor } })
    anchor: Vec2 = v2(0.5, 0.5);

    @property({ group: '属性', visible() { return this.targetType === TargetType.UIOpacity && (this.actionType === ActionType.To || this.actionType === ActionType.By || this.actionType === ActionType.Set) } })
    opacity: number = 255;

    @property({ group: '属性', visible() { return this.targetType === TargetType.Color && (this.actionType === ActionType.To || this.actionType === ActionType.By || this.actionType === ActionType.Set) } })
    color: Color = color(255, 255, 255, 255);

    @property({ type: SpriteFrame, group: '属性', visible() { return this.targetType === TargetType.SpriteFrame && (this.actionType === ActionType.To || this.actionType === ActionType.By || this.actionType === ActionType.Set) } })
    spriteFrame: SpriteFrame = null;

    @property({ type: Enum(EasingType), visible() { return this.actionType === ActionType.To || this.actionType === ActionType.By } })
    easing: EasingType = EasingType.LINEAR; // 动画运动曲线类型，控制动画的加速度变化

    @property({ type: no.EventHandlerInfo, visible() { return this.actionType === ActionType.Call } })
    call: no.EventHandlerInfo[] = [];

    @property({ min: 1, step: 1, visible() { return this.actionType === ActionType.Repeat } })
    repeatTimes: number = 1;

    public properties() {
        let props: any = { easing: getEasingFn(this.easing) };
        switch (this.targetType) {
            case TargetType.Node:
                if (this.isPos)
                    props.position = v3(this.position.x, this.position.y, 0);
                if (this.isRotation)
                    props.rotation = this.rotation;
                if (this.isScale)
                    props.scale = v3(this.scale.x, this.scale.y, 1);
                break;
            case TargetType.UITransform:
                if (this.isSize)
                    props.size = v2(this.size.x, this.size.y);
                if (this.isAnchor)
                    props.anchor = v2(this.anchor.x, this.anchor.y);
                break;
            case TargetType.UIOpacity:
                props.opacity = this.opacity;
                break;
            case TargetType.Color:
                props.color = this.color;
                break;
            case TargetType.SpriteFrame:
                props.spriteFrame = this.spriteFrame;
                break;
        }
        return props;
    }
}

/**
 * 串行动画效果数组类
 */
@ccclass('YJTweenAction')
class YJTweenAction {
    @property({
        type: ActionConfig,
        displayName: "串行动画效果"
    })
    actionConfigs: ActionConfig[] = [];

    private _idx: number;

    public createAction(node: Node): Tween {
        if (this.actionConfigs.length == 0) return null;
        this._idx = 0;
        return this.parseActionConfig(node);
    }

    private parseActionConfig(node: Node): Tween {
        let config = this.actionConfigs[this._idx];
        let action: Tween = this.parseTarget(config.targetType, node);
        if (!action) return null;
        this.parseAction(action, config.actionType, config);
        this.next(action, node);
        return action;
    }

    private next(action: Tween, node: Node) {
        this._idx++;
        let config = this.actionConfigs[this._idx];
        if (!config) return;
        if (config.targetType !== this.actionConfigs[this._idx - 1].targetType) {
            action.union();
            let a = this.parseActionConfig(node);
            if (a) action.call(() => a.start());
        } else {
            this.parseAction(action, config.actionType, config);
            this.next(action, node);
        }
    }

    private parseTarget(targetType: TargetType, node: Node) {
        switch (targetType) {
            case TargetType.Node:
                return tween(node);
            case TargetType.UITransform:
                return tween(node.getComponent(UITransform) || node.addComponent(UITransform));
            case TargetType.UIOpacity:
                return tween(node.getComponent(UIOpacity) || node.addComponent(UIOpacity));
            case TargetType.Color:
                if (node.getComponent(UIRenderer))
                    return tween(node.getComponent(UIRenderer));
                break;
            case TargetType.SpriteFrame:
                if (node.getComponent(Sprite))
                    return tween(node.getComponent(Sprite));
                break;
        }
        return null;
    }

    private parseAction(action: Tween, actionType: ActionType, config: ActionConfig) {
        switch (actionType) {
            case ActionType.To:
                action.to(config.duration, config.properties());
                break;
            case ActionType.By:
                action.by(config.duration, config.properties());
                break;
            case ActionType.Set:
                action.set(config.properties());
                break;
            case ActionType.Delay:
                action.delay(config.duration);
                break;
            case ActionType.Call:
                if (config.call.length > 0)
                    action.call(function () { no.EventHandlerInfo.execute(config.call) });
                break;
            case ActionType.Union:
                action.union();
                break;
            case ActionType.Repeat:
                action.repeat(config.repeatTimes);
                break;
            case ActionType.RepeatForever:
                action.repeatForever();
                break;
            case ActionType.Reverse:
                action.reverseTime();
                break;
        }
    }
}

@ccclass('ActionInfo')
class ActionInfo {
    @property
    type: string = '';
    @property({ displayName: '是否串行' })
    isSerial: boolean = true;

    @property({
        type: YJTweenAction,
        displayName: "串行",
        visible() { return this.isSerial }
    })
    serialAction: YJTweenAction = new YJTweenAction();

    @property({ displayName: '是否并行' })
    isParallel: boolean = false;
    @property({
        type: YJTweenAction,
        displayName: "并行",
        visible() { return this.isParallel }
    })
    parallelAction: YJTweenAction[] = [];

    @property({
        displayName: '执行次数',
        tooltip: '0表示无限循环，1表示执行一次，2表示执行两次，以此类推\n@示例\n// 设置repeat=0创建无限旋转的加载动画\n// 设置repeat=2让按钮抖动两次后停止',
        min: 0,
        step: 1
    })
    repeat: number = 1;
}

@ccclass('YJTweenAnimation')
export class YJTweenAnimation extends Component {
    @property({
        type: Node,
        displayName: '目标节点',
        tooltip: '不设置则使用当前节点\n@示例\n// 在编辑器中拖拽其他节点到此属性\n// 或通过代码指定：\n// this.node.getComponent(YJUIAnimationEffect).target = someNode'
    })
    target: Node = null;

    @property({
        displayName: '作用在子节点上',
        tooltip: '当启用时，动画效果将作用于目标节点的所有子节点\n@示例\n// 菜单容器所有子项执行序列动画\n// 每个菜单项会依次执行入场效果'
    })
    onChildren: boolean = false;
    @property({
        displayName: '子节点间隔时间',
        tooltip: '子节点间隔时间\n@示例\n// 每个子节点间隔0.1秒执行动画',
        min: 0,
        step: 0.1,
        visible() { return this.onChildren; }
    })
    childrenInterval: number = 0.1;

    @property({
        type: ActionInfo,
        displayName: "动画效果",
        tooltip: "动画效果配置"
    })
    actionInfos: ActionInfo[] = [];

    @property
    repeat: number = 1;

    @property({
        displayName: '自动运行',
        tooltip: '组件启用时自动开始播放动画\n@示例\n// 用于场景开场动画自动播放\n// 或敌人出现时自动执行特效'
    })
    auto: boolean = false;
    @property({
        displayName: '自动运行动画类型',
        visible() { return this.auto; }
    })
    autoRunType: string = '';

    private _tweens: { [type: string]: Tween[] } = null;

    onEnable() {
        if (this.auto) {
            if (!this._tweens) {
                this._tweens = {};
                let actionInfo = this.getActionInfoByType(this.autoRunType);
                if (this.onChildren) {
                    this.playOnChildren(this.node, actionInfo);  // 示例：用于菜单子项集体入场动画
                } else {
                    this.play(this.node, actionInfo);  // 示例：单个UI元素的自动展示动画
                }
            } else {
                this._tweens[this.autoRunType]?.forEach(tween => {
                    tween.start();
                });
            }
        }
    }

    onDisable() {
        this.a_stop();
    }

    protected onDestroy(): void {
        for (let key in this._tweens) {
            this._tweens[key]?.forEach(tween => {
                tween = null;
            });
        }
        this._tweens = null;
    }

    private getActionInfoByType(type: string) {
        if (type) {
            return this.actionInfos.find(i => i.type === type) || this.actionInfos[0];
        } else {
            return this.actionInfos[0];
        }
    }

    /**
     * 播放或停止动画（根据参数切换状态）
     * @param v true-播放 false-停止
     * @使用场景 
     * - 按钮控制动画启停
     * - 条件触发动画状态切换
     * @示例 
     * // 开关按钮点击事件
     * this.a_playOrStop(toggle.isChecked);
     * 
     * // 角色受伤时停止当前动画
     * if(isDamaged) this.a_playOrStop(false);
     */
    public a_playOrStop(v: boolean) {
        if (v) {
            this.a_play();
        } else {
            this.a_stop();
        }
    }

    /**
     * 播放动画核心方法
     * @实现流程
     * 1. 检查组件启用状态
     * 2. 确定目标节点（优先使用target属性指定节点）
     * 3. 根据onChildren设置决定播放模式
     * @注意
     * - 受enabled属性控制
     * - 自动处理节点有效性验证
     * @示例
     * // 播放当前节点动画
     * this.a_play();
     * 
     * // 播放指定子节点动画
     * this.target = childNode;
     * this.a_play();
     */
    public a_play(e?: any, type?: string) {
        if (!this.enabled) return;
        type = type || e;
        this.a_stop();
        if (this._tweens?.[type]) {
            this._tweens[type]?.forEach(tween => {
                tween.start();
            });
            return;
        }
        let info: ActionInfo = this.getActionInfoByType(type);

        const node = this.target || this.node;
        if (this.onChildren) {
            this.playOnChildren(node, info);
        } else {
            this.play(node, info);
        }
    }

    public a_playAll() {
        if (!this.enabled) return;
        this.a_stop();
        const node = this.target || this.node;
        this.actionInfos.forEach(info => {
            if (this._tweens?.[info.type]) {
                this._tweens[info.type].forEach(tween => {
                    tween.start();
                });
            } else {
                if (this.onChildren) {
                    this.playOnChildren(node, info);
                } else {
                    this.play(node, info);
                }
            }
        });
    }

    /**
     * 停止动画核心方法
     * @特性
     * - 立即停止所有关联缓动
     * - 自动清理动画队列
     * @使用场景
     * - 强制中断动画
     * - 配合a_playOrStop使用
     * @示例
     * // 紧急停止所有动画
     * this.a_stop();
     * 
     * // 窗口关闭时停止动画
     * popup.onClose = () => this.a_stop();
     */
    public a_stop() {
        for (let key in this._tweens) {
            this._tweens[key]?.forEach(tween => {
                tween.stop();
            });
        }
    }

    /**
     * 播放动画核心逻辑
     * @param node 目标节点
     * @实现逻辑
     * 1. 检查动画是否启用
     * 2. 根据动画效果数组类型选择播放模式：
     *    - 存在串行效果时优先执行串行动画
     *    - 否则执行并行动画
     * @参数说明
     * - node: 需要执行动画的节点对象
     * @示例
     * // 在按钮节点上播放默认动画
     * this.play(buttonNode);
     * 
     * // 当有串行动画配置时自动触发序列播放
     * this.serialAnimationEffects = [effect1, effect2];
     * this.play(panelNode); // 按顺序执行effect1->effect2
     */
    public play(node: Node, info: ActionInfo) {
        if (!this.enabled) return;
        if (info.isSerial)
            this.playSerial(node, info);
        if (info.isParallel)
            this.playParallel(node, info);
    }

    public playOtherNode(node: Node) {
        const info = this.actionInfos[0];
        if (info.isSerial)
            this.playSerial(node, info);
        if (info.isParallel)
            this.playParallel(node, info);
    }

    private _children: Node[] = [];
    private _childrenIndex: number = 0;
    /**
     * 子节点动画播放器
     * @param node 父级容器节点
     * @实现逻辑
     * 1. 获取所有子节点
     * 2. 使用定时器按0.1秒间隔逐个播放子节点动画
     * 3. 自动处理子节点索引递增
     * @适用场景
     * - 列表项依次入场动画
     * - 批量子元素动画播放
     * @示例
     * // 使菜单项逐个下落出现
     * this.playOnChildren(menuContainer);
     * 
     * // 配合schedule实现间隔0.1秒的播放节奏
     * this.schedule(() => {...}, 0.1, count);
     */
    public playOnChildren(node: Node, info: ActionInfo) {
        if (!this.enabled) return;
        this._children = node.children;
        this._childrenIndex = 0;
        this.schedule(() => {
            this.play(this._children[this._childrenIndex++], info);
        }, this.childrenInterval, this._children.length - 1);
    }

    /**
     * 串行动画播放控制器
     * @param node 目标节点
     * @param repeat 剩余重复次数
     * @实现逻辑
     * 1. 调用内部播放器执行动画序列
     * 2. 根据repeat参数决定是否循环：
     *    - repeat=0时无限循环
     *    - repeat>0时递减直到0停止
     * @示例
     * // 创建3次循环的进度条动画
     * this.repeat = 3;
     * this.playSerial(progressBar, 3);
     */
    private playSerial(node: Node, info: ActionInfo) {
        if (!isValid(node)) return;
        let action = info.serialAction.createAction(node);
        if (!action) return;
        if (info.repeat > 1) action.union().repeat(info.repeat);
        else if (info.repeat == 0) action.union().repeatForever();
        this._tweens[info.type] = this._tweens[info.type] || [];
        this._tweens[info.type].push(action);
        action.start();
    }

    /**
     * 并行动画播放控制器
     * @param node 目标节点 
     * @param repeat 剩余重复次数
     * @实现逻辑
     * 1. 验证节点有效性
     * 2. 并行执行所有动画序列
     * 3. 使用计数器等待所有动画完成
     * 4. 达到条件后触发循环
     * @示例
     * // 同时执行旋转和缩放动画
     * this.parallelAnimationEffects = [rotateEffect, scaleEffect];
     * this.playParallel(iconNode, 2); // 重复2次
     */
    private playParallel(node: Node, info: ActionInfo) {
        if (!isValid(node)) return;
        let actions: Tween[] = [];
        info.parallelAction.forEach(action => {
            let _action = action.createAction(node);
            if (_action) actions.push(_action);
        });
        if (actions.length == 0) return;
        let _1 = actions.shift();
        _1.parallel(...actions);
        _1.start();
        if (info.repeat > 1) _1.union().repeat(info.repeat);
        else if (info.repeat == 0) _1.union().repeatForever();
        this._tweens[info.type] = this._tweens[info.type] || [];
        this._tweens[info.type].push(_1);
    }
}