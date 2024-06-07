import { no } from "../../no";
import { Range } from "../../types";
import { Component, DEBUG, EDITOR, Enum, Node, UIOpacity, Vec2, ccclass, director, executeInEditMode, isValid, property, v2 } from "../../yj";
import { EasingMethod, YJTweenTest, getEasingFn } from "./YJTween";


enum AnimType {
    None = 0,
    Delay = 1,//延迟执行
    ExpandWidth = 2,//扩宽
    ExpandHeight = 3,//扩高
    FadeOut = 4,//淡出
    FadeIn = 5,//淡入
    MoveBy = 15,//在当前位置的基础上移动指定距离，比如当前位置为(100, 50)，MoveByArgs为(10, 10)，则最终位置为(110, 60)
    MoveTo = 18,//移动到指定位置，比如当前位置为(100, 50)，MoveToArgs为(110, 60)，则最终位置为(110, 60)
    LeftSlideIn = 6,//从左滑入
    RightSlideIn = 7,//从右滑入
    Opacity = 16,//透明度变化
    Rotation = 17,//旋转变化
    ScaleOut = 8,//缩小
    ScaleIn = 9,//放大
    ScaleTo = 10,//在当前缩放的基础上缩放至指定大小，比如当前缩放为1.2，ScaleToArgs为0.5，则最终缩放为0.6
    ScaleXOut = 11,//x轴缩小
    ScaleXIn = 12,//x轴放大
    ScaleYOut = 13,//y轴缩小
    ScaleYIn = 14,//y轴放大
}

@ccclass('AnimationEffect')
class AnimationEffect {
    @property({ type: Enum(AnimType), displayName: "动画类型" })
    type: AnimType = AnimType.None; // 默认动画类型为SlideIn
    @property({ displayName: "动画持续时长(秒)", min: 0, tooltip: '为0时做为set处理，仅对带参类型有效' })
    duration: number = 0.1; // 默认动画持续时间为0.1秒
    @property({ displayName: "动画缓动函数", type: Enum(EasingMethod) })
    easing: EasingMethod = EasingMethod.LINEAR;
    @property({ displayName: "ExpandWidth参数", type: Range, visible() { return this.type === AnimType.ExpandWidth; } })
    expandWidthArgs: Range = new Range(0, 50); // 默认扩宽参数为0.5，即宽度扩大50%
    @property({ displayName: "ExpandHeight参数", type: Range, visible() { return this.type === AnimType.ExpandHeight; } })
    expandHeightArgs: Range = new Range(0, 50); // 默认扩宽参数为0.5，即宽度扩大50%
    @property({ type: Vec2, displayName: "MoveBy参数", visible() { return this.type === AnimType.MoveBy; } })
    moveByArgs: Vec2 = v2(0, 0); // 默认移动参数为(0, 0)，即不移动
    @property({ type: Vec2, displayName: "MoveTo参数", visible() { return this.type === AnimType.MoveTo; } })
    moveToArgs: Vec2 = v2(0, 0);
    @property({ displayName: "ScaleTo参数", visible() { return this.type === AnimType.ScaleTo; } })
    scaleToArgs: number = .5;
    @property({ displayName: "Opacity参数", visible() { return this.type === AnimType.Opacity; }, min: 2, max: 255 })
    opacityArgs: number = 255;
    @property({ displayName: "Rotaion参数", visible() { return this.type === AnimType.Rotation; } })
    rotationArgs: number = 360;
    @property({ type: no.EventHandlerInfo, displayName: '回调' })
    callbacks: no.EventHandlerInfo[] = []; // 默认回调函数为空函数，即不执行任何操作

    public getTweenSet(node: Node) {
        let a: any;
        switch (this.type) {
            case AnimType.Delay: a = this.delay(); break;
            case AnimType.ExpandWidth: a = this.expandWidth(node); break;
            case AnimType.ExpandHeight: a = this.expandHeight(node); break;
            case AnimType.FadeOut: a = this.fadeOut(node); break;
            case AnimType.FadeIn: a = this.fadeIn(node); break;
            case AnimType.MoveBy: a = this.moveBy(node); break;
            case AnimType.MoveTo: a = this.moveTo(node); break;
            case AnimType.LeftSlideIn: a = this.leftSlideIn(node); break;
            case AnimType.RightSlideIn: a = this.rightSlideIn(node); break;
            case AnimType.ScaleOut: a = this.scaleOut(node); break;
            case AnimType.ScaleIn: a = this.scaleIn(node); break;
            case AnimType.ScaleTo: a = this.scaleTo(node); break;
            case AnimType.ScaleXOut: a = this.scaleXOut(node); break;
            case AnimType.ScaleXIn: a = this.scaleXIn(node); break;
            case AnimType.ScaleYOut: a = this.scaleYOut(node); break;
            case AnimType.ScaleYIn: a = this.scaleYIn(node); break;
            case AnimType.Opacity: a = this.opacity(node); break;
            case AnimType.Rotation: a = this.rotation(node); break;
        }

        const easingFn = YJTweenTest ? this.easing : getEasingFn(this.easing);
        if (a instanceof Array) a[a.length - 1].easing = easingFn;
        else a.easing = easingFn;
        if (this.callbacks.length > 0) {
            if (a instanceof Array) a[a.length - 1].callback = () => { no.EventHandlerInfo.execute(this.callbacks); };
            else a.callback = () => { no.EventHandlerInfo.execute(this.callbacks); };
        }
        return a;
    }

    private delay() {
        return [{ delay: this.duration }];
    }

    private leftSlideIn(node: Node) {
        return [{
            set: 1,
            props: {
                pos: [-no.width(node) - 50, 0]
            }
        }, {
            duration: this.duration,
            to: 1,
            props: {
                pos: [0, 0]
            }
        }];
    }

    private rightSlideIn(node: Node) {
        return [{
            set: 1,
            props: {
                pos: [no.width(node) + 50, 0]
            }
        }, {
            duration: this.duration,
            to: 1,
            props: {
                pos: [0, 0]
            }
        }];
    }

    private scaleIn(node: Node) {
        if (!node["__yj_ui_scale"])
            node["__yj_ui_scale"] = no.scale(node);
        const s = node["__yj_ui_scale"];
        return [{
            set: 1,
            props: {
                scale: [0, 0]
            }
        }, {
            duration: this.duration,
            to: 1,
            props: {
                scale: [s.x, s.y]
            }
        }];
    }

    private scaleTo(node: Node) {
        return [{
            duration: this.duration,
            [this.duration == 0 ? 'set' : 'to']: 1,
            props: {
                scale: [this.scaleToArgs, this.scaleToArgs]
            }
        }];
    }

    private scaleOut(node: Node) {
        if (!node["__yj_ui_scale"])
            node["__yj_ui_scale"] = no.scale(node);
        return [{
            duration: this.duration,
            to: 1,
            props: {
                scale: [0, 0]
            }
        }];
    }

    private scaleXIn(node: Node) {
        if (!node["__yj_ui_scale"])
            node["__yj_ui_scale"] = no.scale(node);
        const s = node["__yj_ui_scale"];
        return [{
            set: 1,
            props: {
                scale: [0, s.y]
            }
        }, {
            duration: this.duration,
            to: 1,
            props: {
                scale: [s.x, s.y]
            }
        }];
    }

    private scaleXOut(node: Node) {
        const s = no.scale(node);
        if (!node["__yj_ui_scale"])
            node["__yj_ui_scale"] = s;
        return [{
            duration: this.duration,
            to: 1,
            props: {
                scale: [0, s.y]
            }
        }];
    }

    private scaleYIn(node: Node) {
        if (!node["__yj_ui_scale"])
            node["__yj_ui_scale"] = no.scale(node);
        const s = node["__yj_ui_scale"];
        return [{
            set: 1,
            props: {
                scale: [s.x, 0]
            }
        }, {
            duration: this.duration,
            to: 1,
            props: {
                scale: [s.x, s.y]
            }
        }];
    }

    private scaleYOut(node: Node) {
        const s = no.scale(node);
        if (!node["__yj_ui_scale"])
            node["__yj_ui_scale"] = s;
        return [{
            duration: this.duration,
            to: 1,
            props: {
                scale: [s.x, 0]
            }
        }];
    }

    private fadeOut(node: Node) {
        if (node["__yj_ui_opacity"] === undefined)
            node["__yj_ui_opacity"] = no.opacity(node);
        return [{
            duration: this.duration,
            to: 1,
            props: {
                opacity: 2
            }
        }];
    }

    private fadeIn(node: Node) {
        return [{
            duration: this.duration,
            to: 1,
            props: {
                opacity: node["__yj_ui_opacity"] || 255
            }
        }];
    }

    private moveBy(node: Node) {
        const pos = no.position(node);
        return [{
            duration: this.duration,
            [this.duration == 0 ? 'set' : 'to']: 1,
            props: {
                pos: [this.moveByArgs.x + pos.x, this.moveByArgs.y + pos.y]
            }
        }];
    }

    private moveTo(node: Node) {
        return [{
            duration: this.duration,
            [this.duration == 0 ? 'set' : 'to']: 1,
            props: {
                pos: [this.moveToArgs.x, this.moveToArgs.y]
            }
        }];
    }

    private expandWidth(node: Node) {
        const size = no.size(node);
        return [{
            set: 1,
            props: {
                size: [this.expandWidthArgs.min, size.height]
            }
        }, {
            duration: this.duration,
            to: 1,
            props: {
                size: [this.expandWidthArgs.max, size.height]
            }
        }];
    }

    private expandHeight(node: Node) {
        const size = no.size(node);
        return [{
            set: 1,
            props: {
                size: [size.width, this.expandHeightArgs.min]
            }
        }, {
            duration: this.duration,
            to: 1,
            props: {
                size: [size.width, this.expandHeightArgs.max]
            }
        }];
    }

    private opacity(node: Node) {
        !node.getComponent(UIOpacity) && node.addComponent(UIOpacity);
        return [{
            duration: this.duration,
            [this.duration == 0 ? 'set' : 'to']: 1,
            props: {
                opacity: this.opacityArgs
            }
        }];
    }

    private rotation(node: Node) {
        return [{
            duration: this.duration,
            [this.duration == 0 ? 'set' : 'to']: 1,
            props: {
                angle: this.rotationArgs
            }
        }];
    }
}

@ccclass('AnimationEffectArray')
export class AnimationEffectArray {
    @property({ type: AnimationEffect, displayName: "串行动画效果", tooltip: "多个动画效果按顺序依次执行，如果设置了串行动画效果，并行动画效果将不会执行" })
    serialAnimationEffects: AnimationEffect[] = [];
}

@ccclass('YJUIAnimationEffect')
@executeInEditMode()
export class YJUIAnimationEffect extends Component {
    @property({ type: Node, displayName: '目标节点', tooltip: '不设置则使用当前节点' })
    target: Node = null;
    @property({ displayName: '作用在子节点上' })
    onChildren: boolean = false;
    @property({ type: AnimationEffect, displayName: "串行动画效果", tooltip: "多个动画效果按顺序依次执行，如果设置了串行动画效果，并行动画效果将不会执行" })
    serialAnimationEffects: AnimationEffect[] = [];
    @property({ type: AnimationEffectArray, displayName: "并行动画效果", tooltip: "多个串行动画效果同时执行" })
    parallelAnimationEffects: AnimationEffectArray[] = [];
    @property({ displayName: '执行次数', tooltip: '0表示无限循环，1表示执行一次，2表示执行两次，以此类推', min: 0, step: 1 })
    repeat: number = 1;
    @property({ displayName: '自动运行' })
    auto: boolean = false;
    // @property
    // public get preview(): boolean {
    //     return false;
    // }
    // private tween;
    // private intervalId = null;
    // public set preview(v: boolean) {
    //     if (!EDITOR) return;
    //     if (this.tween == null) {
    //         this.tween = director['_systems'].filter((v) => { return v._id == "TWEEN" })[0];
    //         this.tween._executeInEditMode = true;
    //     }
    //     if (!this.intervalId) {
    //         console.log(new Date().getTime())
    //         this.intervalId = setInterval(() => { this.tween.update(0.016); });
    //         this.a_play();
    //     }
    // }
    // @property
    // public get stopPreview(): boolean {
    //     return false;
    // }

    // public set stopPreview(v: boolean) {
    //     if (this.intervalId != null) {
    //         console.log(new Date().getTime())
    //         clearInterval(this.intervalId);
    //         this.intervalId = null;
    //         no.TweenSet.stop(this.node);
    //     }
    // }

    onLoad() {
        if (EDITOR && !this.target) {
            const a = this.getComponent('SetList')
                || this.getComponent('SetCreateNode')
                || this.getComponent('SetNodesSwitch')
                || this.getComponent('SetSpriteFrameInSampler2D');
            if (a && !a['uiAnim']) a['uiAnim'] = this;
        }
    }

    onEnable() {
        if (EDITOR) return;
        if (this.auto) {
            if (this.onChildren) {
                this.playOnChildren(this.node);
            } else {
                this.play(this.node);
            }
        }
    }

    onDisable() {
        no.TweenSet.stop(this.node);
    }

    public a_play() {
        const node = this.target || this.node;
        if (this.onChildren) {
            this.playOnChildren(node);
        } else {
            this.play(node);
        }
    }

    /**
     * 播放
     * @param node 执行缓动的目标节点
     */
    public play(node: Node) {
        if (this.serialAnimationEffects.length > 0)
            this.playSerial(node, this.repeat);
        else
            this.playParallel(node, this.repeat);
    }

    public playOnChildren(node: Node) {
        const children = node.children;
        let i = 0;
        this.schedule(() => {
            this.play(children[i++]);
        }, 0.1, children.length - 1);
    }

    private playSerial(node: Node, repeat: number) {
        this._playSerial(node, this.serialAnimationEffects, () => {
            if (this.repeat == 0 || --repeat > 0) this.playSerial(node, repeat);
            // else this.stopPreview = true;
        });
    }

    private playParallel(node: Node, repeat: number) {
        if (!isValid(node)) return;
        let all = this.parallelAnimationEffects.length,
            n = 0;
        for (let i = 0; i < all; i++) {
            const a = this.parallelAnimationEffects[i];
            this._playSerial(node, a.serialAnimationEffects, () => {
                n++;
            });
        }
        no.scheduleUpdateCheck(() => {
            return n === all;
        }, () => {
            if (this.repeat == 0 || --repeat > 0) this.playParallel(node, repeat);
            // else this.stopPreview = true;
        }, this);
    }

    private _playSerial(node: Node, serialAnimationEffects: AnimationEffect[], onEnd?: () => void) {
        if (!isValid(node)) return;
        // const a = serialAnimationEffects[idx];
        // if (!a) {
        //     onEnd?.();
        //     return;
        // }
        // if (a.type == AnimType.None) {
        //     return this._playSerial(node, serialAnimationEffects, ++idx, onEnd);
        // }
        // no.TweenSet.play(a.getTweenSet(node), () => this._playSerial(node, serialAnimationEffects, ++idx, onEnd));


        let a: any[] = [];
        serialAnimationEffects.forEach(b => {
            a = a.concat(b.getTweenSet(node));
        });
        no.TweenSet.play(no.parseTweenData(a, node), () => {
            onEnd?.();
            // else this.stopPreview = true;
        });
    }
}


