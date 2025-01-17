
import { ccclass, property, Component, Node, EventTouch, math, UITransform, Rect, Vec3, Vec2, Vec4, v4 } from '../../yj';
import { SetNodeTweenAction } from '../../fuckui/SetNodeTweenAction';
import { no } from '../../no';
import { YJTouchListener } from '../touch/YJTouchListener';
import { YJNodeTarget } from './YJNodeTarget';
import { Range } from '../../types';

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
/**
 * 拖拽节点组件
 * 用于实现节点的拖拽功能,可以设置拖拽目标、返回原点、拖拽范围等功能
 */
export class YJDragDropNode extends YJTouchListener {
    /** 实际移动的节点,默认为当前节点 */
    @property({ type: Node, tooltip: '实际移动的节点，默认为当前节点' })
    moveTarget: Node = null;
    /** 拖拽放置的目标节点 */
    @property({ type: YJNodeTarget })
    dropTo: YJNodeTarget = null;
    /** 是否返回原点,选中后,当释放时,未到达拖放目标位置或未设置拖放目标时返回初始位置 */
    @property({ displayName: '是否返回原点', tooltip: '选中后，当释放时，未到达拖放目标位置或未设置拖放目标时返回初始位置' })
    canBack: boolean = false;
    /** 接近目标时触发的事件 */
    @property({ type: no.EventHandlerInfo, displayName: '接近目标时' })
    onApproachTarget: no.EventHandlerInfo[] = [];
    /** 离开目标时触发的事件,当已接近目标后又离开时触发 */
    @property({ type: no.EventHandlerInfo, displayName: '离开目标时', tooltip: '当已接近目标后又离开时触发' })
    onAwayFromTarget: no.EventHandlerInfo[] = [];
    /** 放入目标时触发的事件 */
    @property({ type: no.EventHandlerInfo, displayName: '放入目标时' })
    onAchieveTarget: no.EventHandlerInfo[] = [];
    /** 点击时触发的事件 */
    @property({ type: no.EventHandlerInfo, displayName: '点击时' })
    onClick: no.EventHandlerInfo[] = [];
    /** 是否开启左右拖动 */
    @property({ displayName: '开启左右拖动' })
    moveX: boolean = true;
    /** 是否开启上下拖动 */
    @property({ displayName: '开启上下拖动' })
    moveY: boolean = true;
    /** 是否开启拖动范围限制 */
    @property({ displayName: '开启拖动范围限制' })
    isRange: boolean = false;
    /** 拖动范围 */
    @property({ displayName: '拖动范围', visible() { return this.isRange; } })
    range: Vec4 = v4();
    /** 是否开启左右翻转,拖动到指定x坐标时进行左右翻转 */
    @property({ displayName: '开启左右翻转', tooltip: '拖动到指定x坐标时进行左右翻转' })
    isTurnX: boolean = false;
    /** 左右翻转点x,拖动时x小于该值scaleX为-1,否则为1 */
    @property({ type: Range, displayName: '左右翻转点x', tooltip: '拖动时x小于该值scaleX为-1，否则为1', visible() { return this.isTurnX; } })
    xTurnPos: Range = Range.new();
    /** 是否开启上下翻转,拖动到指定y坐标时进行上下翻转 */
    @property({ displayName: '开启上下翻转', tooltip: '拖动到指定y坐标时进行上下翻转' })
    isTurnY: boolean = false;
    /** 上下翻转点y,拖动时y小于该值scaleY为-1,否则为1 */
    @property({ type: Range, displayName: '上下翻转点y', tooltip: '拖动时x小于该值scaleY为-1，否则为1', visible() { return this.isTurnY; } })
    yTurnPos: Range = Range.new();

    /** 节点原始位置 */
    private _originalPos: Vec3;
    /** 目标节点的包围盒 */
    private _targetRect: Rect;
    /** 是否已接近目标 */
    private _isApproached: boolean = false;

    /** 组件启动时初始化 */
    start() {
        if (this.canBack) {
            this._originalPos = this.node.position.clone();
        }
    }

    /** 触摸开始回调 */
    public onStart(event: EventTouch): boolean {
        if (!this.canBack)
            this.rect = null;
        const a = super.onStart(event);
        return a;
    }

    /** 触摸移动回调 */
    public onMove(event: EventTouch): boolean {
        const a = super.onMove(event);
        if (a) {
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

    /** 触摸结束回调 */
    public onEnd(event: EventTouch): boolean {
        const a = super.onEnd(event);
        if (a) {
            if (this._isApproached) no.EventHandlerInfo.execute(this.onAchieveTarget);
            else this.moveBack();
            if (Vec2.distance(event.getStartLocation(), event.getLocation()) < 10) {
                no.EventHandlerInfo.execute(this.onClick);
            }
        }
        return a;
    }

    /** 触摸取消回调 */
    public onCancel(event: EventTouch) {
        if (!this.isTouchIn) return;
        if (this._isApproached) no.EventHandlerInfo.execute(this.onAchieveTarget);
        else this.moveBack();
        super.onCancel(event);
    }

    /** 检查是否接近目标 */
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

    /** 返回原点 */
    private moveBack() {
        if (!this.canBack) return;
        this.getComponent(SetNodeTweenAction).a_setData({
            duration: 0.2,
            to: 1,
            props: {
                pos: [this._originalPos.x, this._originalPos.y]
            },
            easing: ''
        });
    }

    /** 设置节点位置 */
    private setPosition(deltaPos: Vec2) {
        const node = this.moveTarget || this.node;
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
