import { EasingType } from "NoUi3/types";
import { no } from "../../no";
import { DEBUG, Node, UIOpacity, UITransform, ccclass, easing, isValid, js, quat, size, v2, v3 } from "../../yj";

/**
 * 缓动库，用法同cocos的Tween，支持链式写法
 * 示例：YJTween.tween(this.node).to(1, { pos: [100,100] }).call(()=>{log('done!')}).start();
 * 示例：YJTween.tween(this.node).by(1, { pos: [100,100] }).reverse().start();
 * 示例：YJTween.tween(this.node).set({ pos: [200,300,0] }).repeat(10).start();
 * 示例：YJTween.tween(this.node).parse([{
                                     delay:1,
                                     duration:1,
                                     set:1,
                                     to:1,
                                     by:,
                                     props?: {
                                        pos: [100,100,0]
                                        opacity: 100,
                                        rotation: [1,1,0],
                                        scale: [0.5,0.5,1],
                                        size: [100,100],
                                        anchor: [0, 1]
                                    },
                                     reverse:true,
                                     repeat:2,
                                     callback:()=>{log('done!')}
                                }]).start();
 * 同时还支持停止stop，暂停pause，继续resume
 */
@ccclass('YJTween')
/**
 * 缓动动画类
 */
export class YJTween {
    //缓动目标
    private _target: Node = null;
    //缓动动作列表
    private _actions: TweenActionBase[];
    //并行执行的缓动动画列表
    private _tweens: YJTween[];
    //当前执行的动作索引
    private _actionIndex: number;
    //是否已开始播放
    private _started: boolean;
    //是否暂停
    private _paused: boolean;
    //缓存起来，方便查找和停止
    private static _tweenMap: { [uuid: string]: YJTween[] } = {};

    /**
     * 创建一个缓动动画
     * @param target 目标节点
     * @returns YJTween实例
     */
    public static tween(target: Node) {
        return new YJTween(target);
    }

    /**
     * 停止所有缓动动画
     */
    public static stopAll() {
        for (const key in YJTween._tweenMap) {
            const tweens = YJTween._tweenMap[key];
            for (let i = 0, n = tweens.length; i < n; i++) {
                tweens[i].stop();
            }
        }
    }

    /**
     * 停止指定节点的所有缓动动画
     * @param target 目标节点
     */
    public static stopAllByTarget(target: Node) {
        const uuid = target.uuid;
        if (YJTween._tweenMap[uuid]) {
            const tweens = YJTween._tweenMap[uuid];
            for (let i = 0, n = tweens.length; i < n; i++) {
                tweens[i].stop();
            }
        }
    }

    /**
     * 将缓动动画添加到缓存Map中
     * @param tween 缓动动画实例
     */
    private static addToMap(tween: YJTween) {
        const uuid = tween._target.uuid;
        if (!YJTween._tweenMap[uuid]) YJTween._tweenMap[uuid] = [];
        YJTween._tweenMap[uuid].push(tween);
    }

    /**
     * 构造函数
     * @param target 目标节点
     */
    constructor(target: Node) {
        this._target = target;
        this._actions = [];
        this._tweens = [];
        YJTween.addToMap(this);
    }

    /**
     * 添加一个缓动到目标值的动作
     * @param duration 持续时间
     * @param props 目标属性值
     * @param easing 缓动函数类型
     * @returns this
     */
    public to(duration: number, props: PropType, easing?: EasingType) {
        this._actions[this._actions.length] = new TweenActionTo(this._target, duration, props, easing);
        return this;
    }

    /**
     * 添加一个缓动增量值的动作
     * @param duration 持续时间
     * @param props 增量属性值
     * @param easing 缓动函数类型
     * @returns this
     */
    public by(duration: number, props: PropType, easing?: EasingType) {
        this._actions[this._actions.length] = new TweenActionBy(this._target, duration, props, easing);
        return this;
    }

    /**
     * 添加一个直接设置属性值的动作
     * @param props 属性值
     * @returns this
     */
    public set(props: PropType) {
        this._actions[this._actions.length] = new TweenActionSet(this._target, props);
        return this;
    }

    /**
     * 添加一个延迟动作
     * @param duration 延迟时间
     * @returns this
     */
    public delay(duration: number) {
        this._actions[this._actions.length] = new TweenActionDelay(this._target, duration);
        return this;
    }

    /**
     * 重复，共执行times+1次
     * @param times <0表示无限循环，0表示不重复，>0表示重复次数。
     * @returns this
     */
    public repeat(times: number) {
        if (times != 0) {
            const a = new TweenActionRepeat(this._target, this._actions, times);
            this._actions = [a];
        }
        return this;
    }

    /**
     * 反转当前所有动作
     * @returns this
     */
    public reverse() {
        const a = new TweenActionReverse(this._target, this._actions);
        this._actions = [a];
        return this;
    }

    /**
     * 添加一个回调动作
     * @param fn 回调函数
     * @returns this
     */
    public call(fn: () => void) {
        if (fn && typeof fn === 'function')
            this._actions[this._actions.length] = new TweenActionCall(this._target, fn);
        return this;
    }

    /**
     * 将多个缓动动画串行执行
     * @param tweens 缓动动画列表
     * @returns this
     */
    public sequence(...tweens: YJTween[]) {
        for (let i = 0, n = tweens.length; i < n; i++) {
            const tween = tweens[i];
            for (let j = 0, m = tween._actions.length; j < m; j++) {
                this._actions.push(tween._actions[j]);
            }
        }
        return this;
    }

    /**
     * 将多个缓动动画并行执行
     * @param tweens 缓动动画列表
     * @returns this
     */
    public parallel(...tweens: YJTween[]) {
        this._tweens = this._tweens.concat(tweens);
        return this;
    }

    /**
     * 开始执行缓动动画
     * @returns this
     */
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
     * @returns this
     */
    public stop() {
        if (this._started) {
            no.unscheduleTargetUpdateFunction(this);
            for (let i = 0; i < this._actions.length; i++) {
                this._actions[i].reset();
            }
            this._started = false;
            this._paused = false;
        }
        return this;
    }

    /**
     * 暂停缓动动画
     * @returns this
     */
    public pause() {
        if (this._started)
            this._paused = true;
        return this;
    }

    /**
     * 恢复缓动动画
     * @returns this
     */
    public resume() {
        if (this._started)
            this._paused = false;
        return this;
    }

    /**
     * 更新缓动动画
     * @param dt 时间增量
     */
    public update(dt: number) {
        if (!isValid(this._target)) {
            this.clear();
            return;
        }
        if (this._paused) return;
        for (let i = 0; i < this._tweens.length; i++) {
            this._tweens[i].update(dt);
        }
        const a = this._actions[this._actionIndex];
        if (!a) {
            this.stop();
            return;
        }
        a.update(dt);
        if (a.done) this._actionIndex++;
    }

    /**
     * 清理缓动动画
     */
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
            for (let i = 0; i < data.length; i++) {
                this._parse(data[i]);
            }
        }
        return this;
    }

    /**
     * 解析单个缓动数据
     * @param data 缓动数据
     * @returns YJTween实例
     */
    private _parse(data: TweenDataType) {
        const { delay, duration, to, by, set, props, easing, repeat, reverse, callback }: TweenDataType = data;
        let a = this;
        if (delay) a.delay(delay);
        if (props) {
            if (to) {
                a.to(duration, props, easing);
            } else if (by) {
                a.by(duration, props, easing);
            } else if (set) {
                a.set(props);
            }
        } else {
            let arr: YJTween[] = [];
            if (to && typeof to == 'object') {
                arr[arr.length] = this._new().to(duration, to as PropType, easing);
            }
            if (by && typeof by == 'object') {
                arr[arr.length] = this._new().by(duration, by as PropType, easing);
            }
            if (set && typeof set == 'object') {
                arr[arr.length] = this._new().set(set as PropType);
            }
            a.parallel(...arr);
        }
        if (reverse) a.reverse();
        if (repeat != null) a.repeat(repeat);
        if (callback) a.call(callback);
        return a;
    }

    /**
     * 创建一个新的缓动动画实例
     * @returns YJTween实例
     */
    private _new() {
        return YJTween.tween(this._target);
    }
}

/**
 * 缓动动作基类
 */
class TweenActionBase {
    /** 目标节点 */
    public readonly target: Node;
    /** 持续时间 */
    public readonly duration: number;
    /** 是否完成 */
    public done: boolean;
    /** 当前时间 */
    protected t: number;
    /** 是否反向播放 */
    protected isReverse: boolean;

    constructor(target: Node, duration: number) {
        this.target = target;
        this.duration = duration;
        this.done = false;
        this.t = 0;
        this.isReverse = false;
    }

    /**
     * 更新动作
     * @param dt 时间增量
     */
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

    /**
     * 反转动作
     */
    public reverse() {
        this.t = this.duration;
        this.isReverse = true;
        this.done = false;
    }

    /**
     * 重置动作
     */
    public reset() {
        this.t = 0;
        this.isReverse = false;
        this.done = false;
    }

    /**
     * 更新回调
     * @param dt 时间增量
     */
    protected onUpdate(dt: number) { }
}

/**
 * 缓动到目标值的动作
 */
class TweenActionTo extends TweenActionBase {
    /** 缓动函数 */
    public readonly easingFn: EasingMethodFn;
    /** 原始属性值 */
    protected _originProps: PropType;
    /** 动作属性列表 */
    protected props: ActionProp[];

    constructor(target: Node, duration: number, props?: PropType, easing?: EasingType) {
        super(target, duration);
        this._originProps = props;
        this.easingFn = getEasingFn(easing || EasingType.LINEAR);
    }

    protected onUpdate(dt: number) {
        if (!this.props)
            this.initProps(this._originProps);
        for (let i = 0; i < this.props.length; i++) {
            this.updateProp(this.props[i]);
        }
    }

    public reverse() {
        super.reverse();
        this.reverseProps();
    }

    public reset() {
        super.reset();
        this.resetProps();
    }

    /**
     * 反转属性值
     */
    protected reverseProps() {
        // this.props.forEach(prop => {
        //     prop.start = prop.cur.slice();
        // });
    }

    /**
     * 重置属性值
     */
    protected resetProps() {
        if (this.props) {
            for (let i = 0; i < this.props.length; i++) {
                this.props[i].cur = this.props[i].start.slice();
            }
        }
    }

    /**
     * 更新单个属性值
     * @param prop 属性对象
     */
    private updateProp(prop: ActionProp) {
        const t = this.done ? (this.isReverse ? 0 : 1) : this.easingFn(this.t / this.duration);
        for (let i = 0, n = prop.start.length; i < n; i++) {
            prop.cur[i] = prop.start[i] + (prop.increment[i] || 0) * t;
        }
        switch (prop.type) {
            case "pos":
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

    /**
     * 初始化属性列表
     * @param props 属性对象
     */
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
                    increment: this.propValueMinus([].concat(props[type]), propValue),
                    cur: propValue.slice()
                };
            this.props[this.props.length] = action;
        }
    }

    /**
     * 根据属性类型获取目标组件
     * @param type 属性类型
     * @returns 目标组件
     */
    protected getPropTargetByType(type: string): TargetType {
        switch (type) {
            case "pos":
            case "angle":
            case "rotation":
            case "scale":
                return this.target;
            case "size":
            case "anchor":
                return this.target.getComponent(UITransform);
            case "opacity":
                return this.target.getComponent(UIOpacity) || this.target.addComponent(UIOpacity);
            default:
                return null;
        }
    }

    /**
     * 根据属性类型获取属性值
     * @param target 目标组件
     * @param type 属性类型
     * @returns 属性值数组
     */
    protected getPropValueByType(target: TargetType, type: string): number[] {
        switch (type) {
            case "pos": {
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

    /**
     * 数组相加
     * @param v1 数组1
     * @param v2 数组2
     * @returns 相加后的数组
     */
    protected propValueAdd(v1: number[], v2: number[]): number[] {
        let v3: number[] = [];
        for (let i = 0; i < v1.length; i++) {
            v3[i] = v1[i] + (v2[i] || 0);
        }
        return v3;
    }

    /**
     * 数组相减
     * @param v1 数组1
     * @param v2 数组2
     * @returns 相减后的数组
     */
    protected propValueMinus(v1: number[], v2: number[]): number[] {
        let v3: number[] = [];
        for (let i = 0; i < v1.length; i++) {
            v3[i] = v1[i] - (v2[i] || 0);
        }
        return v3;
    }
}

/**
 * 缓动增量值的动作
 */
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
                    increment: (props[type] instanceof Array) ? props[type].slice() : [props[type]],
                    cur: propValue.slice()
                };
            this.props[this.props.length] = action;
        }
    }

    protected resetProps() {
        if (this.props) {
            for (let i = 0; i < this.props.length; i++) {
                const prop = this.props[i];
                prop.start = this.propValueMinus(prop.cur, prop.increment);
            }
        }
    }

    protected reverseProps() {
        if (this.props) {
            for (let i = 0; i < this.props.length; i++) {
                this.props[i].start = this.props[i].cur.slice();
            }
        }
    }
}

/**
 * 直接设置属性值的动作
 */
class TweenActionSet extends TweenActionTo {
    constructor(target: Node, props: PropType) {
        super(target, 0);
        this._originProps = props;
    }
}

/**
 * 延迟动作
 */
class TweenActionDelay extends TweenActionBase { }

/**
 * 回调动作
 */
class TweenActionCall extends TweenActionBase {
    private _call: () => void;
    constructor(target: Node, callFn: () => void) {
        super(target, 0);
        this._call = callFn;
    }

    protected onUpdate(dt: number) { this._call?.(); }
}

/**
 * 重复动作
 */
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
        if (!isValid(this.target) || this.done || this._actions.length == 0) return;
        this.onUpdate(dt);
    }

    public reset() {
        super.reset();
        this._repeatCount = this._repeat + 1;
        this._actionIndex = 0;
        for (let i = 0; i < this._actions.length; i++) {
            this._actions[i].reset();
        }
    }

    public reverse() {
        super.reverse();
        this._repeatCount = this._repeat + 1;
        this._actionIndex = this._actions.length - 1;
        for (let i = 0; i < this._actions.length; i++) {
            this._actions[i].reverse();
        }
    }

    protected onUpdate(dt: number) {
        const a = this._actions[this._actionIndex];
        if (!a) {
            if (this._repeat < 0 || --this._repeatCount > 0) {
                this._actionIndex = this.isReverse ? this._actions.length - 1 : 0;
                if (this.isReverse) {
                    for (let i = 0; i < this._actions.length; i++) {
                        this._actions[i].reverse();
                    }
                } else {
                    for (let i = 0; i < this._actions.length; i++) {
                        this._actions[i].reset();
                    }
                }
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

/**
 * 反转动作
 */
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
        if (!isValid(this.target) || this.done || this._actions.length == 0) return;
        this.onUpdate(dt);
    }

    public reset() {
        super.reset();
        this._repeatCount = 2;
        this._actionIndex = 0;
        for (let i = 0; i < this._actions.length; i++) {
            this._actions[i].reset();
        }
    }

    protected onUpdate(dt: number) {
        const a = this._actions[this._actionIndex];
        if (!a) {
            if (--this._repeatCount == 1) {
                this.isReverse = true;
                this._actionIndex = this._actions.length - 1;
                for (let i = 0; i < this._actions.length; i++) {
                    this._actions[i].reverse();
                }
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

/** 目标组件类型 */
export type TargetType = Node | UITransform | UIOpacity;
/** 属性类型 */
export type PropType = { pos?: number[], angle?: number[], rotation?: number[], scale?: number[], size?: number[], anchor?: number[], opacity?: number[] };
/** 缓动数据类型 */
export type TweenDataType = { delay?: number, duration?: number, to?: number | PropType, by?: number | PropType, set?: number | PropType, props?: PropType, easing?: EasingType, repeat?: number, reverse?: boolean, callback?: () => void };
/** 动作属性类型 */
export type ActionProp = { target: TargetType, type: string, start: number[], increment: number[], cur: number[] };
// export type EasingType = "linear" | "smooth" | "fade" | "constant" | "quadIn" | "quadOut" | "quadInOut" | "quadOutIn" | "cubicIn" | "cubicOut" | "cubicInOut" | "cubicOutIn" | "quartIn" | "quartOut" | "quartInOut" | "quartOutIn" | "quintIn" | "quintOut" | "quintInOut" | "quintOutIn" | "sineIn" | "sineOut" | "sineInOut" | "sineOutIn" | "expoIn" | "expoOut" | "expoInOut" | "expoOutIn" | "circIn" | "circOut" | "circInOut" | "circOutIn" | "elasticIn" | "elasticOut" | "elasticInOut" | "elasticOutIn" | "backIn" | "backOut" | "backInOut" | "backOutIn" | "bounceIn" | "bounceOut" | "bounceInOut" | "bounceOutIn";

/** 缓动函数类型 */
export type EasingMethodFn = (k: number) => number;

/**
 * 获取缓动函数
 * @param easingMethod 缓动类型
 * @returns 缓动函数
 */
export function getEasingFn(easingMethod: EasingType): EasingMethodFn {
    switch (easingMethod) {
        case EasingType.LINEAR: return easing.linear;
        case EasingType.CONSTANT: return easing.constant;
        case EasingType.QUAD_IN: return easing.quadIn;
        case EasingType.QUAD_OUT: return easing.quadOut;
        case EasingType.QUAD_IN_OUT: return easing.quadInOut;
        case EasingType.QUAD_OUT_IN: return easing.quadOutIn;
        case EasingType.CUBIC_IN: return easing.cubicIn;
        case EasingType.CUBIC_OUT: return easing.cubicOut;
        case EasingType.CUBIC_IN_OUT: return easing.cubicInOut;
        case EasingType.CUBIC_OUT_IN: return easing.cubicOutIn;
        case EasingType.QUART_IN: return easing.quartIn;
        case EasingType.QUART_OUT: return easing.quartOut;
        case EasingType.QUART_IN_OUT: return easing.quartInOut;
        case EasingType.QUART_OUT_IN: return easing.quartOutIn;
        case EasingType.QUINT_IN: return easing.quintIn;
        case EasingType.QUINT_OUT: return easing.quintOut;
        case EasingType.QUINT_IN_OUT: return easing.quintInOut;
        case EasingType.QUINT_OUT_IN: return easing.quintOutIn;
        case EasingType.SINE_IN: return easing.sineIn;
        case EasingType.SINE_OUT: return easing.sineOut;
        case EasingType.SINE_IN_OUT: return easing.sineInOut;
        case EasingType.SINE_OUT_IN: return easing.sineOutIn;
        case EasingType.EXPO_IN: return easing.expoIn;
        case EasingType.EXPO_OUT: return easing.expoOut;
        case EasingType.EXPO_IN_OUT: return easing.expoInOut;
        case EasingType.EXPO_OUT_IN: return easing.expoOutIn;
        case EasingType.CIRC_IN: return easing.circIn;
        case EasingType.CIRC_OUT: return easing.circOut;
        case EasingType.CIRC_IN_OUT: return easing.circInOut;
        case EasingType.CIRC_OUT_IN: return easing.circOutIn;
        case EasingType.BOUNCE_OUT: return easing.bounceOut;
        case EasingType.BOUNCE_IN: return easing.bounceIn;
        case EasingType.BOUNCE_IN_OUT: return easing.bounceInOut;
        case EasingType.BOUNCE_OUT_IN: return easing.bounceOutIn;
        case EasingType.ELASTIC_IN: return easing.elasticIn;
        case EasingType.ELASTIC_OUT: return easing.elasticOut;
        case EasingType.ELASTIC_IN_OUT: return easing.elasticInOut;
        case EasingType.ELASTIC_OUT_IN: return easing.elasticOutIn;
        case EasingType.BACK_IN: return easing.backIn;
        case EasingType.BACK_OUT: return easing.backOut;
        case EasingType.BACK_IN_OUT: return easing.backInOut;
        case EasingType.BACK_OUT_IN: return easing.backOutIn;
        case EasingType.SMOOTH: return easing.smooth;
        case EasingType.FADE: return easing.fade;
        default: return easing.linear;
    }
}

export const YJTweenTest = false;

if (YJTweenTest) {
    const a = {
        map: YJTween,
        init(node: Node) {
            this.map = YJTween.tween(node);
        },

        start() {
            return this.map.start();
        },

        stop() {
            return this.map.stop();
        },

        setTweenData(data: any) {
            this.map.parse(data);
        },

        play(endCall?: () => void) {
            this.map.call(endCall).start();
        }
    };

    js.mixin(no.TweenSet.prototype, a);
    js.mixin(no.TweenSet, {
        /**
         * 播放缓动动画
         * @param tweenSets 如果tweenSets是Array，则按并行处理
         * @param endCall 执行完回调
         * @param target 并行时用于处理目标销毁的情况
         */
        play(tweenSets: no.TweenSet | no.TweenSet[], endCall?: () => void, target?: any) {
            if (tweenSets instanceof Array) {
                let all = tweenSets.length,
                    n = 0;
                for (let i = 0; i < all; i++) {
                    tweenSets[i].play(() => {
                        n++;
                    });
                }
                no.scheduleUpdateCheck(() => {
                    return n === all;
                }, () => {
                    endCall?.();
                }, target);
            } else tweenSets.play(endCall);
        },

        stop(target: any) {
            YJTween.stopAllByTarget(target);
        },
    });

    no.parseTweenData = function (data: any, node: Node): no.TweenSet | no.TweenSet[] {
        const _tween = new no.TweenSet(node);
        _tween.setTweenData(data);
        return _tween;
    };
}