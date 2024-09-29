import { no } from "NoUi3/no";
import { ccclass, Node, EventTouch, property, v4, Vec3, Vec4, v3, Vec2, v2 } from "NoUi3/yj";
import { Range } from "NoUi3/types";
import { YJTouchListener } from "../touch/YJTouchListener";
import { YJDragDropItemNode } from "./YJDragDropItemNode";
import { YJDragDropTargetNode } from "./YJDragDropTargetNode";
/**
 * 拖拽管理器，需要将可拖拽的节点和拖拽放入的目标节点都作为该节点的子节点
 * Author mqsy_yj
 * DateTime Sun Sep 29 2024 10:45:52 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJDragDropManager')
export class YJDragDropManager extends YJTouchListener {
    @property({ displayName: '是否开启拖拽' })
    dragDrop: boolean = true;
    @property({ displayName: '是否返回原点', tooltip: '选中后，当释放时，未到达拖放目标位置或未设置拖放目标时返回初始位置', visible() { return this.dragDrop; } })
    canBack: boolean = false;
    @property({ type: no.EventHandlerInfo, displayName: '接近目标时', visible() { return this.dragDrop; } })
    onApproachTarget: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '离开目标时', tooltip: '当已接近目标后又离开时触发', visible() { return this.dragDrop; } })
    onAwayFromTarget: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '放入目标时', visible() { return this.dragDrop; } })
    onAchieveTarget: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '点击时', visible() { return !this.dragDrop; } })
    onClick: no.EventHandlerInfo[] = [];
    @property({ displayName: '设置拖动节点的父节点为本节点', tooltip: '开启后，拖动时，拖动节点将作为本节点的子节点', visible() { return this.dragDrop; } })
    changeParent: boolean = false;
    @property({ displayName: '开启左右拖动', visible() { return this.dragDrop; } })
    moveX: boolean = true;
    @property({ displayName: '开启上下拖动', visible() { return this.dragDrop; } })
    moveY: boolean = true;
    @property({ displayName: '开启拖动范围限制', visible() { return this.dragDrop; } })
    isRange: boolean = false;
    @property({ displayName: '拖动范围', visible() { return this.dragDrop && this.isRange; } })
    range: Vec4 = v4();
    @property({ displayName: '开启左右翻转', tooltip: '拖动到指定x坐标时进行左右翻转', visible() { return this.dragDrop; } })
    isTurnX: boolean = false;
    @property({ type: Range, displayName: '左右翻转点x', tooltip: '拖动时x小于该值scaleX为-1，否则为1', visible() { return this.isTurnX; } })
    xTurnPos: Range = Range.new();
    @property({ displayName: '开启上下翻转', tooltip: '拖动到指定y坐标时进行上下翻转', visible() { return this.dragDrop; } })
    isTurnY: boolean = false;
    @property({ type: Range, displayName: '上下翻转点y', tooltip: '拖动时x小于该值scaleY为-1，否则为1', visible() { return this.isTurnY; } })
    yTurnPos: Range = Range.new();


    //拖拽节点
    protected dragNode: Node = null;
    //放置目标
    protected dropTarget: Node = null;

    private _isApproached: boolean = false;

    public onStart(event: EventTouch) {
        super.onStart(event);
        this.dragNode = null;
        this.dropTarget = null;
        if (!this.dragDrop) return false;
        this.setDragNode(event);

        if (this.dragNode) {
            const ddn = this.dragNode.getComponent(YJDragDropItemNode);
            if (this.changeParent && ddn.canDrag())
                this.dragNode.parent = this.node;
            ddn.onStart(event)
        }
        return true;
    }

    public onMove(event: EventTouch) {
        super.onMove(event);
        if (!this.dragDrop) return false;

        if (this.dragNode) {
            const ddn = this.dragNode.getComponent(YJDragDropItemNode);
            if (ddn.canDrag())
                this.setPosition(this.dragNode, event.getUIDelta());
            this.dragNode.getComponent(YJDragDropItemNode).onMove(event);
        }

        //当需要处理接近或离开目标事件时
        if (this.onApproachTarget.length > 0 || this.onAwayFromTarget.length > 0) {
            this.dropTarget = null;
            this.setDropTarget(event);

            if (this.dropTarget) {
                if (!this._isApproached) {
                    this._isApproached = true;
                    no.EventHandlerInfo.execute(this.onApproachTarget, this.dragNode, this.dropTarget);
                }
            } else if (this._isApproached) {
                this._isApproached = false;
                no.EventHandlerInfo.execute(this.onAwayFromTarget, this.dragNode, this.dropTarget);
            }
        }
        return true;
    }

    public onEnd(event: EventTouch) {
        super.onEnd(event);
        //点击效果
        if (!this.dragDrop) {
            no.EventHandlerInfo.execute(this.onClick, this.dragNode);
            return true;
        }

        if (!this.dropTarget) {
            this.setDropTarget(event);
        }
        if (this.dropTarget) {
            if (this.dragNode) {
                this.dragNode.getComponent(YJDragDropItemNode).onEnd(event);
                no.EventHandlerInfo.execute(this.onAchieveTarget, this.dragNode, this.dropTarget);
            }
        } else this.moveBack(event);
        return true;
    }

    public onCancel(event: EventTouch) {
        super.onCancel(event);
        if (!this.dragDrop) return false;

        if (!this.dropTarget) {
            this.setDropTarget(event);
        }
        if (this.dropTarget) {
            if (this.dragNode) {
                this.dragNode.getComponent(YJDragDropItemNode).onEnd(event);
                no.EventHandlerInfo.execute(this.onAchieveTarget, this.dragNode, this.dropTarget);
            }
        } else this.moveBack(event);
        return true;
    }

    protected moveBack(event: EventTouch) {
        if (!this.canBack || !this.dragNode) return;
        this.dragNode.getComponent(YJDragDropItemNode).onMoveBack(event);
    }

    protected setPosition(node: Node, deltaPos: Vec2) {
        if (!node) return;
        let pos = no.position(node);
        pos.add3f(this.moveX ? deltaPos.x : 0, this.moveY ? deltaPos.y : 0, 0);
        if (this.isRange) {
            if (pos.x < this.range.x) pos.x = this.range.x;
            if (pos.x > this.range.z) pos.x = this.range.z;
            if (pos.y < this.range.y) pos.y = this.range.y;
            if (pos.y > this.range.w) pos.y = this.range.w;
        }
        no.position(node, pos);
        let scale = no.scale(node);
        if (this.isTurnX) {
            if (pos.x < this.xTurnPos.min && scale.x != -1)
                scale.x = -1;
            else if (pos.x >= this.xTurnPos.max && scale.x != 1)
                scale.x = 1;
        }
        if (this.isTurnY) {
            if (pos.y < this.yTurnPos.min && scale.y != -1)
                scale.y = -1;
            else if (pos.y >= this.yTurnPos.max && scale.y != 1)
                scale.y = 1;
        }
        no.scale(node, scale);
    }

    //设置拖拽节点
    protected setDragNode(event: EventTouch) {
        if (!this.dragNode) {
            const p = event.getUILocation();
            const pos = no.worldPositionInNode(v3(p.x, p.y), this.node),
                arr = this.getComponentsInChildren(YJDragDropItemNode);
            for (let i = 0, n = arr.length; i < n; i++) {
                const rect = arr[i].nodeRect();
                if (rect.contains(v2(pos.x, pos.y))) {
                    this.dragNode = arr[i].node;
                    break;
                }
            }
        }
    }
    //设置放置节点
    protected setDropTarget(event: EventTouch) {
        if (!this.dropTarget) {
            const pos = event.getUILocation(),
                arr = this.getComponentsInChildren(YJDragDropTargetNode);
            for (let i = 0, n = arr.length; i < n; i++) {
                const rect = arr[i].nodeRect();
                if (rect.contains(pos)) {
                    this.dragNode = arr[i].node;
                    break;
                }
            }
        }
    }
}