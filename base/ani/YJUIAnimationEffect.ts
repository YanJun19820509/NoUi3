import { no } from "../../no";
import { Range } from "../../types";
import { Component, EDITOR, Enum, Node, ccclass, property } from "../../yj";


enum AnimType {
    None = 0,
    Delay,//延迟执行
    ExpandWidth,//扩宽
    ExpandHeight,//扩高
    FadeOut,//淡出
    FadeIn,//淡入
    LeftSlideIn,//从左滑入
    RightSlideIn,//从右滑入
    ScaleOut,//缩小
    ScaleIn,//放大
    ScaleTo,//缩放至指定大小
    ScaleXOut,//x轴缩小
    ScaleXIn,//x轴放大
    ScaleYOut,//y轴缩小
    ScaleYIn,//y轴放大
}

@ccclass('AnimationEffect')
class AnimationEffect {
    @property({ type: Enum(AnimType), displayName: "动画类型" })
    type: AnimType = AnimType.None; // 默认动画类型为SlideIn
    @property({ displayName: "动画持续时长(秒)", min: 0 })
    duration: number = 0.1; // 默认动画持续时间为0.1秒
    @property({ displayName: "延迟时长(秒)", type: Range, visible() { return this.type === AnimType.Delay; } })
    delayDuration: number = 0.1;
    @property({ displayName: "扩宽参数", type: Range, visible() { return this.type === AnimType.ExpandWidth; } })
    expandWidthArgs: Range = new Range(0, 50); // 默认扩宽参数为0.5，即宽度扩大50%
    @property({ displayName: "扩高参数", type: Range, visible() { return this.type === AnimType.ExpandHeight; } })
    expandHeightArgs: Range = new Range(0, 50); // 默认扩宽参数为0.5，即宽度扩大50%
    @property({ displayName: "缩放参数", visible() { return this.type === AnimType.ScaleTo; } })
    scaleToArgs: number = .5;
    @property({ type: no.EventHandlerInfo, displayName: '回调' })
    callbacks: no.EventHandlerInfo[] = []; // 默认回调函数为空函数，即不执行任何操作

    public getTweenData(node: Node) {
        let a: any;
        switch (this.type) {
            case AnimType.Delay: a = this.delay(); break;
            case AnimType.ExpandWidth: a = this.expandWidth(node); break;
            case AnimType.ExpandHeight: a = this.expandHeight(node); break;
            case AnimType.FadeOut: a = this.fadeOut(node); break;
            case AnimType.FadeIn: a = this.fadeIn(node); break;
            case AnimType.LeftSlideIn: a = this.leftSlideIn(node); break;
            case AnimType.RightSlideIn: a = this.rightSlideIn(node); break;
            case AnimType.ScaleOut: a = this.scaleOut(node); break;
            case AnimType.ScaleIn: a = this.scaleIn(node); break;
            case AnimType.ScaleTo: a = this.scaleTo(node); break;
            case AnimType.ScaleXOut: a = this.scaleXOut(node); break;
            case AnimType.ScaleXIn: a = this.scaleXIn(node); break;
            case AnimType.ScaleYOut: a = this.scaleYOut(node); break;
            case AnimType.ScaleYIn: a = this.scaleYIn(node); break;
        }
        return a;
    }

    private delay() {
        return { delay: this.delayDuration };
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
            to: 1,
            props: {
                scale: [this.scaleToArgs, this.scaleToArgs]
            }
        }];
    }

    private scaleOut(node: Node) {
        if (!node["__yj_ui_scale"])
            node["__yj_ui_scale"] = no.scale(node);
        return {
            duration: this.duration,
            to: 1,
            props: {
                scale: [0, 0]
            }
        };
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
        return {
            duration: this.duration,
            to: 1,
            props: {
                scale: [0, s.y]
            }
        };
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
        return {
            duration: this.duration,
            to: 1,
            props: {
                scale: [s.x, 0]
            }
        };
    }

    private fadeOut(node: Node) {
        if (node["__yj_ui_opacity"] === undefined)
            node["__yj_ui_opacity"] = no.opacity(node);
        return {
            duration: this.duration,
            to: 1,
            props: {
                opacity: 0
            }
        };
    }

    private fadeIn(node: Node) {
        return {
            duration: this.duration,
            to: 1,
            props: {
                opacity: node["__yj_ui_opacity"] || 255
            }
        };
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
}


@ccclass('YJUIAnimationEffect')
export class YJUIAnimationEffect extends Component {
    @property({ type: AnimationEffect, displayName: "串行动画效果", tooltip: "多个动画效果按顺序依次执行" })
    serialAnimationEffects: AnimationEffect[] = [];
    @property({ type: AnimationEffect, displayName: "并行动画效果", tooltip: "多个动画效果同时执行" })
    parallelAnimationEffects: AnimationEffect[] = [];
    @property({ displayName: '重复次数', tooltip: '0表示无限循环，1表示执行一次，2表示执行两次，以此类推', min: 0, step: 1 })
    repeat: number = 1;
    @property({ displayName: '自动运行' })
    auto: boolean = false;

    onLoad() {
        if (this.auto) this.play(this.node);
    }

    private _repeat: number;
    public a_play() {
        this.play(this.node);
    }

    public play(node: Node) {
        this._repeat = this.repeat;
        this.playSerial(node);
        this.playParallel(node);
    }

    private playSerial(node: Node, idx = 0) {
        const a = this.serialAnimationEffects[idx];
        if (!a) {
            if (this.repeat == 0) {
                return this.playSerial(node, 0);
            } else if (this._repeat > 0) {
                this._repeat--;
                return this.playSerial(node, 0);
            }
            return;
        }
        if (a.type == AnimType.None) {
            return this.playSerial(node, ++idx);
        }
        no.TweenSet.play(no.parseTweenData(a.getTweenData(node), node), () => {
            no.EventHandlerInfo.execute(a.callbacks);
            this.playSerial(node, ++idx);
        });
    }

    private playParallel(node: Node) {
        const all = this.parallelAnimationEffects.length;
        let n = 0;
        this.parallelAnimationEffects.forEach(a => {
            if (a.type == AnimType.None) return;
            no.TweenSet.play(no.parseTweenData(a.getTweenData(node), node), () => {
                no.EventHandlerInfo.execute(a.callbacks);
                n++;
            });
        });
        no.waitFor(() => { return n == all; }).then(() => {
            if (this.repeat == 0) this.playParallel(node);
            if (this._repeat > 0) { this._repeat--; this.playParallel(node); }
        });
    }
}


