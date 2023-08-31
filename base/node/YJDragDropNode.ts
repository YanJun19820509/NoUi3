
import { ccclass, property, Component, Node, EventTouch, math, UITransform, Rect, Vec3, Vec2 } from '../../yj';
import { SetNodeTweenAction } from '../../fuckui/SetNodeTweenAction';
import { no } from '../../no';
import { YJTouchListener } from '../touch/YJTouchListener';
import { YJNodeTarget } from './YJNodeTarget';

/**
 * Predefined variables
 * Name = YJDragDropNode
 * DateTime = Thu Sep 29 2022 11:32:10 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJDragDropNode.ts
 * FileBasenameNoExtension = YJDragDropNode
 * URL = db://assets/NoUi3/base/node/YJDragDropNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJDragDropNode')
export class YJDragDropNode extends YJTouchListener {
    @property({ type: Node, tooltip: '实际移动的节点，默认为当前节点' })
    moveTarget: Node = null;
    @property({ type: YJNodeTarget })
    dropTo: YJNodeTarget = null;
    @property({ displayName: '是否返回原点', tooltip: '选中后，当释放时，未到达拖放目标位置或未设置拖放目标时返回初始位置' })
    canBack: boolean = false;
    @property({ type: no.EventHandlerInfo, displayName: '接近目标时' })
    onApproachTarget: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '离开目标时', tooltip: '当已接近目标后又离开时触发' })
    onAwayFromTarget: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '放入目标时' })
    onAchieveTarget: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '点击时' })
    onClick: no.EventHandlerInfo[] = [];

    private _originalPos: Vec3;
    private _targetRect: Rect;
    private _isApproached: boolean = false;

    start() {
        if (this.canBack) {
            this._originalPos = this.node.position.clone();
            (this.getComponent(SetNodeTweenAction) || this.addComponent(SetNodeTweenAction)).saveIgnore = false;
        }
    }

    public onStart(event: EventTouch): boolean {
        if (!this.canBack)
            this.rect = null;
        const a = super.onStart(event);
        if (a) {
            event.preventSwallow = false;
        }
        return a;
    }

    public onMove(event: EventTouch): boolean {
        const a = super.onMove(event);
        if (a) {
            event.preventSwallow = false;
            this.setPosition(event.getUIDelta());
            if (this.checkIsApproached()) {
                if (!this._isApproached) {
                    this._isApproached = true;
                    no.EventHandlerInfo.execute(this.onApproachTarget);
                }
            } else if (this._isApproached) {
                this._isApproached = false;
                no.EventHandlerInfo.execute(this.onAwayFromTarget);
            }
        }
        return a;
    }

    public onEnd(event: EventTouch): boolean {
        const a = super.onEnd(event);
        if (a) {
            event.preventSwallow = false;
            if (this._isApproached) no.EventHandlerInfo.execute(this.onAchieveTarget);
            else this.moveBack();
            if (Vec2.distance(event.getStartLocation(), event.getLocation()) < 10) {
                no.EventHandlerInfo.execute(this.onClick);
            }
        }
        return a;
    }

    public onCancel(event: EventTouch) {
        if (!this.isTouchIn) return;
        if (this._isApproached) no.EventHandlerInfo.execute(this.onAchieveTarget);
        else this.moveBack();
        super.onCancel(event);
    }

    private checkIsApproached(): boolean {
        if (!this.dropTo) return false;
        if (!this._targetRect) {
            let rect = no.nodeBoundingBox(this.dropTo.node);
            let p = no.vec2ToVec3(rect.center);
            this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(p, p);
            this._targetRect = math.rect(p.x - rect.width / 2, p.y - rect.height / 2, rect.width, rect.height);
        }
        return this._targetRect?.contains(no.vec3ToVec2(this.node.position));
    }

    private moveBack() {
        if (!this.canBack) return;
        this.getComponent(SetNodeTweenAction).setData(no.jsonStringify({
            duration: 0.2,
            to: 1,
            props: {
                pos: [this._originalPos.x, this._originalPos.y]
            },
            easing: ''
        }));
    }

    private setPosition(deltaPos: Vec2) {
        const node = this.moveTarget || this.node;
        let pos = no.position(node);
        pos.add3f(deltaPos.x, deltaPos.y, 0);
        no.position(node, pos);
    }

    // private getTouchLocation(event: EventTouch): math.Vec2 {
    //     let pos = math.v2();
    //     event.getUILocation(pos);
    //     let ut: UITransform = event.target.getComponent(UITransform);
    //     let size = ut.contentSize,
    //         ap = ut.anchorPoint;
    //     pos.x += (ap.x - 0.5) * size.width;
    //     pos.y += (ap.y - 0.5) * size.height;
    //     return pos;
    // }
}
