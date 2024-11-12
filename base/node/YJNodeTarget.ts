
import { ccclass, property, menu, disallowMultiple, Component, Node, Button, Toggle, v3, Vec3, UITransform, EventTouch, EventHandler, sys, Rect, rect } from '../../yj';
import { no } from '../../no';
import { YJFitScreen } from '../YJFitScreen';
import { YJJobManager } from '../YJJobManager';
import { YJTouchListener } from '../touch/YJTouchListener';

/**
 * Predefined variables
 * Name = YJNodeTarget
 * DateTime = Fri Jan 14 2022 18:04:33 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJNodeTarget.ts
 * FileBasenameNoExtension = YJNodeTarget
 * URL = db://assets/Script/NoUi3/base/node/YJNodeTarget.ts
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
    /** 在no.nodeTargetManager中注册的标识 */
    @property({ tooltip: '在no.nodeTargetManager中注册的标识' })
    type: string = '';

    /** 用于区分在一个节点的子节点中不同的YJNodeTarget */
    @property({ tooltip: '用于区分在一个节点的子节点中不同的YJNodeTarget' })
    subType: string = '';

    /** 是否自动设置type,如果为true且type为空,则将父节点名称和当前节点名称拼接作为type */
    @property
    public get autoSet(): boolean {
        return false;
    }

    public set autoSet(v: boolean) {
        if (this.type != '') return;
        let name = [this.node.name];
        if (this.node.parent) name.unshift(this.node.parent.name);
        this.type = name.join('.');
    }

    /** 节点位置 */
    private pos: Vec3;
    /** 最后一次触发触摸的时间戳 */
    private lastTriggerTouchTime: number = 0;

    /** 组件加载时初始化 */
    onLoad() {
        this.lastTriggerTouchTime = 0;
        let btn = this.getComponent(Button);
        if (btn) {
            // 为按钮添加点击事件,用于记录触发时间
            no.addClickEventsToButton(btn, this.node, 'YJNodeTarget', 'setTriggerTouchTime', false);
        }
    }

    /** 组件启动时执行位置检查 */
    protected start(): void {
        YJJobManager.ins.execute(this.check, this);
    }

    /** 检查节点位置是否变化,变化时更新位置并在nodeTargetManager中注册 */
    private check() {
        if (this.pos.equals(this.node.worldPosition)) {
            no.nodeTargetManager.register(this.type, this);
            return false;
        } else {
            this.pos = this.node.worldPosition;
            return true;
        }
    }

    /** 组件启用时记录位置 */
    onEnable() {
        this.pos = this.node.worldPosition;
    }

    /** 组件销毁时从nodeTargetManager中移除 */
    onDestroy() {
        no.nodeTargetManager.remove(this.type, this);
    }

    /**
     * 设置节点标识并重新注册
     * @param type 节点标识
     */
    public setType(type: string): void {
        if (this.type != '') no.nodeTargetManager.remove(this.type, this);
        this.type = type;
        no.nodeTargetManager.register(this.type, this);
    }

    /** 获取节点本地坐标 */
    public get nodePosition(): Vec3 {
        return no.position(this.node);
    }

    /** 获取节点世界坐标 */
    public get nodeWorldPosition(): Vec3 {
        let p = v3();
        this.node.parent?.getComponent(UITransform).convertToWorldSpaceAR(this.node.position, p);
        return p;
    }

    /**
     * 获取节点包围盒
     * @param inOtherNode 相对于其他节点的坐标系
     * @returns 包围盒
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
     * @param trigger 是否触发touch事件，默认true
     * @returns 是否触摸到节点
     */
    public checkTouch(e: EventTouch, trigger = true): boolean {
        if (!no.checkValid(this.node)) return false;
        const rect = no.nodeBoundingBox(this.node);
        const a = rect.contains(YJFitScreen.fitTouchPoint(e.touch));
        if (a && trigger) {
            const btn = this.getComponent(Button);
            if (btn) {
                if (btn.clickEvents.length > 0) no.executeHandlers(btn.clickEvents, e, btn);
                if (btn instanceof Toggle)
                    btn.isChecked = true;
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
     * 获取子节点中的目标节点
     * @param subType 子节点标识
     * @returns 目标节点组件
     */
    public getSubTarget(subType: string): YJNodeTarget {
        let arr = this.getComponentsInChildren(YJNodeTarget);
        for (let i = 0, n = arr.length; i < n; i++) {
            if (arr[i].subType == subType) return arr[i];
        }
    }

    /**
     * 判断是否已经触发点击
     * @param time 比较时间戳(ms),默认为当前时间戳
     * @returns true：未触发，false：已触发
     */
    public compareLastTriggerTouchTime(time?: number): boolean {
        time = time || sys.now();
        return time - this.lastTriggerTouchTime > 0;
    }

    /** 设置最后触发时间为当前时间 */
    private setTriggerTouchTime() {
        this.lastTriggerTouchTime = sys.now();
    }
}
