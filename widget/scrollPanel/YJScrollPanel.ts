
import { _decorator, Component, Node, UITransform, Widget, EventTouch, math, Touch, Layers, view } from 'cc';
import { EDITOR } from 'cc/env';
import { YJNodeTarget } from '../../base/node/YJNodeTarget';
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
    @property({ displayName: '双击检测时长(s)', min: .1, visible() { return this.doubleClick; } })
    doubleClickDuration: number = 1;
    @property({ displayName: '双击放大', min: .1, visible() { return this.doubleClick; } })
    doubleClickScaleMax: boolean = true;
    @property({ displayName: '双击缩小', min: .1, visible() { return this.doubleClick; } })
    doubleClickScaleMin: boolean = false;
    @property({ min: .1, visible() { return this.support2FingerScale; } })
    minScale: number = .5;
    @property({ min: .1, visible() { return this.support2FingerScale; } })
    maxScale: number = 1.5;
    @property({ type: math.Vec2, displayName: '滚动偏移', tooltip: '滚动到某点时需要的偏移' })
    offset: math.Vec2 = math.v2();
    @property({ displayName: '动画时长(s)', min: 0 })
    duration: number = .5;
    @property({ type: no.EventHandlerInfo })
    onMoveStart: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo })
    onMoveStop: no.EventHandlerInfo[] = [];

    private startTouchPos: math.Vec2;
    private startDis: number;
    private startScale: number;
    private doubleClickStartTime: number = 0;
    private doubleClickNum: number = 0;
    private doubleClicking: boolean = false;
    private doubleClickScaleToMax: boolean;
    private triedNum: number = 0;
    private needCheckCheckRange: boolean = true;
    private startMove: boolean = false;

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
                content.addComponent(SetNodeTweenAction).saveIgnore = false;
                content.parent = this.node;
                this.content = content;
            }
        }
        this.doubleClickScaleToMax = this.doubleClickScaleMax;
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

    /**
     * 
     * @param pos scrollPanel内的坐标系上的点
     */
    public scrollTo(pos: math.Vec3, duration?: number): void {
        if (duration == null) duration = this.duration;
        this.doubleClicking = false;
        pos.x += this.offset.x;
        pos.y += this.offset.y;
        this.fitPos(pos, this.content.scale.x);
        if (duration <= 0) {
            this.content.setPosition(pos);
        } else {
            this.setTween({
                pos: [pos.x, pos.y]
            }, duration);
        }
    }

    /**
     * 
     * @param pos scrollPanel内的坐标系上的点
     * @param scale 
     */
    public scrollToAndScale(pos: math.Vec3, scale: number, duration?: number): void {
        if (duration == null) duration = this.duration;
        this.doubleClicking = false;
        pos.x += this.offset.x;
        pos.y += this.offset.y;
        this.fitPos(pos, scale);
        if (duration <= 0) {
            this.content.setScale(scale, scale);
            this.content.setPosition(pos);
        } else {
            this.setTween({
                pos: [pos.x, pos.y],
                scale: [scale, scale]
            }, duration);
        }
    }

    public scrollToTarget(targetType: string, duration?: number): void {
        let target = no.nodeTargetManager.get<YJNodeTarget>(targetType);
        if (!target) {
            if (this.triedNum < 60) {
                this.triedNum++;
                this.scheduleOnce(() => {
                    this.scrollToTarget(targetType, duration);
                });
                return;
            }
            console.error('scrollToTargetAndScale找不到target：', targetType);
            return;
        }
        this.triedNum = 0;
        this.scrollTo(this.fitTargetToCenter(target), duration);
    }

    public scrollToTargetAndScale(targetType: string, scale: number, duration?: number): void {
        let target = no.nodeTargetManager.get<YJNodeTarget>(targetType);
        if (!target) {
            if (this.triedNum < 60) {
                this.triedNum++;
                this.scheduleOnce(() => {
                    this.scrollToTargetAndScale(targetType, scale, duration);
                });
                return;
            }
            console.error('scrollToTargetAndScale找不到target：', targetType);
            return;
        }
        this.triedNum = 0;
        this.scrollToAndScale(this.fitTargetToCenter(target, scale), scale, duration);
    }

    public scaleTo(scale: number, duration?: number): void {
        if (duration == null) duration = this.duration;
        this.doubleClicking = false;
        let pos = this.content.getPosition();
        this.fitPos(pos, scale);
        if (duration <= 0) {
            this.content.setScale(scale, scale);
            this.content.setPosition(pos);
        } else {
            this.setTween({
                pos: [pos.x, pos.y],
                scale: [scale, scale]
            }, duration);
        }
    }

    private checkScaleRange(): void {
        let nsize = this.node.getComponent(UITransform).contentSize;
        let csize = this.content.getComponent(UITransform).contentSize;
        let minScale = Math.min(Math.max(nsize.width / csize.width, nsize.height / csize.height), 1);
        if (this.minScale < minScale) this.minScale = minScale;
        no.log('checkScaleRange', nsize, csize, this.minScale);
    }

    private onTouchStart(e: EventTouch) {
        if (!this.content) {
            e.preventSwallow = true;
            return;
        }
        this.startTouchPos = this.touchUILocationAR(e);
        let touches = e.getAllTouches();
        this.startDis = null;
        this.startScale = null;
        if (touches.length < 2) {
            e.preventSwallow = true;
            if (this.doubleClick) {
                if (!this.doubleClicking) {
                    this.doubleClicking = true;
                    this.doubleClickStartTime = 0;
                    this.doubleClickNum = 0;
                }
            }
            return;
        }
        this.doubleClicking = false;
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
        if (e.getAllTouches().length == 1) {
            if (e.getDeltaX() > 10 || e.getDeltaY() > 10) {
                this.doubleClicking = false;
            }
            this.move(e);
        } else {
            this.doubleClicking = false;
            if (this.needCheckCheckRange) {
                this.needCheckCheckRange = false;
                this.checkScaleRange();
            }
            this.scale(e);
        }
        e.propagationStopped = true;
    }

    private onTouchEnd(e: EventTouch) {
        if (!this.content) {
            e.preventSwallow = true;
            return;
        }
        if (math.Vec2.distance(e.getStartLocation(), e.getLocation()) > 10)
            e.propagationStopped = true;
        else
            e.preventSwallow = true;
        if (this.startMove) {
            this.startMove = false;
            no.EventHandlerInfo.execute(this.onMoveStop);
        }
        if (this.doubleClick) {
            if (this.doubleClicking) {
                this.doubleClickNum++;
                if (this.doubleClickNum == 2) {

                    if (this.needCheckCheckRange) {
                        this.needCheckCheckRange = false;
                        this.checkScaleRange();
                    }

                    let scale = this.content.scale.x;
                    if (scale < 1 || scale > 1) scale = 1;
                    else {
                        if (this.doubleClickScaleToMax) {
                            scale = this.maxScale;
                            if (this.doubleClickScaleMin)
                                this.doubleClickScaleToMax = false;
                        } else {
                            scale = this.minScale;
                            if (this.doubleClickScaleMax)
                                this.doubleClickScaleToMax = true;
                        }
                    }
                    this.scaleContent(scale, true);
                }
            }
        }
    }

    private move(e: EventTouch) {
        if (!this.startMove) {
            this.startMove = true;
            no.EventHandlerInfo.execute(this.onMoveStart);
        }
        let delta = math.v2();
        e.touch.getDelta(delta);
        let pos = this.content.getPosition();
        let scale = this.content.scale.x;
        this.fitPos(pos.add3f(delta.x * scale, delta.y * scale, 0), scale);
        this.content.setPosition(pos);
    }

    private scale(e: EventTouch) {
        let dis = this.touchesDistance(e.getAllTouches());
        let scale = math.clamp(this.startScale + (dis - this.startDis) / this.startDis, this.minScale, this.maxScale);
        if (isNaN(scale)) return;
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
            this.setTween({
                pos: [pos.x, pos.y],
                scale: [scale, scale]
            });
        }
    }

    private setTween(props: any, duration?: number) {
        if (duration == null) duration = this.duration;
        (this.content.getComponent(SetNodeTweenAction) || this.content.addComponent(SetNodeTweenAction)).setData(JSON.stringify({
            duration: duration,
            to: 1,
            props: props
        }));
    }

    private touchesDistance(touches: Touch[]): number {
        return math.Vec2.distance(touches[0].getLocation(), touches[1].getLocation());
    }

    private touchUILocationAR(e: EventTouch): math.Vec2 {
        let p = e.getUILocation();
        let pos = math.v3(p.x, p.y);
        let ut = this.node.getComponent(UITransform);
        let size = ut.contentSize.clone();
        let ar = ut.anchorPoint;
        pos.subtract3f(size.width * ar.x, size.height * ar.y, 0);
        ut.convertToWorldSpaceAR(pos, pos);
        let vsize = view.getVisibleSize();
        pos.subtract3f((vsize.width - size.width), (vsize.height - size.height), 0);
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

    private fitTargetToCenter(target: YJNodeTarget, scale = 1): math.Vec3 {
        let pos = math.v3();
        this.node.getComponent(UITransform).convertToNodeSpaceAR(target.nodeWorldPosition, pos);
        let p = this.content.getPosition();
        p.subtract(pos).multiplyScalar(scale / this.content.scale.x);
        return p;
    }

    update(dt: number) {
        if (!this.doubleClicking) return;
        this.doubleClickStartTime += dt;
        if (this.doubleClickStartTime >= this.doubleClickDuration) this.doubleClicking = false;
    }
}
