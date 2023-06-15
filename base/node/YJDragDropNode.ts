
import { _decorator, Component, Node, EventTouch, math, UITransform } from './yj';
import { SetNodeTweenAction } from '../../fuckui/SetNodeTweenAction';
import { no } from '../../no';
import { YJTouchListener } from '../touch/YJTouchListener';
import { YJNodeTarget } from './YJNodeTarget';
const { ccclass, property } = _decorator;

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

    private _originalPos: math.Vec3;
    private _targetRect: math.Rect;
    private _isApproached: boolean = false;

    start() {
        if (this.canBack) {
            this._originalPos = this.node.position.clone();
            (this.getComponent(SetNodeTweenAction) || this.addComponent(SetNodeTweenAction)).saveIgnore = false;
        }
    }

    public onStart(event: EventTouch) {
        super.onStart(event);
        if (!this.isTouchIn) return;
    }

    public onMove(event: EventTouch) {
        if (!this.isTouchIn) return;
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
        super.onMove(event);
    }

    public onEnd(event: EventTouch) {
        if (!this.isTouchIn) return;
        if (this._isApproached) no.EventHandlerInfo.execute(this.onAchieveTarget);
        else this.moveBack();
        super.onEnd(event);
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

    private setPosition(deltaPos: math.Vec2) {
        let pos = this.node.position.clone();
        pos.add3f(deltaPos.x, deltaPos.y, 0);
        this.node.setPosition(pos);
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
