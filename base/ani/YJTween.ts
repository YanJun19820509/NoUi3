import { EasingType } from "../../types";
import { no } from "../../no";
import { DEBUG, Node, UIOpacity, UITransform, ccclass, easing, isValid, js, quat, size, v2, v3 } from "../../yj";
import { parseTweenData, TweenSet } from "@hackUi/extend/TweenSet";

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
    /** 缓动动画作用的目标节点 */
    private _target: Node = null;
    /** 存储按顺序执行的缓动动作队列 */
    private _actions: TweenActionBase[];
    /** 存储并行执行的子缓动动画（用于实现复杂动画组合） */
    private _tweens: YJTween[];
    /** 当前正在执行的动作索引（用于序列动画的逐步执行） */
    private _actionIndex: number;
    /** 标识缓动动画是否已经开始执行 */
    private _started: boolean;
    /** 标识缓动动画是否处于暂停状态 */
    private _paused: boolean;
    /** 静态缓存字典，按节点uuid存储正在运行的缓动实例（用于全局动画管理） */
    private static _tweenMap: { [uuid: string]: YJTween[] } = {};

    /**
     * 创建并返回一个新的缓动动画实例
     * @param target 需要执行动画的节点
     * @returns 新的YJTween实例
     * @example
     * // 创建节点移动动画
     * YJTween.tween(this.node)
     *   .to(1, { position: v3(100, 200, 0) })
     *   .start();
     */
    public static tween(target: Node) {
        return new YJTween(target);
    }

    /**
     * 停止所有正在运行的缓动动画
     * @example
     * // 场景切换时停止所有动画
     * YJTween.stopAll();
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
     * @param target 需要停止动画的节点
     * @example
     * // 当节点销毁时停止相关动画
     * YJTween.stopAllByTarget(this.node);
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
     * 将缓动实例注册到管理字典（内部使用）
     * @param tween 需要注册的缓动实例
     * @private
     * @example
     * // 当创建新动画时自动调用
     * YJTween.addToMap(newTween);
     */
    private static addToMap(tween: YJTween) {
        const uuid = tween._target.uuid;
        if (!YJTween._tweenMap[uuid]) YJTween._tweenMap[uuid] = [];
        YJTween._tweenMap[uuid].push(tween);
    }

    /**
     * 构造函数，初始化缓动实例
     * @param target - 需要施加动画的目标节点
     * @example
     * // 创建节点动画实例
     * const tween = new YJTween(this.node);
     */
    constructor(target: Node) {
        this._target = target;
        this._actions = []; // 存储主动画序列
        this._tweens = [];  // 存储并行动画列表
        YJTween.addToMap(this); // 注册到全局管理
    }

    /**
     * 添加从当前值渐变到目标值的补间动画
     * @param duration - 动画持续时间（秒）
     * @param props - 目标属性集合（如位置、缩放、透明度等）
     * @param easing - 缓动函数类型（可选，默认线性）
     * @returns 当前实例用于链式调用
     * @example
     * // 在1秒内移动到(100,200)位置，使用二次缓动
     * .to(1, { position: new Vec3(100, 200, 0) }, 'quadInOut')
     */
    public to(duration: number, props: PropType, easing?: EasingType) {
        this._actions[this._actions.length] = new TweenActionTo(this._target, duration, props, easing);
        return this;
    }

    /**
     * 添加基于当前值的增量补间动画
     * @param duration - 动画持续时间（秒）
     * @param props - 相对增量属性集合
     * @param easing - 缓动函数类型（可选，默认线性）
     * @returns 当前实例用于链式调用
     * @example
     * // 在0.5秒内向右移动100像素
     * .by(0.5, { position: new Vec3(100, 0, 0) }, 'sineOut')
     */
    public by(duration: number, props: PropType, easing?: EasingType) {
        this._actions[this._actions.length] = new TweenActionBy(this._target, duration, props, easing);
        return this;
    }

    /**
     * 立即设置目标属性值（无过渡）
     * @param props - 要设置的属性集合
     * @returns 当前实例用于链式调用
     * @example
     * // 直接设置缩放为50%并变为红色
     * .set({ scale: new Vec3(0.5, 0.5, 1), color: Color.RED })
     */
    public set(props: PropType) {
        this._actions[this._actions.length] = new TweenActionSet(this._target, props);
        return this;
    }

    /**
     * 添加等待时间（不改变属性）
     * @param duration - 延迟时间（秒）
     * @returns 当前实例用于链式调用
     * @example
     * // 在移动动画后等待1秒
     * .to(1, { x: 100 }).delay(1)
     */
    public delay(duration: number) {
        this._actions[this._actions.length] = new TweenActionDelay(this._target, duration);
        return this;
    }

    /**
     * 设置动画重复模式（实际执行次数 = times + 1）
     * @param times - 重复次数：
     *               -1 = 无限循环
     *                0 = 不重复（只执行一次）
     *               >0 = 额外重复次数
     * @returns 当前实例用于链式调用
     * @example
     * // 上下跳动3次（初始1次 + 重复2次）
     * .repeat(2)
     * 
     * // 无限循环旋转
     * .repeat(-1)
     */
    public repeat(times: number) {
        if (times != 0) {
            const a = new TweenActionRepeat(this._target, this._actions, times);
            this._actions = [a];
        }
        return this;
    }

    /**
     * 反转当前所有动作的执行顺序和方向
     * @returns 当前实例用于链式调用
     * @example
     * // 先移动后缩放，反转后变为先缩放后反向移动
     * .to(1, { x: 100 }).to(0.5, { scale: new Vec3(2, 2, 1) }).reverse()
     * 
     * // 创建来回移动动画
     * .to(1, { y: 200 }).reverse().repeat(-1)
     */
    public reverse() {
        const a = new TweenActionReverse(this._target, this._actions);
        this._actions = [a];
        return this;
    }

    /**
     * 添加一个回调动作到执行队列
     * @param fn 要在动画序列中执行的回调函数
     * @returns 当前实例用于链式调用
     * @example
     * // 在动画中间触发音效
     * .to(1, { x: 100 }).call(() => audio.play()).to(1, { y: 200 })
     * 
     * // 动画结束时显示提示
     * .to(2, { angle: 360 }).call(() => tip.show('旋转完成'))
     */
    public call(fn: () => void) {
        if (fn && typeof fn === 'function')
            this._actions[this._actions.length] = new TweenActionCall(this._target, fn);
        return this;
    }

    /**
     * 将多个缓动动画按顺序串行执行（前一个完成后开始下一个）
     * @param tweens 要顺序执行的缓动实例列表
     * @returns 当前实例用于链式调用
     * @example
     * // 先移动后变色
     * .sequence(
     *     new YJTween(node).to(1, { x: 100 }),
     *     new YJTween(node).to(0.5, { color: Color.RED })
     * )
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
     * 将多个缓动动画并行执行（同时进行）
     * @param tweens 要并行执行的缓动实例列表
     * @returns 当前实例用于链式调用
     * @example
     * // 同时旋转和缩放
     * .parallel(
     *     new YJTween(node).to(1, { angle: 180 }),
     *     new YJTween(node).to(1, { scale: new Vec3(1.5, 1.5, 1) })
     * )
     */
    public parallel(...tweens: YJTween[]) {
        this._tweens = this._tweens.concat(tweens);
        return this;
    }

    /**
     * 开始执行缓动动画
     * @returns 当前实例用于链式调用
     * @example
     * // 创建并立即执行动画
     * new YJTween(node)
     *     .to(1, { x: 100 })
     *     .start()
     * 
     * // 延迟启动动画
     * setTimeout(() => tween.start(), 1000);
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
     * 停止所有缓动动作，并重置所有属性到初始值
     * @returns 当前实例用于链式调用
     * @example
     * // 点击按钮立即停止动画
     * button.onClick(() => {
     *     tween.stop()
     *         .set({ position: Vec3.ZERO }); // 重置到初始位置
     * });
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
     * @returns 当前实例用于链式调用
     * @example
     * // 点击暂停按钮时暂停动画
     * pauseButton.onClick(() => tween.pause());
     * 
     * @description 
     * - 仅在动画已经启动时生效
     * - 保持当前动画状态，下次恢复时继续执行
     */
    public pause() {
        if (this._started)
            this._paused = true;
        return this;
    }

    /**
     * 恢复被暂停的缓动动画
     * @returns 当前实例用于链式调用
     * @example
     * // 点击继续按钮恢复动画
     * resumeButton.onClick(() => tween.resume());
     * 
     * @description
     * - 需要先调用pause()进入暂停状态
     * - 从暂停时的进度继续执行动画
     */
    public resume() {
        if (this._started)
            this._paused = false;
        return this;
    }

    /**
     * 更新缓动动画逻辑
     * @param dt 时间增量（秒），通常来自游戏更新周期
     * @description
     * 1. 检查目标节点有效性（自动清理无效节点）
     * 2. 处理暂停状态
     * 3. 更新所有并行缓动（tweens）
     * 4. 执行当前序列动作（actions）
     * 5. 自动切换到下一个动作
     * 
     * @example
     * // 手动更新动画（通常由引擎自动调用）
     * tween.update(deltaTime);
     */
    public update(dt: number) {
        if (!isValid(this._target)) {
            this.clear();
            return;
        }
        if (this._paused) return;
        // 更新所有并行缓动
        for (let i = 0; i < this._tweens.length; i++) {
            this._tweens[i].update(dt);
        }
        // 处理当前序列动作
        const a = this._actions[this._actionIndex];
        if (!a) {
            this.stop();
            return;
        }
        a.update(dt);
        if (a.done) this._actionIndex++;
    }

    /**
     * 彻底清理缓动动画
     * @description
     * - 停止所有动画
     * - 清空缓动队列
     * - 释放目标引用
     * - 重置状态标志
     * 
     * @example
     * // 在场景切换时清理动画
     * onSceneUnload() {
     *     tween.clear();
     * }
     */
    public clear() {
        no.unscheduleTargetUpdateFunction(this);
        this._actions.length = 0;  // 清空动作序列
        this._tweens.length = 0;   // 清空并行缓动
        this._target = null;       // 释放节点引用
        this._paused = false;      // 重置暂停状态
    }

    /**
     * 解析并构建缓动动画序列
     * @param data 缓动配置数据，支持单个配置对象或配置数组
     * @returns 当前YJTween实例（支持链式调用）
     * 
     * @规则说明
     * - 当传入数组时，按数组顺序串行执行每个配置项
     * - 单个配置项内部（to/by/set）会并行执行
     * - 执行顺序优先级：delay > 动画属性 > reverse > repeat > callback
     * - 若同时存在reverse和repeat，先执行反向逻辑再处理重复
     * 
     * @example
     * // 串行执行两个动画配置
     * tween.parse([
     *   { duration: 1, to: { x: 100 }, delay: 0.5 },
     *   { duration: 2, by: { y: 50 }, repeat: 1 }
     * ]);
     * 
     * @example
     * // 单个配置内并行动画
     * tween.parse({
     *   duration: 1.5,
     *   to: { scale: 2 },
     *   by: { rotation: 90 },
     *   reverse: true
     * });
     */
    public parse(data: TweenDataType | TweenDataType[]) {
        if (this._target) {
            // 统一转换为数组处理
            data = [].concat(data);
            for (let i = 0; i < data.length; i++) {
                this._parse(data[i]);
            }
        }
        return this;
    }

    /**
     * 解析单个缓动配置项
     * @param data 缓动配置对象，包含以下可选参数：
     *   - delay: 前置延迟时间（秒）
     *   - duration: 动画持续时间（秒）
     *   - to: 目标值动画（需配合props或单独使用）
     *   - by: 相对值动画（需配合props或单独使用）
     *   - set: 立即设置属性值
     *   - props: 目标属性集合
     *   - easing: 缓动函数
     *   - repeat: 重复次数
     *   - reverse: 是否反向执行
     *   - callback: 完成回调
     * @returns 当前YJTween实例
     * 
     * @example
     * // 复杂动画配置示例
     * this._parse({
     *   delay: 0.3,
     *   duration: 1,
     *   props: { alpha: 1 },
     *   to: true,
     *   easing: 'quadInOut',
     *   repeat: 2,
     *   reverse: true,
     *   callback: () => console.log('完成')
     * });
     */
    private _parse(data: TweenDataType) {
        const { delay, duration, to, by, set, props, easing, repeat, reverse, callback }: TweenDataType = data;
        let a = this;
        
        // 处理前置延迟
        if (delay) a.delay(delay);
        
        // 处理属性动画（单属性模式）
        if (props) {
            if (to) {
                a.to(duration, props, easing);
            } else if (by) {
                a.by(duration, props, easing);
            } else if (set) {
                a.set(props);
            }
        } 
        // 处理多属性并行动画
        else {
            let arr: YJTween[] = [];
            // 创建并行动画序列
            if (to && typeof to == 'object') {
                arr.push(this._new().to(duration, to as PropType, easing));
            }
            if (by && typeof by == 'object') {
                arr.push(this._new().by(duration, by as PropType, easing));
            }
            if (set && typeof set == 'object') {
                arr.push(this._new().set(set as PropType));
            }
            a.parallel(...arr);
        }
        
        // 处理动画方向
        if (reverse) a.reverse();
        // 处理重复次数（需在reverse之后）
        if (repeat != null) a.repeat(repeat);
        // 添加完成回调
        if (callback) a.call(callback);
        
        return a;
    }

    /**
     * 创建新的缓动实例（工厂方法）
     * @returns 新的YJTween实例，继承当前目标节点
     * 
     * @example
     * // 创建并行动画时使用
     * const scaleTween = this._new().to(1, { scale: 2 });
     * const rotateTween = this._new().by(1, { rotation: 360 });
     * this.parallel(scaleTween, rotateTween);
     */
    private _new() {
        return YJTween.tween(this._target);
    }
}

/**
 * 缓动动作基类（所有具体缓动动作的父类）
 * 
 * @description
 * 提供基础的时间管理、方向控制和状态维护功能
 * 具体子类需实现onUpdate方法完成实际属性变化
 * 
 * @example
 * // 创建移动动作（子类实现）
 * const moveAction = new TweenActionTo(node, 1, { position: v3(100,0,0) });
 * 
 * // 在游戏循环中更新动作
 * update(dt) {
 *     if (!moveAction.done) {
 *         moveAction.update(dt);
 *     }
 * }
 */
class TweenActionBase {
    /** 目标节点 - 缓动作用的具体节点对象 */
    public readonly target: Node;
    /** 持续时间 - 动作完成所需的总时间（秒） */
    public readonly duration: number;
    /** 完成状态 - 标识动作是否已经执行完成 */
    public done: boolean;
    /** 当前时间 - 记录动作已经执行的时间（秒） */
    protected t: number;
    /** 反向标志 - 控制是否反向播放动画 */
    protected isReverse: boolean;

    /**
     * 构造函数
     * @param target 需要施加动画的节点
     * @param duration 动画持续时间（秒）
     * 
     * @example
     * // 创建基础动作（通常由子类实例化）
     * const baseAction = new TweenActionBase(this.node, 2);
     */
    constructor(target: Node, duration: number) {
        this.target = target;
        this.duration = duration;
        this.done = false; // 初始未完成
        this.t = 0;        // 从0开始计时
        this.isReverse = false; // 默认正向播放
    }

    /**
     * 更新动作状态
     * @param dt 帧时间增量（秒）
     * 
     * @description
     * 1. 检查目标节点有效性
     * 2. 根据播放方向更新当前时间
     * 3. 触发具体更新逻辑（由子类实现）
     * 
     * @example
     * // 在每帧更新中调用
     * action.update(deltaTime);
     */
    public update(dt: number) {
        // 节点失效或动作完成时直接返回
        if (!isValid(this.target) || this.done) return;
        
        // 根据播放方向更新时间
        if (!this.isReverse) {
            // 正向播放：时间累加
            this.t += dt;
            this.done = this.t >= this.duration;
        } else {
            // 反向播放：时间递减
            this.t -= dt;
            this.done = this.t <= 0;
        }
        
        // 调用子类具体实现
        this.onUpdate(dt);
    }

    /**
     * 反转动作播放方向
     * 
     * @example
     * // 实现来回移动效果
     * action.reverse().start();
     */
    public reverse() {
        this.t = this.duration; // 重置到结束时间
        this.isReverse = true;  // 标记为反向播放
        this.done = false;      // 重置完成状态
    }

    /**
     * 重置动作到初始状态
     * 
     * @example
     * // 角色死亡时重置所有动画
     * action.reset();
     */
    public reset() {
        this.t = 0;            // 重置时间
        this.isReverse = false; // 恢复正向播放
        this.done = false;      // 重置完成状态
    }

    /**
     * 更新回调（需子类实现具体动画逻辑）
     * @param dt 帧时间增量（秒）
     * 
     * @description
     * 子类需重写此方法实现：
     * - 属性插值计算
     * - 节点状态更新
     * - 特殊效果处理
     * 
     * @example
     * // 在子类中实现位置更新
     * protected onUpdate(dt: number) {
     *     const progress = this.t / this.duration;
     *     this.target.position = lerp(startPos, endPos, progress);
     * }
     */
    protected onUpdate(dt: number) { }
}

/**
 * 缓动到目标值的动作
 */
class TweenActionTo extends TweenActionBase {
    /** 
     * 缓动函数（用于计算动画进度）
     * @example
     * // 二次缓入缓出函数
     * this.easingFn = getEasingFn('quadInOut');
     */
    public readonly easingFn: EasingMethodFn;
    
    /** 
     * 原始属性配置（存储初始化时的属性参数）
     * @example
     * // 可能包含如位置、缩放等目标属性
     * { pos: [100, 200], scale: [0.5, 0.5] }
     */
    protected _originProps: PropType;
    
    /** 
     * 处理后的属性操作列表（包含具体属性类型和计算参数）
     * @structure
     * [{
     *   type: 'pos'|'scale'..., // 属性类型
     *   target: Node|Component, // 作用目标
     *   start: number[],        // 起始值
     *   cur: number[],          // 当前值
     *   increment: number[]     // 变化增量
     * }]
     */
    protected props: ActionProp[];

    /**
     * 构造目标值缓动动作
     * @param target 作用节点
     * @param duration 持续时间（秒）
     * @param props 目标属性集合
     * @param easing 缓动类型
     * @example
     * // 创建2秒移动到(200,300)的缓动
     * new TweenActionTo(node, 2, { pos: [200,300] }, 'sineIn')
     */
    constructor(target: Node, duration: number, props?: PropType, easing?: EasingType) {
        super(target, duration);
        this._originProps = props;
        // 获取对应的缓动曲线计算函数
        this.easingFn = getEasingFn(easing || EasingType.LINEAR);
    }

    /**
     * 每帧更新属性值
     * @param dt 增量时间（秒）
     * @description
     * 1. 首次调用时初始化属性参数
     * 2. 遍历所有属性进行插值计算
     * 3. 更新节点对应属性值
     * @example
     * // 在每帧渲染前被调用，更新节点位置
     * onUpdate(0.016) // 假设60FPS
     */
    protected onUpdate(dt: number) {
        // 延迟初始化属性参数（确保节点属性已准备就绪）
        if (!this.props)
            this.initProps(this._originProps);
        // 遍历所有注册属性进行更新
        for (let i = 0; i < this.props.length; i++) {
            this.updateProp(this.props[i]);
        }
    }

    /**
     * 反转动画方向（继承父类行为并扩展属性反转）
     * @example
     * // 将移动动画从终点返回起点
     * action.reverse();
     */
    public reverse() {
        super.reverse(); // 调用基类反向逻辑
        this.reverseProps(); // 执行属性值反转
    }

    /**
     * 重置动画状态（继承父类行为并扩展属性重置）
     * @example
     * // 重置到动画初始状态
     * action.reset();
     */
    public reset() {
        super.reset(); // 调用基类重置逻辑
        this.resetProps(); // 执行属性值重置
    }

    /**
     * 反转属性起止值（用于实现反向动画）
     * @description
     * - 交换起始值和当前值
     * - 用于实现往返动画效果
     * @example
     * // 将位置属性从[100,100] <-> [200,200]切换
     * reverseProps();
     */
    protected reverseProps() {
        // 待实现：交换起始值和当前值（保留代码结构供后续扩展）
        // this.props.forEach(prop => {
        //     prop.start = prop.cur.slice();
        // });
    }

    /**
     * 重置所有动画属性到初始状态
     * @description
     * - 遍历所有注册的动画属性
     * - 将当前值(cur)重置为起始值(start)
     * - 通常在动画停止/重置时调用
     * @example
     * // 当调用tween.stop()时，会触发属性重置
     * tween.stop().set({ pos: [0,0] }); // 先停止动画再强制设置新位置
     */
    protected resetProps() {
        if (this.props) {
            for (let i = 0; i < this.props.length; i++) {
                // 使用slice创建数组副本避免引用问题
                this.props[i].cur = this.props[i].start.slice();
            }
        }
    }

    /**
     * 更新单个属性的当前值并应用到目标组件
     * @param prop 属性配置对象，包含：
     *   - target: 目标组件（Node/UITransform等）
     *   - type: 属性类型（pos/angle/scale等）
     *   - start: 起始值数组
     *   - increment: 增量值数组
     *   - cur: 当前值数组（会被修改）
     * @description
     * 1. 计算缓动进度t（0-1范围）
     * 2. 根据增量值插值计算当前值
     * 3. 根据属性类型更新对应组件属性
     * @example
     * // 当duration=1，t=0.5时：
     * // pos从[0,0,0]到[200,200,0]会设置为(100,100,0)
     * // opacity从0到255会设置为127.5
     */
    private updateProp(prop: ActionProp) {
        // 计算标准化进度（已完成动画使用最终值）
        const t = this.done ? (this.isReverse ? 0 : 1) : this.easingFn(this.t / this.duration);
        
        // 线性插值计算每个分量
        for (let i = 0, n = prop.start.length; i < n; i++) {
            prop.cur[i] = prop.start[i] + (prop.increment[i] || 0) * t;
        }

        // 根据属性类型更新对应组件
        switch (prop.type) {
            case "pos":  // 3D位置
                (prop.target as Node).setPosition(v3(...prop.cur));
                break;
            case "angle": // 2D旋转角度
                (prop.target as Node).angle = prop.cur[0];
                break;
            case "rotation": // 3D旋转四元数
                (prop.target as Node).setRotation(quat(...prop.cur));
                break;
            case "scale": // 3D缩放
                (prop.target as Node).setScale(v3(...prop.cur));
                break;
            case "size": // UI尺寸
                (prop.target as UITransform).setContentSize(size(...prop.cur));
                break;
            case "anchor": // 锚点位置
                (prop.target as UITransform).setAnchorPoint(v2(...prop.cur));
                break;
            case "opacity": // 透明度
                (prop.target as UIOpacity).opacity = prop.cur[0];
                break;
        }
    }

    /**
     * 初始化动画属性配置
     * @param props 属性配置对象，格式如：
     *   { 
     *     pos: [100,200], 
     *     opacity: 255 
     *   }
     * @description
     * 1. 遍历所有属性类型
     * 2. 获取对应目标组件
     * 3. 记录初始值和目标增量
     * 4. 构建完整的属性配置列表
     * @example
     * // 初始化位置和透明度动画：
     * initProps({
     *   pos: [200, 300, 0],  // 目标位置
     *   opacity: 0           // 目标透明度
     * });
     */
    protected initProps(props: PropType) {
        this.props = [];
        if (!props) return;

        // 遍历每个属性配置项
        for (const type in props) {
            // 获取目标组件（Node/UITransform等）
            const actionTarget = this.getPropTargetByType(type),
                // 获取当前属性值（转换为数组形式）
                propValue = this.getPropValueByType(actionTarget, type),
                // 构建属性配置对象
                action: ActionProp = {
                    target: actionTarget,
                    type: type,
                    start: propValue, // 初始值
                    increment: this.propValueMinus([].concat(props[type]), propValue), // 计算增量
                    cur: propValue.slice() // 当前值（初始与start相同）
                };
            
            // 添加到属性列表
            this.props[this.props.length] = action;
        }
    }

    /**
     * 根据属性类型获取目标组件
     * @param type 属性类型字符串，支持以下类型：
     * - pos: 节点位置（Node属性）
     * - angle: 节点角度（Node属性）
     * - rotation: 节点四元数旋转（Node属性）
     * - scale: 节点缩放（Node属性）
     * - size: UI内容尺寸（UITransform组件属性）
     * - anchor: UI锚点位置（UITransform组件属性）
     * - opacity: 透明度（UIOpacity组件属性）
     * @returns 目标组件或节点
     * @example
     * // 获取位置属性对应的目标组件（节点本身）
     * getPropTargetByType('pos') // 返回 this.target
     * 
     * // 获取透明度属性对应的组件（自动添加UIOpacity组件）
     * getPropTargetByType('opacity') // 返回 UIOpacity组件实例
     */
    protected getPropTargetByType(type: string): TargetType {
        switch (type) {
            case "pos":
            case "angle":
            case "rotation":
            case "scale":
                return this.target; // 直接使用节点本身
            case "size":
            case "anchor":
                return this.target.getComponent(UITransform); // 获取UI变换组件
            case "opacity":
                // 自动添加透明度组件（如果不存在）
                return this.target.getComponent(UIOpacity) || this.target.addComponent(UIOpacity);
            default:
                return null; // 未知类型返回空
        }
    }

    /**
     * 根据属性类型获取当前属性值数组
     * @param target 目标组件/节点
     * @param type 属性类型
     * @returns 属性值数组，各类型返回格式：
     * - pos: [x, y, z]
     * - angle: [角度值]
     * - rotation: [x, y, z, w]（四元数）
     * - scale: [x, y, z]
     * - size: [宽, 高]
     * - anchor: [x轴锚点, y轴锚点]
     * - opacity: [透明度值]
     * @example
     * // 获取节点位置值
     * getPropValueByType(node, 'pos') // 返回 [0, 100, 0]
     * 
     * // 获取UI尺寸值
     * getPropValueByType(uiTransform, 'size') // 返回 [200, 300]
     */
    protected getPropValueByType(target: TargetType, type: string): number[] {
        switch (type) {
            case "pos": {
                const p = (target as Node).position;
                return [p.x, p.y, p.z]; // 三维坐标转数组
            }
            case "angle": 
                return [(target as Node).angle]; // 单值数组
            case "rotation": {
                const r = (target as Node).rotation;
                return [r.x, r.y, r.z, r.w]; // 四元数转数组
            }
            case "scale": {
                const s = (target as Node).scale;
                return [s.x, s.y, s.z]; // 三维缩放转数组
            }
            case "size": {
                const s = (target as UITransform).contentSize;
                return [s.width, s.height]; // 二维尺寸转数组
            }
            case "anchor": {
                const a = (target as UITransform).anchorPoint;
                return [a.x, a.y]; // 二维锚点转数组
            }
            case "opacity": 
                return [(target as UIOpacity).opacity]; // 单值数组
        }
    }

    /**
     * 数组元素相加（支持不同长度数组）
     * @param v1 数组1
     * @param v2 数组2
     * @returns 新数组，每个元素为两数组对应元素之和
     * @example
     * // 基础用法
     * propValueAdd([1,2], [3,4]) // 返回 [4,6]
     * 
     * // 不同长度数组
     * propValueAdd([1,2,3], [4]) // 返回 [5,2,3]
     */
    protected propValueAdd(v1: number[], v2: number[]): number[] {
        let v3: number[] = [];
        for (let i = 0; i < v1.length; i++) {
            v3[i] = v1[i] + (v2[i] || 0); // 处理长度不一致的情况
        }
        return v3;
    }

    /**
     * 数组元素相减（支持不同长度数组）
     * @param v1 被减数组
     * @param v2 减数数组
     * @returns 新数组，每个元素为v1[i] - v2[i]
     * @example
     * // 基础用法
     * propValueMinus([5,6], [2,3]) // 返回 [3,3]
     * 
     * // 不同长度数组
     * propValueMinus([5,6,7], [2]) // 返回 [3,6,7]
     */
    protected propValueMinus(v1: number[], v2: number[]): number[] {
        let v3: number[] = [];
        for (let i = 0; i < v1.length; i++) {
            v3[i] = v1[i] - (v2[i] || 0); // 处理长度不一致的情况
        }
        return v3;
    }
}

/**
 * 增量缓动动作（基于当前值的相对变化动画）
 * 
 * @description
 * 继承自TweenActionTo，实现基于当前属性值的增量动画
 * 适用于"by"类型的缓动操作（如：在当前位置基础上移动100像素）
 * 
 * @example
 * // 创建向右移动100像素的增量动画
 * new TweenActionBy(node, 1, { position: [100, 0, 0] })
 * 
 * // 组合缩放和旋转增量动画
 * new TweenActionBy(node, 2, {
 *   scale: [0.5, 0.5],
 *   rotation: [45]
 * })
 */
class TweenActionBy extends TweenActionTo {
    /**
     * 初始化增量动画属性
     * @param props 增量属性配置对象
     * 
     * @实现要点
     * 1. 遍历所有需要变化的属性
     * 2. 获取每个属性的当前值作为起始值
     * 3. 将传入的增量值转换为数值数组存储
     * 4. 创建完整的属性动画描述对象
     * 
     * @示例流程
     * // 当传入 { position: [100, 0] } 时：
     * // 1. 获取节点当前位置（如 [200, 300, 0]）
     * // 2. 存储增量值 [100, 0]
     * // 3. 动画执行时会从200→300、300→300进行变化
     */
    protected initProps(props: PropType) {
        this.props = [];
        for (const type in props) {
            const actionTarget = this.getPropTargetByType(type), // 获取属性所属组件
                propValue = this.getPropValueByType(actionTarget, type), // 获取当前属性值
                action: ActionProp = {
                    target: actionTarget,
                    type: type,
                    start: propValue, // 记录当前值为起始值
                    increment: (props[type] instanceof Array) ? props[type].slice() : [props[type]], // 存储增量值数组
                    cur: propValue.slice() // 当前值副本用于计算
                };
            this.props[this.props.length] = action;
        }
    }

    /**
     * 重置属性到动画开始前的状态
     * 
     * @实现逻辑
     * 1. 将当前值减去增量值得到原始起始值
     * 2. 用于动画重复播放时的状态重置
     * 
     * @示例
     * // 假设动画使x从100→150（增量50）
     * // 重置后起始值变为100，当前值也重置为100
     */
    protected resetProps() {
        if (this.props) {
            for (let i = 0; i < this.props.length; i++) {
                const prop = this.props[i];
                prop.start = this.propValueMinus(prop.cur, prop.increment);
            }
        }
    }

    /**
     * 反转动画属性方向
     * 
     * @实现逻辑
     * 1. 将当前值设置为新的起始值
     * 2. 用于实现反向播放动画效果
     * 
     * @示例
     * // 原动画：x从100→150（增量50）
     * // 反转后：x从150→100（增量-50）
     */
    protected reverseProps() {
        if (this.props) {
            for (let i = 0; i < this.props.length; i++) {
                this.props[i].start = this.props[i].cur.slice();
            }
        }
    }
}

/**
 * 直接设置属性值的动作（立即生效无过渡）
 * 
 * @实现原理
 * - 继承自TweenActionTo但设置duration=0实现立即生效
 * - 在初始化时直接应用目标属性值
 * 
 * @示例
 * // 立即设置节点位置和透明度
 * new TweenActionSet(node, {
 *     pos: [200, 300, 0],
 *     opacity: 128
 * });
 */
class TweenActionSet extends TweenActionTo {
    /**
     * @param target 目标节点
     * @param props 要设置的属性键值对
     */
    constructor(target: Node, props: PropType) {
        super(target, 0); // 零持续时间实现立即设置
        this._originProps = props;
    }
}

/**
 * 延迟等待动作（空操作占位）
 * 
 * @使用场景
 * - 在动画序列中插入等待间隔
 * - 配合sequence()实现分步动画
 * 
 * @示例
 * // 创建2秒延迟动作
 * new TweenActionDelay(node, 2)
 * 
 * // 在移动动画后插入1秒延迟
 * .to(1, { x: 100 }).delay(1).to(1, { y: 200 })
 */
class TweenActionDelay extends TweenActionBase { }

/**
 * 回调函数执行动作
 * 
 * @扩展能力
 * - 在动画时间轴任意位置插入自定义逻辑
 * - 支持与动画效果配合实现复杂交互
 * 
 * @示例
 * // 在动画中途触发音效
 * new TweenActionCall(node, () => {
 *     audio.play('jump_sound');
 * });
 * 
 * // 动画结束时显示提示文本
 * .call(() => {
 *     tip.show('任务完成！');
 * })
 */
class TweenActionCall extends TweenActionBase {
    private _call: () => void;

    /**
     * @param target 关联节点（用于生命周期管理）
     * @param callFn 要执行的回调函数
     */
    constructor(target: Node, callFn: () => void) {
        super(target, 0); // 零持续时间确保立即执行
        this._call = callFn;
    }

    /**
     * 每帧更新时触发回调
     * @注意 由于duration=0，实际只会执行一次
     */
    protected onUpdate(dt: number) { 
        this._call?.(); // 安全调用防止空指针
    }
}

/**
 * 重复执行动作容器
 * 
 * @特性说明
 * - 可嵌套多个子动作形成动作序列
 * - 支持正向/反向交替播放（ping-pong效果）
 * - 提供无限循环和有限次重复模式
 * 
 * @示例
 * // 创建重复3次的缩放动画（实际执行4次：1次原始 + 3次重复）
 * new TweenActionRepeat(node, [scaleAction], 3)
 * 
 * // 无限循环颜色渐变动画
 * new TweenActionRepeat(node, [colorAction], -1)
 */
class TweenActionRepeat extends TweenActionBase {
    /** 子动作列表 */
    private _actions: TweenActionBase[];
    /** 重复次数配置：-1=无限循环，0=不重复，>0=额外重复次数 */
    private _repeat: number;
    /** 当前执行的动作索引 */
    private _actionIndex: number;
    /** 剩余可重复次数 */
    private _repeatCount: number;

    /**
     * @param target 目标节点
     * @param actions 要重复的动作序列
     * @param repeat 重复模式：
     *               -1 = 无限循环
     *                0 = 不重复（只执行一次）
     *               >0 = 额外重复次数
     * 
     * @示例
     * // 创建节点闪烁动画（执行3次：初始1次 + 重复2次）
     * const blinkAction = new TweenActionTo(node, 0.5, { opacity: 0 })
     * new TweenActionRepeat(node, [blinkAction], 2)
     */
    constructor(target: Node, actions: TweenActionBase[], repeat: number) {
        super(target, 0); // 持续时间为0表示立即开始执行子动作
        this._actions = actions.slice();  // 克隆动作数组防止污染原始数据
        this._repeat = repeat;
        this._repeatCount = repeat + 1;   // 总执行次数 = 初始1次 + 重复次数
        this._actionIndex = 0;            // 从第一个动作开始执行
    }

    /**
     * 更新动画逻辑
     * @param dt 时间增量（秒）
     * @规则
     * - 跳过无效节点/已完成动作/空动作列表
     * - 实际更新逻辑在onUpdate中实现
     */
    public update(dt: number) {
        if (!isValid(this.target) || this.done || this._actions.length == 0) return;
        this.onUpdate(dt);
    }

    /**
     * 重置动作状态
     * @覆盖基类方法
     * @功能
     * - 重置重复计数器
     * - 复位动作索引
     * - 重置所有子动作
     */
    public reset() {
        super.reset();
        this._repeatCount = this._repeat + 1;
        this._actionIndex = 0;
        for (let i = 0; i < this._actions.length; i++) {
            this._actions[i].reset(); // 重置每个子动作到初始状态
        }
    }

    /**
     * 反转动画方向
     * @覆盖基类方法
     * @功能
     * - 反转所有子动作的播放方向
     * - 重置重复计数器
     * - 将动作索引指向末尾（反向播放时从最后一个动作开始）
     */
    public reverse() {
        super.reverse();
        this._repeatCount = this._repeat + 1;
        this._actionIndex = this._actions.length - 1; // 反向时从最后一个动作开始
        for (let i = 0; i < this._actions.length; i++) {
            this._actions[i].reverse(); // 反转每个子动作
        }
    }

    /**
     * 核心更新逻辑
     * @param dt 时间增量（秒）
     * @实现要点
     * 1. 获取当前需要执行的子动作
     * 2. 当子动作全部执行完成时：
     *    a. 无限循环或仍有剩余次数时：重置动作序列
     *    b. 有限次数且已用完时：标记完成
     * 3. 根据播放方向更新动作索引
     */
    protected onUpdate(dt: number) {
        const a = this._actions[this._actionIndex];
        if (!a) {
            // 处理动作序列完成后的逻辑
            if (this._repeat < 0 || --this._repeatCount > 0) {
                // 重置动作索引（根据播放方向决定起始位置）
                this._actionIndex = this.isReverse ? this._actions.length - 1 : 0;
                
                // 根据播放方向重置子动作状态
                if (this.isReverse) {
                    // 反向播放时需要反转所有子动作
                    for (let i = 0; i < this._actions.length; i++) {
                        this._actions[i].reverse();
                    }
                } else {
                    // 正向播放时重置所有子动作到初始状态
                    for (let i = 0; i < this._actions.length; i++) {
                        this._actions[i].reset();
                    }
                }
                return this.onUpdate(dt); // 递归调用处理新循环
            } else {
                // 标记整个重复动作完成
                this.done = true;
                return;
            }
        }
        
        // 执行当前子动作
        a.update(dt);
        
        // 根据播放方向更新下一个动作索引
        if (a.done)
            this._actionIndex += this.isReverse ? -1 : 1;
    }
}

/**
 * 反向执行动作容器
 * 
 * @特性说明
 * - 顺序执行内部动作序列
 * - 首次执行时正向播放动作序列
 * - 第二次执行时反向播放动作序列
 * - 执行完正反两次后自动结束
 * 
 * @示例
 * // 创建移动+旋转的组合动作
 * const move = new TweenActionTo(node, 1, { pos: [200, 0] });
 * const rotate = new TweenActionTo(node, 1, { rotation: [0, 0, 45] });
 * 
 * // 创建反向组合动作（先移动旋转，再反向执行）
 * new TweenActionReverse(node, [move, rotate])
 *     .start();
 * 
 * // 在YJTween中的使用示例：
 * YJTween.tween(node)
 *     .parse({
 *         duration: 1,
 *         props: { pos: [200, 0] },
 *         reverse: true  // 内部会自动创建TweenActionReverse
 *     })
 *     .start();
 */
class TweenActionReverse extends TweenActionBase {
    /** 存储要反向执行的子动作列表 */
    private _actions: TweenActionBase[];
    /** 当前执行的动作索引 */
    private _actionIndex: number;
    /** 剩余重复次数（初始为2次：正向1次 + 反向1次） */
    private _repeatCount: number;

    /**
     * 构造反向动作容器
     * @param target 作用的目标节点
     * @param actions 要执行的动作序列 
     * 
     * @实现说明
     * - 使用slice复制原始数组避免外部修改影响
     * - 初始重复次数设为2（正+反各一次）
     * - 继承父类时duration设为0（实际时长由子动作决定）
     */
    constructor(target: Node, actions: TweenActionBase[]) {
        super(target, 0);
        this._actions = actions.slice();  // 复制动作数组防止外部修改
        this._repeatCount = 2;  // 需要执行2次（正向+反向）
        this._actionIndex = 0;  // 从第一个动作开始
    }

    /**
     * 更新逻辑入口
     * @param dt 增量时间（秒）
     * 
     * @执行条件
     * - 目标节点有效
     * - 动作未完成
     * - 包含有效子动作
     */
    public update(dt: number) {
        if (!isValid(this.target) || this.done || this._actions.length == 0) return;
        this.onUpdate(dt);
    }

    /**
     * 重置到初始状态
     * 
     * @操作说明
     * - 重置重复计数器
     * - 重置动作索引
     * - 递归重置所有子动作
     */
    public reset() {
        super.reset();
        this._repeatCount = 2;  // 恢复完整执行次数
        this._actionIndex = 0;  // 重置到起始位置
        // 递归重置所有子动作
        for (let i = 0; i < this._actions.length; i++) {
            this._actions[i].reset();
        }
    }

    /**
     * 核心更新逻辑
     * @param dt 增量时间（秒）
     * 
     * @流程说明
     * 1. 获取当前要执行的子动作
     * 2. 当所有子动作执行完毕时：
     *    a. 如果是第一次循环结束：反转所有子动作并反向执行
     *    b. 如果是第二次循环结束：标记整个动作为完成状态
     * 3. 根据播放方向更新下一个动作索引
     */
    protected onUpdate(dt: number) {
        const a = this._actions[this._actionIndex];
        if (!a) {
            // 完成一次完整循环（正向或反向）
            if (--this._repeatCount == 1) {
                // 准备反向执行
                this.isReverse = true;  // 标记为反向模式
                this._actionIndex = this._actions.length - 1;  // 从最后一个动作开始
                // 反转所有子动作
                for (let i = 0; i < this._actions.length; i++) {
                    this._actions[i].reverse();
                }
                return this.onUpdate(dt);  // 立即开始反向执行
            } else {
                // 完成正反两次执行
                this.done = true;
                return;
            }
        }
        
        // 执行当前子动作
        a.update(dt);
        
        // 根据播放方向更新索引
        if (a.done)
            this._actionIndex += this.isReverse ? -1 : 1;  // 反向时递减，正向时递增
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
 * 获取缓动曲线计算函数
 * @param easingMethod 缓动类型枚举值，用于指定动画的缓动曲线类型
 * @returns 对应的缓动曲线计算函数，输入输出范围均为[0,1]
 * 
 * @使用说明
 * - 缓动函数将线性进度转换为非线性进度，实现各种动画效果
 * - 输入参数k是标准化时间（0-1范围），返回值是标准化进度
 * 
 * @示例
 * // 获取二次缓出函数
 * const easeOutQuad = getEasingFn(EasingType.QUAD_OUT);
 * 
 * // 在动画更新时计算进度
 * const progress = easeOutQuad(currentTime / totalDuration);
 */
export function getEasingFn(easingMethod: EasingType): EasingMethodFn {
    switch (easingMethod) {
        // 线性匀速运动（无加速）
        // 适用：机械运动、进度条加载
        case EasingType.LINEAR: return easing.linear;
        
        // 恒定值（突然变化）
        // 适用：闪烁效果、状态切换
        case EasingType.CONSTANT: return easing.constant;
        
        // 二次缓动系列
        case EasingType.QUAD_IN: return easing.quadIn;      // 加速入场（适合菜单滑入）
        case EasingType.QUAD_OUT: return easing.quadOut;    // 减速退场（适合元素淡出）
        case EasingType.QUAD_IN_OUT: return easing.quadInOut; // 对称缓动（通用过渡）
        case EasingType.QUAD_OUT_IN: return easing.quadOutIn; // 先减速后加速（特殊效果）
        
        // 三次缓动系列（比二次更强烈的加速度）
        case EasingType.CUBIC_IN: return easing.cubicIn;    // 强力加速入场（适合快速出现）
        case EasingType.CUBIC_OUT: return easing.cubicOut;  // 强力减速退场（适合弹窗关闭）
        case EasingType.CUBIC_IN_OUT: return easing.cubicInOut; // 对称强缓动
        case EasingType.CUBIC_OUT_IN: return easing.cubicOutIn; // 反向强缓动
        
        // 四次缓动系列（更剧烈的加速度）
        case EasingType.QUART_IN: return easing.quartIn;    // 急速加速（适合瞬间出现）
        case EasingType.QUART_OUT: return easing.quartOut;  // 急速减速（适合瞬间定格）
        case EasingType.QUART_IN_OUT: return easing.quartInOut; // 对称急速缓动
        case EasingType.QUART_OUT_IN: return easing.quartOutIn; // 反向急速缓动
        
        // 五次缓动系列（最强烈的加速度）
        case EasingType.QUINT_IN: return easing.quintIn;    // 爆发式加速（适合强调出现）
        case EasingType.QUINT_OUT: return easing.quintOut;  // 急刹车式减速
        case EasingType.QUINT_IN_OUT: return easing.quintInOut; // 对称爆发式缓动
        case EasingType.QUINT_OUT_IN: return easing.quintOutIn; // 反向爆发式缓动
        
        // 正弦曲线缓动（基于三角函数）
        case EasingType.SINE_IN: return easing.sineIn;      // 平滑加速（适合柔和出现）
        case EasingType.SINE_OUT: return easing.sineOut;    // 平滑减速（适合柔和消失）
        case EasingType.SINE_IN_OUT: return easing.sineInOut; // 对称正弦缓动（适合波浪效果）
        case EasingType.SINE_OUT_IN: return easing.sineOutIn; // 反向正弦缓动
        
        // 指数曲线缓动（适合模拟物理运动）
        case EasingType.EXPO_IN: return easing.expoIn;      // 指数加速（适合激光发射效果）
        case EasingType.EXPO_OUT: return easing.expoOut;    // 指数减速（适合能量聚集）
        case EasingType.EXPO_IN_OUT: return easing.expoInOut; // 对称指数缓动
        case EasingType.EXPO_OUT_IN: return easing.expoOutIn; // 反向指数缓动
        
        // 圆形曲线缓动（基于圆方程）
        case EasingType.CIRC_IN: return easing.circIn;      // 圆形加速（适合旋转入场）
        case EasingType.CIRC_OUT: return easing.circOut;    // 圆形减速（适合旋转退场）
        case EasingType.CIRC_IN_OUT: return easing.circInOut; // 对称圆形缓动
        case EasingType.CIRC_OUT_IN: return easing.circOutIn; // 反向圆形缓动
        
        // 弹跳效果系列
        case EasingType.BOUNCE_OUT: return easing.bounceOut; // 弹跳结束（适合按钮点击）
        case EasingType.BOUNCE_IN: return easing.bounceIn;  // 弹跳入场（适合欢快出现）
        case EasingType.BOUNCE_IN_OUT: return easing.bounceInOut; // 对称弹跳
        case EasingType.BOUNCE_OUT_IN: return easing.bounceOutIn; // 反向弹跳
        
        // 弹性效果系列（类似橡皮筋）
        case EasingType.ELASTIC_IN: return easing.elasticIn;  // 弹性入场（适合橡皮筋拉伸）
        case EasingType.ELASTIC_OUT: return easing.elasticOut; // 弹性退场（适合橡皮筋回弹）
        case EasingType.ELASTIC_IN_OUT: return easing.elasticInOut; // 对称弹性
        case EasingType.ELASTIC_OUT_IN: return easing.elasticOutIn; // 反向弹性
        
        // 回拉效果系列（过冲动画）
        case EasingType.BACK_IN: return easing.backIn;      // 回拉入场（适合卡片插入）
        case EasingType.BACK_OUT: return easing.backOut;    // 回拉退场（适合卡片抽出）
        case EasingType.BACK_IN_OUT: return easing.backInOut; // 对称回拉
        case EasingType.BACK_OUT_IN: return easing.backOutIn; // 反向回拉
        
        // 特殊效果
        case EasingType.SMOOTH: return easing.smooth;       // 平滑缓动（自定义曲线）
        case EasingType.FADE: return easing.fade;           // 淡入淡出效果
        
        // 默认返回线性缓动
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

    js.mixin(TweenSet.prototype, a);
    js.mixin(TweenSet, {
        /**
         * 播放缓动动画
         * @param tweenSets 如果tweenSets是Array，则按并行处理
         * @param endCall 执行完回调
         * @param target 并行时用于处理目标销毁的情况
         */
        play(tweenSets: TweenSet | TweenSet[], endCall?: () => void, target?: any) {
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

    // parseTweenData = function (data: any, node: Node): TweenSet | TweenSet[] {
    //     const _tween = new TweenSet(node);
    //     _tween.setTweenData(data);
    //     return _tween;
    // };
}