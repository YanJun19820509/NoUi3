
import { Component, Animation, AnimationClip, ccclass, property, requireComponent, WrapMode } from '../../yj';
import { no } from '../../no';
import { YJTempData } from '../../YJTempData';

/**
 * Predefined variables
 * Name = YJPlayAnimation
 * DateTime = Thu Aug 11 2022 12:14:03 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPlayAnimation.ts
 * FileBasenameNoExtension = YJPlayAnimation
 * URL = db://assets/common/base/ani/YJPlayAnimation.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 * 
 */

@ccclass('YJPlayAnimation')
@requireComponent(Animation)
export class YJPlayAnimation extends Component {
    @property({
        tooltip: '节点激活时自动播放动画',
        displayName: '激活时播放'
    })
    playOnNodeActive: boolean = false;

    @property({
        visible() { return this.playOnNodeActive; },
        tooltip: '是否只播放一次（仅在激活时播放生效时可用）',
        displayName: '单次播放'
    })
    playOnce: boolean = false;

    @property({
        displayName: '播放完成后回到第0帧',
        tooltip: '动画播放结束后是否重置到初始状态'
    })
    backOnEnd: boolean = false;

    @property({
        type: no.EventHandlerInfo,
        displayName: '播放开始前的回调',
        tooltip: '动画开始播放前触发的事件回调'
    })
    beforeStartHandlers: no.EventHandlerInfo[] = [];

    @property({
        type: no.EventHandlerInfo,
        displayName: '播放完成后的回调',
        tooltip: '动画完全播放完成后触发的事件回调'
    })
    afterEndHandlers: no.EventHandlerInfo[] = [];

    @property({
        type: no.EventHandlerInfo,
        displayName: '帧事件触发的回调',
        tooltip: '动画关键帧事件触发时的回调（需要动画中添加事件标记）'
    })
    eventHandlers: no.EventHandlerInfo[] = [];

    private _played: boolean = false;

    /**
     * 节点激活时自动播放逻辑
     * @example
     * 当playOnNodeActive为true时：
     * - playOnce为false时每次激活都会播放
     * - playOnce为true时只在第一次激活时播放
     */
    onEnable() {
        if (this.playOnNodeActive) {
            if (!this.playOnce || (this.playOnce && !this._played)) {
                this._played = true;
                this.play();
            }
        }
    }

    /**
     * 播放动画核心方法
     * @param wrapMode 动画播放模式（可选）
     * @example 
     * // 普通播放
     * play();
     * // 指定循环模式
     * play(AnimationClip.WrapMode.Loop);
     * 
     * @implementationNote 
     * 1. 获取动画组件并检查动画片段
     * 2. 注册播放开始和结束事件监听
     * 3. 如果动画状态未就绪则延迟重试
     * 4. 应用播放模式并开始播放
     */
    public play(wrapMode?: WrapMode) {
        let ani = this.getComponent(Animation);
        if (ani.clips.length == 0) return;
        let state = ani.getState(ani.clips[0].name);
        if (!state) {
            if (!YJTempData.hasFun('YJPlayAnimation.play')) {
                YJTempData.fun('YJPlayAnimation.play', (wrapMode?: WrapMode) => {
                    this.play(wrapMode);
                });
            }
            this.scheduleOnce(() => YJTempData.runFun('YJPlayAnimation.play', wrapMode));
            return;
        }
        YJTempData.clearFun('YJPlayAnimation.play');
        ani.on(Animation.EventType.PLAY, this.onPlay, this);
        ani.on(Animation.EventType.FINISHED, this.onFinished, this);
        if (wrapMode != undefined)
            state.wrapMode = wrapMode;
        state.play();
    }

    /**
     * 停止动画并重置到初始状态
     * @example
     * // 停止当前动画并回到第0帧
     * stop();
     */
    public stop() {
        let ani = this?.getComponent(Animation);
        ani?.getState(ani?.clips[0]?.name)?.stop();
        this.backTo0();
    }

    /**
     * 设置动画播放时间轴位置
     * @param t 时间(秒)
     * @example
     * // 跳转到动画第2秒
     * setTime(2);
     */
    public setTime(t: number) {
        let ani = this?.getComponent(Animation);
        let state = ani?.getState(ani.defaultClip.name);
        state?.setTime(t);
        state?.sample();
    }

    /**
     * 重置动画到初始状态
     * @example
     * // 重置角色待机动画
     * backTo0();
     */
    public backTo0() {
        this.setTime(0);
    }

    /**
     * 标准单次播放模式
     * @example
     * // 播放攻击动画一次
     * normalPlay();
     */
    public normalPlay() {
        this.play(AnimationClip.WrapMode.Normal);
    }

    /**
     * 循环播放动画（无限循环模式）
     * @example
     * // 循环播放角色待机动画
     * this.loopPlay();
     */
    public loopPlay() {
        this.play(AnimationClip.WrapMode.Loop);
    }

    /**
     * 循环反向播放动画（从最后一帧开始循环倒放）
     * @example
     * // 倒放跑步动画循环
     * this.loopReversePlay();
     */
    public loopReversePlay() {
        this.play(AnimationClip.WrapMode.LoopReverse);
    }

    /**
     * 来回循环播放动画（正向播放完成后反向播放，循环往复）
     * @example
     * // 播放角色呼吸动画
     * this.pingPongPlay();
     */
    public pingPongPlay() {
        this.play(AnimationClip.WrapMode.PingPong);
    }

    /**
     * 来回循环反向播放动画（先反向播放再正向播放，循环往复）
     * @example
     * // 实现钟摆动画效果
     * this.pingPongReversePlay();
     */
    public pingPongReversePlay() {
        this.play(AnimationClip.WrapMode.PingPongReverse);
    }

    /**
     * 反向单次播放动画（从最后一帧播放到第一帧后停止）
     * @example
     * // 播放武器收起动画
     * this.reversePlay();
     */
    public reversePlay() {
        this.play(AnimationClip.WrapMode.Reverse);
    }

    /**
     * 动画开始播放时的回调
     * @example
     * // 在动画开始时播放音效
     * this.beforeStartHandlers.push(new no.EventHandlerInfo(音效组件, 'play'));
     */
    private onPlay() {
        no.EventHandlerInfo.execute(this.beforeStartHandlers);
    }

    /**
     * 动画播放完成时的回调
     * @example
     * // 在动画结束时显示完成提示
     * this.afterEndHandlers.push(new no.EventHandlerInfo(提示组件, 'show'));
     */
    private onFinished() {
        if (this.backOnEnd) this.backTo0();
        no.EventHandlerInfo.execute(this.afterEndHandlers);
    }

    /**
     * 动画帧事件回调（需在动画剪辑中配置事件点）
     * @param v 帧事件参数（可传递自定义事件数据）
     * @example
     * // 在攻击关键帧触发伤害判定
     * this.eventHandlers.push(new no.EventHandlerInfo(战斗系统, 'applyDamage'));
     */
    public onFrameEvent(v: any): void {
        no.EventHandlerInfo.execute(this.eventHandlers, v);
    }
}
