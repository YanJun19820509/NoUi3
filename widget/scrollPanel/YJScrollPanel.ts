
import { _decorator, Component, Node, UITransform, Widget, EventTouch, math, Touch, Layers } from 'cc';
import { EDITOR } from 'cc/env';
import { posix } from 'path';
import { SetNodeTweenAction } from '../../fuckui/SetNodeTweenAction';
import { no } from '../../no';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJScrollPanel
 * DateTime = Fri Aug 12 2022 14:37:21 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJScrollPanel.ts
 * FileBasenameNoExtension = YJScrollPanel
 * URL = db://assets/NoUi3/widget/scrollPanel/YJScrollPanel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 滚动面板，适用于全屏地图功能，没有mask，支持拖动和缩放
 * 使用时直接将脚本文件拖到层级管理器中即可
 */
@ccclass('YJScrollPanel')
@executeInEditMode()
export class YJScrollPanel extends Component {
    @property({ type: Node, tooltip: '包含可滚动内容的节点' })
    content: Node = null;
    @property({ displayName: '支持两指缩放' })
    support2FingerScale: boolean = false;
    @property({ displayName: '支持双击缩放' })
    doubleClick: boolean = false;
    @property({ min: .1, visible() { return this.support2FingerScale; } })
    minScale: number = .5;
    @property({ min: .1, visible() { return this.support2FingerScale; } })
    maxScale: number = 1.5;

    private startTouchPos: math.Vec2;
    private startDis: number;
    private startScale: number;
    private doubleClickStartTime: number = 0;
    private doubleClickNum: number = 0;

    onLoad() {
        if (EDITOR) {
            if (!this.getComponent(UITransform)) {
                this.addComponent(UITransform);
                let widget = this.addComponent(Widget);
                widget.isAlignLeft = true;
                widget.left = 0;
                widget.isAlignRight = true;
                widget.right = 0;
                widget.isAlignTop = true;
                widget.top = 0;
                widget.isAlignBottom = true;
                widget.bottom = 0;
            }
            if (!this.content && this.node.children.length == 0) {
                let content = new Node('content');
                content.layer = Layers.Enum.UI_2D;
                content.addComponent(UITransform);
                content.parent = this.node;
                this.content = content;
            }
        }
    }

    update() {
        if (EDITOR) {
            if (!this.content) return;
            let a = this.content.getComponent(SetNodeTweenAction);
            if (this.doubleClick) {
                if (!a) this.content.addComponent(SetNodeTweenAction);
                if (a.enabled) a.enabled = true;
            } else {
                if (a) a.destroy();
            }
        }
    }

    onEnable() {
        this.content = this.content || this.node;
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this, true);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
        // this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this, true);
    }

    onDisable() {
        this.node.targetOff(this);
    }

    private onTouchStart(e: EventTouch) {
        if (!this.content) {
            e.preventSwallow = true;
            return;
        }
        this.startTouchPos = this.touchUILocationAR(e.touch.getUILocation());
        let touches = e.getAllTouches();
        if (touches.length < 2) {
            e.preventSwallow = true;
            if (this.doubleClick) {
                let a = no.timestampMs();
                if (this.doubleClickNum == 0)
                    this.doubleClickStartTime = a;
                else if (a - this.doubleClickStartTime > 1000) {
                    this.doubleClickStartTime = a;
                    this.doubleClickNum = 0;
                }
            }
            return;
        }
        e.propagationStopped = true;
        this.startDis = this.touchesDistance(touches);
        this.startScale = this.content.scale.x;
        this.doubleClickStartTime = 0;
    }

    private onTouchMove(e: EventTouch) {
        if (!this.content) {
            e.preventSwallow = true;
            return;
        }
        this.doubleClickNum = 0;
        if (e.getAllTouches().length == 1) this.move(e);
        else this.scale(e);
        e.propagationStopped = true;
    }

    private onTouchEnd(e: EventTouch) {
        e.preventSwallow = true;
        if (this.doubleClick) {
            let a = no.timestampMs() - this.doubleClickStartTime;
            if (a <= 1000) this.doubleClickNum++;
            else this.doubleClickNum = 0;
            if (this.doubleClickNum == 2) {
                this.doubleClickNum = 0;
                let scale = this.content.scale.x;
                if (scale < 1 || scale > 1) scale = 1;
                else scale = this.maxScale;
                this.scaleContent(scale, true);
            }
        }
    }

    private move(e: EventTouch) {
        let delta = math.v2();
        e.touch.getDelta(delta);
        let pos = this.content.getPosition();
        this.fitPos(pos.add3f(delta.x, delta.y, 0), this.content.scale.x);
        this.content.setPosition(pos);
    }

    private scale(e: EventTouch) {
        let dis = this.touchesDistance(e.getAllTouches());
        let scale = math.clamp(this.startScale + (dis - this.startDis) / this.startDis, this.minScale, this.maxScale);
        if (scale == this.minScale || scale == this.maxScale) {
            this.startScale = scale;
            this.startDis = dis;
        }
        this.scaleContent(scale);
    }

    private scaleContent(scale: number, tween = false) {
        let s = scale - this.content.scale.x;
        let pos = this.content.getPosition();
        pos.x -= this.startTouchPos.x * s;
        pos.y -= this.startTouchPos.y * s;
        this.fitPos(pos, scale);
        if (!tween) {
            this.content.setScale(scale, scale);
            this.content.setPosition(pos);
        } else {
            this.content.getComponent(SetNodeTweenAction).setData(JSON.stringify({
                duration: 0.2,
                to: 1,
                props: {
                    pos: [pos.x, pos.y],
                    scale: [scale, scale]
                }
            }));
        }
    }

    private touchesDistance(touches: Touch[]): number {
        return math.Vec2.distance(touches[0].getLocation(), touches[1].getLocation());
    }

    private touchUILocationAR(uiLocation: math.Vec2): math.Vec2 {
        let pos = math.v3(uiLocation.x, uiLocation.y);
        let ut = this.node.getComponent(UITransform);
        let size = ut.contentSize;
        let ar = ut.anchorPoint;
        pos.subtract3f(size.width * ar.x, size.height * ar.y, 0);
        ut.convertToWorldSpaceAR(pos, pos);
        this.content.getComponent(UITransform).convertToNodeSpaceAR(pos, pos);
        return math.v2(pos.x, pos.y);
    }

    private xyXY(scale: number): { minX: number, minY: number, maxX: number, maxY: number } {
        let nsize = this.node.getComponent(UITransform).contentSize;
        let csize = this.content.getComponent(UITransform).contentSize;
        let nar = this.node.getComponent(UITransform).anchorPoint;
        let car = this.content.getComponent(UITransform).anchorPoint;
        return {
            minX: (car.x - 1) * csize.width * scale + (1 - nar.x) * nsize.width,
            minY: (car.y - 1) * csize.height * scale + (1 - nar.y) * nsize.height,
            maxX: car.x * csize.width * scale - nar.x * nsize.width,
            maxY: car.y * csize.height * scale - nar.y * nsize.height
        };
    }

    private fitPos(pos: math.Vec3 | math.Vec2, scale: number) {
        let { minX, minY, maxX, maxY } = this.xyXY(scale);

        if (pos.x < minX) pos.x = minX;
        else if (pos.x > maxX) pos.x = maxX;
        if (pos.y < minY) pos.y = minY;
        else if (pos.y > maxY) pos.y = maxY;
    }
}
