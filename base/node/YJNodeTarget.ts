
import { EDITOR, ccclass, property, menu, executeInEditMode, disallowMultiple, Component, Node, Button, Toggle, v3, Vec3, UITransform, EventTouch, EventHandler, sys, Rect, rect, v2 } from '../../yj';
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
@executeInEditMode()
@disallowMultiple()
export class YJNodeTarget extends Component {
    @property({ tooltip: '在no.nodeTargetManager中注册的标识' })
    type: string = '';
    @property({ tooltip: '用于区分在一个节点的子节点中不同的YJNodeTarget' })
    subType: string = '';
    @property
    autoSet: boolean = false;

    private pos: Vec3;
    private lastTriggerTouchTime: number = 0;

    onLoad() {
        if (EDITOR) return;
        this.lastTriggerTouchTime = 0;
        let btn = this.getComponent(Button);
        if (btn) {
            let a = new EventHandler();
            a.target = this.node;
            a.component = 'YJNodeTarget';
            a.handler = 'setTriggerTouchTime';
            btn.clickEvents.push(a);
        }
    }

    protected start(): void {
        if (EDITOR) return;
        YJJobManager.ins.execute(this.check, this);
    }

    private check() {
        if (this.pos.equals(this.node.worldPosition)) {
            no.nodeTargetManager.register(this.type, this);
            return false;
        } else {
            this.pos = this.node.worldPosition;
            return true;
        }
    }

    onEnable() {
        this.pos = this.node.worldPosition;
    }

    onDestroy() {
        no.nodeTargetManager.remove(this.type, this);
    }

    update() {
        if (EDITOR) {
            if (!this.autoSet) return;
            this.autoSet = false;
            if (this.type != '') return;
            let name = [this.node.name];
            if (this.node.parent) name.unshift(this.node.parent.name);
            this.type = name.join('.');
        }
    }

    public setType(type: string): void {
        if (this.type != '') no.nodeTargetManager.remove(this.type, this);
        this.type = type;
        no.nodeTargetManager.register(this.type, this);
    }

    public get nodePosition(): Vec3 {
        return no.position(this.node);
    }


    /**
     * 目标节点的世界坐标
     */
    public get nodeWorldPosition(): Vec3 {
        let p = v3();
        this.node.parent?.getComponent(UITransform).convertToWorldSpaceAR(this.node.position, p);
        return p;
    }

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
     * @returns boolean
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
     * @param subType 
     * @returns 
     */
    public getSubTarget(subType: string): YJNodeTarget {
        let arr = this.getComponentsInChildren(YJNodeTarget);
        for (let i = 0, n = arr.length; i < n; i++) {
            if (arr[i].subType == subType) return arr[i];
        }
    }

    /**
     * 判断是否已经触发点击，将最近一次点击的时间戳a与输入时间戳time进行比较，如果time>a，那么可以认为在比较之前没有触发点击，否则为已触发
     * @param time (ms)默认为当前时间戳
     * @returns true：未触发，false：已触发
     */
    public compareLastTriggerTouchTime(time?: number): boolean {
        time = time || sys.now();
        return time - this.lastTriggerTouchTime > 0;
    }


    private setTriggerTouchTime() {
        this.lastTriggerTouchTime = sys.now();
    }
}
