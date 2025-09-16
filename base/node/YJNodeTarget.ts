
import { ccclass, property, menu, disallowMultiple, Component, Node, Button, Toggle, v3, Vec3, UITransform, EventTouch, EventHandler, sys, Rect, rect } from '../../yj';
import { no } from '../../no';
import { YJJobManager } from '../YJJobManager';
import { YJTouchListener } from '../touch/YJTouchListener';
import { nodeTargetManager } from '../../NodeTargetManager';
import { YJButton } from '../../fix/YJButton';

/**
 * Predefined variables
 * Name = YJNodeTarget
 * DateTime = Fri Jan 14 2022 18:04:33 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJNodeTarget.ts
 * FileBasenameNoExtension = YJNodeTarget
 * URL = db://assets/Script/common/base/node/YJNodeTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJNodeTarget')
@menu('NoUi/node/YJNodeTarget(节点目标)')
@disallowMultiple()
/**
 * 节点目标组件
 * 用于标记和管理可交互的节点目标,提供节点位置、触摸检测等功能
 */
export class YJNodeTarget extends Component {
    /** 
     * 在nodeTargetManager中注册的标识
     * @property {string} type - 节点类型标识，用于全局目标管理
     * @example
     * // 当type设置为"player.weapon"时：
     * // 可以通过nodeTargetManager.get("player.weapon")获取所有同类型节点目标
     */
    @property({ tooltip: '在nodeTargetManager中注册的标识' })
    type: string = '';

    /** 
     * 用于区分在一个节点的子节点中不同的YJNodeTarget
     * @property {string} subType - 子类型标识，配合type使用实现层级区分
     * @example
     * // 当父节点有多个交互区域时：
     * // type="npc.dialog", subType="attack" 表示对话NPC的攻击区域
     * // type="npc.dialog", subType="defense" 表示对话NPC的防御区域
     */
    @property({ tooltip: '用于区分在一个节点的子节点中不同的YJNodeTarget' })
    subType: string = '';

    /** 
     * 自动生成type标识的开关
     * @property {boolean} autoSet - 当为true且type为空时，自动生成type格式为"父节点名称.当前节点名称"
     * @example
     * // 节点结构：MainPanel(父节点) -> StartButton(当前节点)
     * // 启用autoSet后将自动设置type为"MainPanel.StartButton"
     */
    @property
    public get autoSet(): boolean {
        return false;
    }

    public set autoSet(v: boolean) {
        // 已有type时不再自动设置
        if (this.type != '') return;
        // 生成层级名称：父节点名称 + 当前节点名称
        let name = [this.node.name];
        if (this.node.parent) name.unshift(this.node.parent.name);
        this.type = name.join('.');
    }

    /** 
     * 节点世界坐标缓存
     * @private {Vec3} pos - 记录节点的世界坐标系位置
     * @remarks 用于持续检测节点位置变化，当位置改变时自动更新到nodeTargetManager
     */
    private pos: Vec3;

    /** 
     * 最后一次触摸触发时间戳
     * @private {number} lastTriggerTouchTime - 记录最近交互时间（单位：毫秒）
     * @example
     * // 可用于实现防连点功能：
     * if(Date.now() - lastTriggerTouchTime < 500) return; // 500毫秒内不重复响应
     */
    private lastTriggerTouchTime: number = 0;

    /** 
     * 组件加载时初始化
     * @remarks
     * - 初始化最后触摸时间
     * - 自动为按钮组件添加点击事件监听
     * @example
     * // 当挂载在按钮节点时：
     * // 点击按钮会自动记录触发时间，可用于防连点功能
     */
    onLoad() {
        this.lastTriggerTouchTime = 0;
        let btn = this.getComponent(Button);
        if (btn) {
            // 为按钮添加点击事件,用于记录触发时间
            no.addClickEventsToButton(btn, this.node, 'YJNodeTarget', 'setTriggerTouchTime', false);
        }
    }

    /** 
     * 组件启动时执行位置检查
     * @remarks 通过YJJobManager添加持续位置检测任务
     * @example
     * // 适用于需要持续追踪移动对象的场景：
     * // 如NPC移动时实时更新其交互区域位置
     */
    protected start(): void {
        YJJobManager.ins.addTask(this.check.bind(this));
    }

    /** 
     * 检查节点位置是否变化并更新注册
     * @returns {boolean} true表示位置未变化且完成注册，false/undefined表示位置已变化
     * @remarks
     * - 位置未变化时在nodeTargetManager注册当前实例
     * - 位置变化时更新缓存位置供下次比较
     * @example
     * // 当NPC停止移动时：
     * // 位置稳定后自动注册到管理器，可被其他系统定位
     */
    private check() {
        if (this.pos.equals(this.node.worldPosition)) {
            nodeTargetManager.register(this.type, this);
            return true;
        } else {
            this.pos = this.node.worldPosition;
        }
    }

    /** 
     * 组件启用时记录初始世界坐标
     * @remarks 用于后续位置变化检测的基准值
     * @example
     * // 当从对象池回收重用节点时：
     * // 会触发onEnable并记录新的初始位置
     */
    onEnable() {
        this.pos = this.node.worldPosition;
    }

    /** 
     * 组件销毁时从管理器中移除注册
     * @remarks 防止节点销毁后仍被错误引用
     * @example
     * // 当NPC被击败销毁时：
     * // 自动从目标管理器移除，其他系统无法再定位到该NPC
     */
    onDestroy() {
        nodeTargetManager.remove(this.type, this);
    }

    /**
     * 设置节点标识并重新注册
     * @param type 节点标识
     * @remarks
     * - 先移除旧类型注册
     * - 更新类型后重新注册到管理器
     * @example
     * // 切换敌人类型为精英怪：
     * nodeTarget.setType('EliteEnemy');
     * // 现在其他系统可以通过'EliteEnemy'类型查找该节点
     */
    public setType(type: string): void {
        if (this.type != '') nodeTargetManager.remove(this.type, this);
        this.type = type;
        nodeTargetManager.register(this.type, this);
    }

    /** 
     * 获取节点本地坐标
     * @returns 节点相对于父节点的坐标
     * @example
     * // 获取UI元素在画布中的相对位置：
     * const localPos = target.nodePosition;
     */
    public get nodePosition(): { x: number, y: number, z: number } {
        return no.position(this.node);
    }

    /** 
     * 获取节点世界坐标
     * @returns 节点在场景中的全局坐标
     * @example
     * // 计算两个物体间的实际距离：
     * const distance = Vec3.distance(obj1.nodeWorldPosition, obj2.nodeWorldPosition);
     */
    public get nodeWorldPosition(): Vec3 {
        let p = v3();
        this.node.parent?.getComponent(UITransform).convertToWorldSpaceAR(this.node.position, p);
        return p;
    }

    /**
     * 获取节点包围盒
     * @param inOtherNode 相对于其他节点的坐标系（可选）
     * @returns 包含位置和尺寸的矩形区域
     * @remarks
     * - 计算时会考虑节点的中心锚点
     * - 传入inOtherNode参数可转换为指定节点的局部坐标系
     * @example
     * // 检测与另一个节点的碰撞：
     * const box1 = target1.boundingBox();
     * const box2 = target2.boundingBox(target1.node); // 转换为target1的坐标系
     * if (box1.intersects(box2)) {
     *   // 处理碰撞逻辑
     * }
     */
    public boundingBox(inOtherNode?: Node): Rect {
        const size = no.size(this.node);
        let pos = this.nodeWorldPosition;
        if (inOtherNode) {
            no.worldPositionInNode(pos, inOtherNode, pos);
        }
        return rect(pos.x - size.width / 2, pos.y - size.height / 2, size.width, size.height);
    }

    /**
     * 触摸检测
     * @param e 触摸事件
     * @param trigger 是否触发关联事件，默认true
     * @returns 触摸点是否在节点范围内
     * @remarks
     * 处理逻辑：
     * 1. 检查节点有效性
     * 2. 转换触摸点到屏幕坐标
     * 3. 如果触发标志为true且触摸有效：
     *    - 自动触发Button组件点击事件
     *    - 处理Toggle状态切换
     *    - 执行YJTouchListener的结束回调
     * @example
     * // 简单点击检测：
     * if (target.checkTouch(event)) {
     *   console.log('点击成功');
     * }
     * 
     * // 仅检测不触发事件：
     * const isTouched = target.checkTouch(event, false);
     */
    public checkTouch(e: EventTouch, trigger = true): boolean {
        if (!no.checkValid(this.node)) return false;
        const rect = no.nodeBoundingBox(this.node);
        const a = rect.contains(e.touch.getUILocation());
        if (a && trigger) {
            const btn = this.getComponent(Button);
            if (btn) {
                if (btn.clickEvents.length > 0) {
                    no.executeHandlers(btn.clickEvents, e, btn);
                    if (btn instanceof Toggle)
                        btn.isChecked = true;
                } else {
                    const btn1 = this.getComponent(YJButton);
                    if (btn1?.clickEvents.length > 0) {
                        no.executeHandlers(btn1.clickEvents, e, btn1);
                    }
                }
            } else {
                const touchListener = this.getComponent(YJTouchListener);
                if (touchListener) {
                    no.EventHandlerInfo.execute(touchListener.endHandlers);
                }
            }
        }
        return a;
    }

    /**
     * 获取子节点中的目标节点组件
     * @param subType 子节点类型标识（需与目标节点组件中设置的subType匹配）
     * @returns 匹配的子节点YJNodeTarget组件，未找到返回undefined
     * @remarks
     * 实现原理：
     * 1. 遍历当前节点所有子节点
     * 2. 查找具有YJNodeTarget组件且subType匹配的节点
     * 
     * @example
     * // 获取角色血条子节点
     * const hpBar = this.getSubTarget('HP_BAR');
     * if(hpBar) hpBar.node.active = true;
     * 
     * // 获取技能按钮节点
     * const skillBtn = this.getSubTarget('SKILL_1');
     * skillBtn?.node.on(Node.EventType.TOUCH_END, this.useSkill);
     */
    public getSubTarget(subType: string): YJNodeTarget {
        let arr = this.getComponentsInChildren(YJNodeTarget);
        for (let i = 0, n = arr.length; i < n; i++) {
            if (arr[i].subType == subType) return arr[i];
        }
    }

    /**
     * 点击时间间隔校验（用于防止重复点击）
     * @param time 要比较的时间戳（毫秒），默认使用当前时间
     * @returns true：可以触发新点击（当前时间与最后触发时间间隔足够）
     *          false：距离上次触发时间过近
     * @remarks
     * 典型应用场景：
     * - 按钮防连点（例如技能冷却期间禁止重复点击）
     * - 界面跳转防误触
     * 
     * @example
     * // 在点击回调中控制触发频率
     * if(this.target.compareLastTriggerTouchTime()) {
     *   this.executeAction();
     *   this.target.setTriggerTouchTime();
     * }
     * 
     * // 自定义冷却时间（500ms）
     * const coolTime = 500;
     * if(this.target.compareLastTriggerTouchTime(sys.now() - coolTime)) {
     *   // 执行需要冷却时间的操作
     * }
     */
    public compareLastTriggerTouchTime(time?: number): boolean {
        time = time || sys.now();
        return time - this.lastTriggerTouchTime > 0;
    }

    /** 
     * 记录当前时间为最后触发时间 
     * @remarks
     * 应在成功触发业务逻辑后立即调用
     * 与compareLastTriggerTouchTime配合使用实现点击间隔控制
     * 
     * @example
     * // 在按钮点击处理中：
     * button.node.on(Node.EventType.TOUCH_END, () => {
     *   if(this.compareLastTriggerTouchTime()) {
     *     this.doButtonAction();
     *     this.setTriggerTouchTime();
     *   }
     * });
     */
    private setTriggerTouchTime() {
        this.lastTriggerTouchTime = sys.now();
    }
}
