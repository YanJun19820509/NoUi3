import { no } from "@hackUi/no";
import { tween, Node, Quat, Size, Tween, UIOpacity, UITransform, Vec2, Vec3, ccclass } from "@hackUi/yj";

export enum TweenSetType {
    Node = 'node',
    Transform = 'transform',
    Opacity = 'opacity'
}
@ccclass('TweenSet')
export class TweenSet {

    protected map: any;
    private _node: Node;

    constructor(node: Node) {
        this.init(node);
    }

    /**
     * 初始化缓动集合
     * @param node 目标节点
     * @private
     * @example
     * // 创建包含节点位置、尺寸和透明度的缓动集合
     * const tweenSet = new TweenSet(someNode);
     * // 同时控制多个组件属性：
     * // - Node组件控制位置/旋转/缩放
     * // - UITransform控制尺寸/锚点
     * // - UIOpacity控制透明度
     */
    private init(node: Node) {
        this._node = node;
        this.map = {};
        this.map[TweenSetType.Node] = tween(this._node);
        this.map[TweenSetType.Transform] = this._node.getComponent(UITransform) ? tween(this._node.getComponent(UITransform)) : null;
        this.map[TweenSetType.Opacity] = this._node.getComponent(UIOpacity) ? tween(this._node.getComponent(UIOpacity)) : null;
    }

    /**
     * 启动所有缓动动画
     * @returns Promise 在所有节点缓动完成后resolve
     * @example
     * // 同时执行多个缓动并等待完成
     * await this.tweenSet.start();
     * console.log('所有动画完成');
     * 
     * // 链式动画示例
     * this.tweenSet.start().then(() => {
     *     this.playCompleteSound();
     *     this.switchToNextScene();
     * });
     */
    public start(): Promise<void> {
        return new Promise<void>(resolve => {
            for (const key in this.map) {
                let t: Tween = this.map[key];
                if (key == TweenSetType.Node) {
                    t.call(resolve).start();
                } else
                    t?.start();
            }
        }).catch(e => {
            console.error(e);
        });
    }

    /**
     * 停止所有缓动动画
     * @example
     * // 当界面需要提前销毁时停止动画
     * onDestroy() {
     *     this.tweenSet.stop();
     * }
     * 
     * // 用户快速操作时中断当前动画
     * button.onClick(() => {
     *     this.tweenSet.stop();
     *     this.playButtonEffect();
     * });
     */
    public stop() {
        for (const key in this.map) {
            let t: Tween = this.map[key];
            t?.stop();
        }
    }

    /**
     * 设置缓动动画数据
     * @param data 动画配置数据对象，包含以下属性：
     *   - delay: 延迟时间（秒）
     *   - duration: 动画持续时间（秒）
     *   - props: 动画属性配置对象
     *   - easing: 缓动函数类型
     *   - by/to/set: 动画类型（增量/目标值/立即设置）
     *   - callback: 动画完成回调
     *   - repeat: 重复次数
     * @example
     * // 基本位置动画
     * setTweenData({
     *   duration: 1,
     *   props: { pos: [100, 200] },
     *   easing: 'quadOut'
     * });
     * 
     * // 组合动画示例（旋转+缩放+透明度）
     * setTweenData({
     *   delay: 0.5,
     *   duration: 2,
     *   props: {
     *     rotation: [0, 0, 360], // XYZ旋转角度
     *     scale: 2,              // 等比缩放
     *     opacity: 0
     *   },
     *   to: true,
     *   repeat: 3
     * });
     * 
     * // 立即设置属性示例
     * setTweenData({
     *   props: {
     *     anchor: [0.5, 0.5],    // 设置锚点居中
     *     size: [200, 100]       // 设置节点尺寸
     *   },
     *   set: true
     * });
     */
    public setTweenData(data: any) {
        if (data.props != null) {
            let np: any, tp: any, op: any; // 分别存储节点属性、变换属性、透明度属性

            // 遍历所有属性配置
            for (let k in data.props) {
                let v = data.props[k];
                switch (k) {
                    case 'pos': // 位置属性（三维坐标）
                        np = np || {};
                        np['position'] = new Vec3(v[0], v[1], v[2]);
                        break;
                    case 'rotation': // 旋转属性（欧拉角转四元数）
                        np = np || {};
                        let quat: Quat = new Quat();
                        Quat.fromEuler(quat, v[0], v[1], v[2]);
                        np['rotation'] = quat;
                        break;
                    case 'scale': // 缩放属性（支持单值/二维/三维缩放）
                        np = np || {};
                        np['scale'] = new Vec3(
                            v[0] == undefined ? v : v[0],  // 处理单值缩放
                            v[1] == undefined ? (v[0] == undefined ? v : v[0]) : v[1], // 处理二维缩放
                            v[2] == undefined ? 1 : v[2]  // Z轴默认不缩放
                        );
                        break;
                    case 'angle': // 二维旋转角度（绕Z轴）
                        np = np || {};
                        np['angle'] = v;
                        break;
                    case 'size': // 尺寸属性（宽高）
                        tp = tp || {};
                        tp['contentSize'] = new Size(v[0], v[1]);
                        break;
                    case 'anchor': // 锚点属性（归一化坐标）
                        tp = tp || {};
                        tp['anchorPoint'] = new Vec2(v[0], v[1]);
                        break;
                    case 'opacity': // 透明度属性（0-255）
                        op = op || {};
                        op['opacity'] = v;
                        break;
                }
            }
            // 设置全局延迟时间
            this.setDelay(data.delay);

            // 处理没有属性变化的延迟设置
            if (!np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].delay(data.duration || 0);
            if (!tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.delay(data.duration || 0);
            if (!op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.delay(data.duration || 0);

            const easing = data.easing; // 获取缓动函数类型

            // 根据动画类型配置缓动
            if (data.by) { // 增量动画
                if (np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].by(data.duration, np, { easing: easing });
                if (tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.by(data.duration, tp, { easing: easing });
                if (op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.by(data.duration, op, { easing: easing });
            } else if (data.to) { // 目标值动画
                if (np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].to(data.duration, np, { easing: easing });
                if (tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.to(data.duration, tp, { easing: easing });
                if (op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.to(data.duration, op, { easing: easing });
            } else if (data.set) { // 立即设置属性
                if (np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].set(np);
                if (tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.set(tp);
                if (op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.set(op);
            }

            // 设置回调函数到最后一个动画属性
            this.setCallback(data.callback, np ? TweenSetType.Node : (tp ? TweenSetType.Transform : TweenSetType.Opacity));
        } else if (data.delay) {
            this.setDelay(data.delay);
        }

        // 设置动画重复次数
        this.setRepeat(data.repeat);
    }

    /**
     * 设置动画延迟时间（所有属性动画统一延迟）
     * @param v 延迟时间（秒）
     * @example
     * // 在连续动画中设置初始延迟
     * this.setDelay(0.5); // 所有动画属性延迟0.5秒执行
     */
    private setDelay(v: number) {
        if (!v) return;
        for (const key in this.map) {
            this.map[key] = this.map[key]?.delay(v);
        }
    }

    /**
     * 设置动画重复次数
     * @param v 重复次数（负数表示无限循环）
     * @example
     * // 创建心跳动画效果
     * this.setRepeat(-1); // 无限循环
     * // 创建三次闪烁效果
     * this.setRepeat(2); // 实际执行3次（初始+重复2次）
     */
    private setRepeat(v: number) {
        if (!v) return;
        if (v < 0) v = 9999;
        for (const key in this.map) {
            this.map[key] = this.map[key]?.repeat(v, this.map[key]);
        }
    }

    /**
     * 设置动画完成回调
     * @param cb 回调类型：函数 | 事件对象{type: 事件类型, args: 参数数组}
     * @param key 目标动画属性键
     * @example
     * // 动画结束时播放音效
     * this.setCallback(() => audio.play('click'), 'opacity');
     * // 动画结束时派发自定义事件
     * this.setCallback({type: 'ANIM_END', args: [this.node]}, 'position');
     */
    private setCallback(cb: any, key: string) {
        if (!cb) return;
        let callFn: any;
        if (typeof cb == 'function') callFn = cb;
        else if (typeof cb == 'object') {
            const type: string = cb.type,
                args: any[] = cb.args || [];
            callFn = () => {
                no.evn.emit(type, ...args);
            }
        };
        this.map[key] = this.map[key]?.call(callFn);
    }

    /**
     * 播放动画序列
     * @param endCall 动画全部完成后的回调
     * @example
     * // 播放动画并在结束时跳转场景
     * this.play(() => {
     *   no.scene.load('Level2');
     * });
     */
    public play(endCall?: () => void) {
        this.start().then(endCall).catch(e => { no.err(e); });
    }
}

/**
 * 解析缓动动效数据并生成动画序列
 * @param data 动效配置数据，支持以下格式：
 *            - 对象：单个动效配置
 *            - 一维数组：串行动效序列
 *            - 二维数组：外层并行，内层串行的复合动效
 * @param node 关联的目标节点（动画作用对象）
 * @returns 返回缓动动画集合，可能是单个TweenSet或并行集合数组
 * 
 * @example <caption>基本用法 - 单个动效</caption>
 * const tween = parseTweenData({
 *   duration: 1,
 *   props: { 
 *     position: [100, 200],
 *     opacity: 150
 *   },
 *   easing: 'quadOut'
 * }, node);
 * TweenSet.play(tween);
 * 
 * @example <caption>串行动效 - 一维数组</caption>
 * parseTweenData([
 *   { duration: 0.5, props: { scale: [2, 2] } },
 *   { duration: 1, props: { rotation: 90 } }
 * ], node);
 * 
 * @example <caption>并行动效 - 二维数组</caption>
 * parseTweenData([
 *   [ // 并行组1
 *     { props: { x: 100 }, repeat: 2 },
 *     { props: { angle: 45 }, easing: 'bounceOut' }
 *   ],
 *   [ // 并行组2
 *     { duration: 2, props: { size: [200, 100] } }
 *   ]
 * ], node);
 * 
 * @example <caption>完整配置示例</caption>
 * {
 *   delay: 0.5,       // 延迟时间（秒）
 *   duration: 1.2,    // 动画持续时间
 *   props: {          // 目标属性集合
 *     pos: [100, 0, 0],     // 世界坐标位置
 *     opacity: 200,         // 透明度（0-255）
 *     rotation: [0, 0, 45], // 三维旋转角度
 *     scale: 1.5,           // 缩放比例（支持数字或数组）
 *     size: [80, 120],      // 节点尺寸
 *     anchor: [0.5, 0.5]    // 锚点位置
 *   },
 *   easing: 'elasticOut', // 缓动函数
 *   repeat: 1,            // 重复次数（实际执行 repeat+1 次）
 *   callback: {           // 动画完成回调
 *     type: 'finish',     // 事件类型
 *     args: [true]        // 回调参数
 *   }
 * }
 */
export function parseTweenData(data: any, node: Node): TweenSet | TweenSet[] {
    if (!data || !node) return null;

    // 处理并行结构（二维数组）
    if (data instanceof Array && data[0] instanceof Array) {
        let parallelGroup: TweenSet[] = [];
        for (let i = 0; i < data.length; i++) {
            // 递归处理每个并行组内的串行动画
            parallelGroup = parallelGroup.concat(parseTweenData(data[i], node));
        }
        return parallelGroup;
    }
    // 处理串行结构（对象或一维数组）
    else {
        const _tween = new TweenSet(node);
        const sequenceData = [].concat(data); // 统一转为数组处理

        for (let i = 0, n = sequenceData.length; i < n; i++) {
            _tween.setTweenData(sequenceData[i]); // 依次添加串行动作
        }
        return _tween;
    }
}



/**
 * 播放缓动动画（支持并行/串行控制）
 * @param tweenSets 动画集合：单个为串行，数组元素并行执行
 * @param endCall 全部动画完成回调
 * @param target 关联目标对象（用于自动清理）
 * @example
 * // 并行执行移动和旋转动画
 * TweenSet.play([
 *   new TweenSet(node).to({position: v3(100,0,0)}),
 *   new TweenSet(node).to({angle: 360})
 * ], () => console.log('All done'));
 * 
 * // 串行执行先缩放后变色
 * TweenSet.play(
 *   new TweenSet(node)
 *     .to({scale: v3(2,2)})
 *     .to({color: Color.RED})
 * );
 */
export function TweenSetPlay(tweenSets: TweenSet | TweenSet[], endCall?: () => void, target?: any) {
    if (!tweenSets) return;
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
}

/**
 * 停止目标所有动画
 * @param target 需要停止动画的对象
 * @example
 * // 当对象销毁时停止关联动画
 * onDestroy() {
 *   TweenSet.stop(this.node);
 * }
 */
export function TweenSetStop(target: any) {
    Tween.stopAllByTarget(target);
}