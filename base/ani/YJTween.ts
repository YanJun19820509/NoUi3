import { no } from "../../no";
import { Node, UIOpacity, UITransform, ccclass, easing, isValid, quat, size, v2, v3 } from "../../yj";

/**
 * 缓动库，用法同cocos的Tween，支持链式写法
 * 示例：YJTween.tween(this.node).to(1, { position: [100,100] }).call(()=>{log('done!')}).start();
 * 示例：YJTween.tween(this.node).by(1, { position: [100,100] }).reverse().start();
 * 示例：YJTween.tween(this.node).set({ position: [200,300,0] }).repeat(10).start();
 * 示例：YJTween.tween(this.node).parse({
                                     delay:1,
                                     duration:1,
                                     set:{opacity:2},
                                     to:{opacity:255},
                                     by:{position:[10,10]},
                                     reverse:true,
                                     repeat:2,
                                     call:()=>{log('done!')}
                                }).start();
 * 同时还支持停止stop，暂停pause，继续resume
 */
@ccclass('YJTween')
export class YJTween {
    //缓动目标
    private _target: Node = null;
    private _actions: TweenActionBase[];
    private _tweens: YJTween[];
    private _actionIndex: number;
    private _started: boolean;
    private _paused: boolean;


    public static tween(target: Node) {
        return new YJTween(target);
    }

    constructor(target: Node) {
        this._target = target;
        this._actions = [];
        this._tweens = [];
    }

    public to(duration: number, props: PropType, easing?: EasingMethod) {
        this._actions[this._actions.length] = new TweenActionTo(this._target, duration, props, easing);
        return this;
    }

    public by(duration: number, props: PropType, easing?: EasingMethod) {
        this._actions[this._actions.length] = new TweenActionBy(this._target, duration, props, easing);
        return this;
    }

    public set(props: PropType) {
        this._actions[this._actions.length] = new TweenActionTo(this._target, 0, props, EasingMethod.LINEAR);
        return this;
    }

    public delay(duration: number) {
        this._actions[this._actions.length] = new TweenActionDelay(this._target, duration);
        return this;
    }

    /**
     * 重复，共执行times+1次
     * @param times <0表示无限循环，0表示不重复，>0表示重复次数。
     * @returns 
     */
    public repeat(times: number) {
        if (times != 0) {
            const a = new TweenActionRepeat(this._target, this._actions, times);
            this._actions = [a];
        }
        return this;
    }

    public reverse() {
        const a = new TweenActionReverse(this._target, this._actions);
        this._actions = [a];
        return this;
    }

    public call(fn: () => void) {
        if (fn && typeof fn === 'function')
            this._actions[this._actions.length] = new TweenActionCall(this._target, fn);
        return this;
    }

    public sequence(...tweens: YJTween[]) {
        this._actions = this._actions.concat(...tweens.map(t => t._actions));
        return this;
    }

    public parallel(...tweens: YJTween[]) {
        this._tweens = this._tweens.concat(tweens);
        return this;
    }

    public start() {
        if (this._started) return;
        this._started = true;
        this._paused = false;
        this._actionIndex = 0;
        no.scheduleTargetUpdateFunction(this, 10);
        return this;
    }

    /**
     * 停止所有缓动动作，并重置所有属性到初始值。
     * @returns 
     */
    public stop() {
        if (this._started) {
            no.unscheduleTargetUpdateFunction(this);
            this._actions.forEach(a => {
                a.reset();
            });
            this._started = false;
            this._paused = false;
        }
        return this;
    }

    public pause() {
        if (this._started)
            this._paused = true;
        return this;
    }

    public resume() {
        if (this._started)
            this._paused = false;
        return this;
    }

    public update(dt: number) {
        if (!isValid(this._target)) {
            this.clear();
            return;
        }
        if (this._paused) return;
        this._tweens.forEach(t => t.update(dt));
        const a = this._actions[this._actionIndex];
        if (!a) {
            this.stop();
            return;
        }
        a.update(dt);
        if (a.done) this._actionIndex++;
    }

    public clear() {
        no.unscheduleTargetUpdateFunction(this);
        this._actions.length = 0;
        this._tweens.length = 0;
        this._target = null;
        this._paused = false;
    }

    /**
     * 解析缓动动效数据
     * @param data :TweenDataType | TweenDataType[]
     * @returns YJTween
     * @ 如果data为数组，则为串行动作,按数组下标顺序执行；TweenDataType内按并行处理，to by set 将同时执行。
     * delay最先执行，call最后执行。如果repeat与reverse同时存在，则先处理reverse，再处理repeat。
     */
    public parse(data: TweenDataType | TweenDataType[]) {
        if (this._target) {
            data = [].concat(data);
            let arr: YJTween[] = [];
            data.forEach(d => {
                arr[arr.length] = this._parse(d);
            });
            this.sequence(...arr);
        }
        return this;
    }

    private _parse(data: TweenDataType) {
        const { delay, duration, to, by, set, easing, repeat, reverse, call }: TweenDataType = data;
        let a = this._new();
        if (delay) a.delay(delay);
        let arr: YJTween[] = [];
        if (to) {
            arr[arr.length] = this._new().to(duration, to, easing);
        }
        if (by) {
            arr[arr.length] = this._new().by(duration, by, easing);
        }
        if (set) {
            arr[arr.length] = this._new().set(set);
        }
        a = a.parallel(...arr);
        if (reverse) a = a.reverse();
        if (repeat != null) a = a.repeat(repeat);
        if (call) a = a.call(call);
        return a;
    }

    private _new() {
        return YJTween.tween(this._target);
    }
}

class TweenActionBase {
    public readonly target: Node;
    public readonly duration: number;
    public done: boolean;
    protected t: number;
    protected isReverse: boolean;

    constructor(target: Node, duration: number) {
        this.target = target;
        this.duration = duration;
        this.done = false;
        this.t = 0;
        this.isReverse = false;
    }

    public update(dt: number) {
        if (!isValid(this.target) || this.done) return;
        if (!this.isReverse) {
            this.t += dt;
            this.done = this.t >= this.duration;
        } else {
            this.t -= dt;
            this.done = this.t <= 0;
        }
        this.onUpdate(dt);
    }

    public reverse() {
        this.t = this.duration;
        this.isReverse = true;
        this.done = false;
    }

    public reset() {
        this.t = 0;
        this.isReverse = false;
        this.done = false;
    }

    protected onUpdate(dt: number) { }
}

class TweenActionTo extends TweenActionBase {
    public readonly easingFn: EasingMethodFn;
    protected props: ActionProp[];

    constructor(target: Node, duration: number, props?: PropType, easing?: EasingMethod) {
        super(target, duration);
        this.easingFn = getEasingFn(easing || EasingMethod.LINEAR);
        this.initProps(props);
    }

    protected onUpdate(dt: number) {
        this.props.forEach(prop => this.updateProp(prop));
    }

    public reverse() {
        super.reverse();
        this.reverseProps();
    }

    public reset() {
        super.reset();
        this.resetProps();
    }

    protected reverseProps() {
        // this.props.forEach(prop => {
        //     prop.start = prop.cur.slice();
        // });
    }

    protected resetProps() {
        this.props.forEach(prop => {
            prop.cur = prop.start.slice();
        });
    }

    private updateProp(prop: ActionProp) {
        const t = this.done ? (this.isReverse ? 0 : 1) : this.easingFn(this.t / this.duration);
        for (let i = 0, n = prop.start.length; i < n; i++) {
            prop.cur[i] = prop.start[i] + (prop.increment[i] || 0) * t;
        }
        switch (prop.type) {
            case "position":
                (prop.target as Node).setPosition(v3(...prop.cur));
                break;
            case "angle":
                (prop.target as Node).angle = prop.cur[0];
                break;
            case "rotation":
                (prop.target as Node).setRotation(quat(...prop.cur));
                break;
            case "scale":
                (prop.target as Node).setScale(v3(...prop.cur));
                break;
            case "size":
                (prop.target as UITransform).setContentSize(size(...prop.cur));
                break;
            case "anchor":
                (prop.target as UITransform).setAnchorPoint(v2(...prop.cur));
                break;
            case "opacity":
                (prop.target as UIOpacity).opacity = prop.cur[0];
                break;
        }
    }

    protected initProps(props: PropType) {
        this.props = [];
        if (!props) return;
        for (const type in props) {
            const actionTarget = this.getPropTargetByType(type),
                propValue = this.getPropValueByType(actionTarget, type),
                action: ActionProp = {
                    target: actionTarget,
                    type: type,
                    start: propValue,
                    increment: this.propValueMinus(props[type], propValue),
                    cur: propValue.slice()
                };
            this.props[this.props.length] = action;
        }
    }

    protected getPropTargetByType(type: string): TargetType {
        switch (type) {
            case "position":
            case "angle":
            case "rotation":
            case "scale":
                return this.target;
            case "size":
            case "anchor":
                return this.target.getComponent(UITransform);
            case "opacity":
                return this.target.getComponent(UIOpacity);
            default:
                return null;
        }
    }

    protected getPropValueByType(target: TargetType, type: string): number[] {
        switch (type) {
            case "position": {
                const p = (target as Node).position;
                return [p.x, p.y, p.z];
            }
            case "angle": return [(target as Node).angle];
            case "rotation": {
                const r = (target as Node).rotation;
                return [r.x, r.y, r.z, r.w];
            }
            case "scale": {
                const s = (target as Node).scale;
                return [s.x, s.y, s.z];
            }
            case "size": {
                const s = (target as UITransform).contentSize;
                return [s.width, s.height];
            }
            case "anchor": {
                const a = (target as UITransform).anchorPoint;
                return [a.x, a.y];
            }
            case "opacity": return [(target as UIOpacity).opacity];
        }
    }

    protected propValueAdd(v1: number[], v2: number[]): number[] {
        let v3: number[] = [];
        v1.forEach((v, i) => {
            v3[i] = v + (v2[i] || 0);
        });
        return v3;
    }

    protected propValueMinus(v1: number[], v2: number[]): number[] {
        let v3: number[] = [];
        v1.forEach((v, i) => {
            v3[i] = v - (v2[i] || 0);
        });
        return v3;
    }
}

class TweenActionBy extends TweenActionTo {
    protected initProps(props: PropType) {
        this.props = [];
        for (const type in props) {
            const actionTarget = this.getPropTargetByType(type),
                propValue = this.getPropValueByType(actionTarget, type),
                action: ActionProp = {
                    target: actionTarget,
                    type: type,
                    start: propValue,
                    increment: props[type].slice(),
                    cur: propValue.slice()
                };
            this.props[this.props.length] = action;
        }
    }

    protected resetProps() {
        this.props.forEach(prop => {
            prop.start = prop.cur.slice();
        });
    }

    protected reverseProps() {
        this.props.forEach(prop => {
            prop.start = this.propValueMinus(prop.cur, prop.increment);
        });
    }
}

class TweenActionDelay extends TweenActionBase { }

class TweenActionCall extends TweenActionBase {
    private _call: () => void;
    constructor(target: Node, callFn: () => void) {
        super(target, 0);
        this._call = callFn;
    }

    protected onUpdate(dt: number) { this._call?.(); }
}

class TweenActionRepeat extends TweenActionBase {
    private _actions: TweenActionBase[];
    private _repeat: number;
    private _actionIndex: number;
    private _repeatCount: number;

    constructor(target: Node, actions: TweenActionBase[], repeat: number) {
        super(target, 0);
        this._actions = actions.slice();
        this._repeat = repeat;
        this._repeatCount = repeat + 1;
        this._actionIndex = 0;
    }

    public update(dt: number) {
        if (!isValid(this.target) || this.done) return;
        this.onUpdate(dt);
    }

    public reset() {
        super.reset();
        this._repeatCount = this._repeat + 1;
        this._actionIndex = 0;
        this._actions.forEach(a => a.reset());
    }

    public reverse() {
        super.reverse();
        this._repeatCount = this._repeat + 1;
        this._actionIndex = this._actions.length - 1;
        this._actions.forEach(a => a.reverse());
    }

    protected onUpdate(dt: number) {
        const a = this._actions[this._actionIndex];
        if (!a) {
            if (this._repeat < 0 || --this._repeatCount > 0) {
                this._actionIndex = this.isReverse ? this._actions.length - 1 : 0;
                if (this.isReverse)
                    this._actions.forEach(a => a.reverse());
                else
                    this._actions.forEach(a => a.reset());
                return this.onUpdate(dt);
            } else {
                this.done = true;
                return;
            }
        }
        a.update(dt);
        if (a.done)
            this._actionIndex += this.isReverse ? -1 : 1;
    }
}

class TweenActionReverse extends TweenActionBase {
    private _actions: TweenActionBase[];
    private _actionIndex: number;
    private _repeatCount: number;

    constructor(target: Node, actions: TweenActionBase[]) {
        super(target, 0);
        this._actions = actions.slice();
        this._repeatCount = 2;
        this._actionIndex = 0;
    }

    public update(dt: number) {
        if (!isValid(this.target) || this.done) return;
        this.onUpdate(dt);
    }

    public reset() {
        super.reset();
        this._repeatCount = 2;
        this._actionIndex = 0;
        this._actions.forEach(a => a.reset());
    }

    protected onUpdate(dt: number) {
        const a = this._actions[this._actionIndex];
        if (!a) {
            if (--this._repeatCount == 1) {
                this.isReverse = true;
                this._actionIndex = this._actions.length - 1;
                this._actions.forEach(a => a.reverse());
                return this.onUpdate(dt);
            } else {
                this.done = true;
                return;
            }
        }
        a.update(dt);
        if (a.done)
            this._actionIndex += this.isReverse ? -1 : 1;
    }
}

export type TargetType = Node | UITransform | UIOpacity;
export type PropType = { position?: number[], angle?: number[], rotation?: number[], scale?: number[], size?: number[], anchor?: number[], opacity?: number[] };
export type TweenDataType = { delay?: number, duration?: number, to?: PropType, by?: PropType, set?: PropType, easing?: EasingMethod, repeat?: number, reverse?: boolean, call?: () => void };
export type ActionProp = { target: TargetType, type: string, start: number[], increment: number[], cur: number[] };
// export type EasingType = "linear" | "smooth" | "fade" | "constant" | "quadIn" | "quadOut" | "quadInOut" | "quadOutIn" | "cubicIn" | "cubicOut" | "cubicInOut" | "cubicOutIn" | "quartIn" | "quartOut" | "quartInOut" | "quartOutIn" | "quintIn" | "quintOut" | "quintInOut" | "quintOutIn" | "sineIn" | "sineOut" | "sineInOut" | "sineOutIn" | "expoIn" | "expoOut" | "expoInOut" | "expoOutIn" | "circIn" | "circOut" | "circInOut" | "circOutIn" | "elasticIn" | "elasticOut" | "elasticInOut" | "elasticOutIn" | "backIn" | "backOut" | "backInOut" | "backOutIn" | "bounceIn" | "bounceOut" | "bounceInOut" | "bounceOutIn";

export enum EasingMethod {
    LINEAR,
    CONSTANT,
    QUAD_IN,
    QUAD_OUT,
    QUAD_IN_OUT,
    QUAD_OUT_IN,
    CUBIC_IN,
    CUBIC_OUT,
    CUBIC_IN_OUT,
    CUBIC_OUT_IN,
    QUART_IN,
    QUART_OUT,
    QUART_IN_OUT,
    QUART_OUT_IN,
    QUINT_IN,
    QUINT_OUT,
    QUINT_IN_OUT,
    QUINT_OUT_IN,
    SINE_IN,
    SINE_OUT,
    SINE_IN_OUT,
    SINE_OUT_IN,
    EXPO_IN,
    EXPO_OUT,
    EXPO_IN_OUT,
    EXPO_OUT_IN,
    CIRC_IN,
    CIRC_OUT,
    CIRC_IN_OUT,
    CIRC_OUT_IN,
    ELASTIC_IN,
    ELASTIC_OUT,
    ELASTIC_IN_OUT,
    ELASTIC_OUT_IN,
    BACK_IN,
    BACK_OUT,
    BACK_IN_OUT,
    BACK_OUT_IN,
    BOUNCE_IN,
    BOUNCE_OUT,
    BOUNCE_IN_OUT,
    BOUNCE_OUT_IN,
    SMOOTH,
    FADE,
};

export type EasingMethodFn = (k: number) => number;

export function getEasingFn(easingMethod: EasingMethod): EasingMethodFn {
    switch (easingMethod) {
        case EasingMethod.LINEAR: return easing.linear;
        case EasingMethod.CONSTANT: return easing.constant;
        case EasingMethod.QUAD_IN: return easing.quadIn;
        case EasingMethod.QUAD_OUT: return easing.quadOut;
        case EasingMethod.QUAD_IN_OUT: return easing.quadInOut;
        case EasingMethod.QUAD_OUT_IN: return easing.quadOutIn;
        case EasingMethod.CUBIC_IN: return easing.cubicIn;
        case EasingMethod.CUBIC_OUT: return easing.cubicOut;
        case EasingMethod.CUBIC_IN_OUT: return easing.cubicInOut;
        case EasingMethod.CUBIC_OUT_IN: return easing.cubicOutIn;
        case EasingMethod.QUART_IN: return easing.quartIn;
        case EasingMethod.QUART_OUT: return easing.quartOut;
        case EasingMethod.QUART_IN_OUT: return easing.quartInOut;
        case EasingMethod.QUART_OUT_IN: return easing.quartOutIn;
        case EasingMethod.QUINT_IN: return easing.quintIn;
        case EasingMethod.QUINT_OUT: return easing.quintOut;
        case EasingMethod.QUINT_IN_OUT: return easing.quintInOut;
        case EasingMethod.QUINT_OUT_IN: return easing.quintOutIn;
        case EasingMethod.SINE_IN: return easing.sineIn;
        case EasingMethod.SINE_OUT: return easing.sineOut;
        case EasingMethod.SINE_IN_OUT: return easing.sineInOut;
        case EasingMethod.SINE_OUT_IN: return easing.sineOutIn;
        case EasingMethod.EXPO_IN: return easing.expoIn;
        case EasingMethod.EXPO_OUT: return easing.expoOut;
        case EasingMethod.EXPO_IN_OUT: return easing.expoInOut;
        case EasingMethod.EXPO_OUT_IN: return easing.expoOutIn;
        case EasingMethod.CIRC_IN: return easing.circIn;
        case EasingMethod.CIRC_OUT: return easing.circOut;
        case EasingMethod.CIRC_IN_OUT: return easing.circInOut;
        case EasingMethod.CIRC_OUT_IN: return easing.circOutIn;
        case EasingMethod.BOUNCE_OUT: return easing.bounceOut;
        case EasingMethod.BOUNCE_IN: return easing.bounceIn;
        case EasingMethod.BOUNCE_IN_OUT: return easing.bounceInOut;
        case EasingMethod.BOUNCE_OUT_IN: return easing.bounceOutIn;
        case EasingMethod.ELASTIC_IN: return easing.elasticIn;
        case EasingMethod.ELASTIC_OUT: return easing.elasticOut;
        case EasingMethod.ELASTIC_IN_OUT: return easing.elasticInOut;
        case EasingMethod.ELASTIC_OUT_IN: return easing.elasticOutIn;
        case EasingMethod.BACK_IN: return easing.backIn;
        case EasingMethod.BACK_OUT: return easing.backOut;
        case EasingMethod.BACK_IN_OUT: return easing.backInOut;
        case EasingMethod.BACK_OUT_IN: return easing.backOutIn;
        case EasingMethod.SMOOTH: return easing.smooth;
        case EasingMethod.FADE: return easing.fade;
        default: return easing.linear;
    }
}