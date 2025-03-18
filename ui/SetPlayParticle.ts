
import { ccclass, property, menu, ParticleSystem, ParticleSystem2D } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetPlayParticle
 * DateTime = Mon Jan 17 2022 12:03:10 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPlayParticle.ts
 * FileBasenameNoExtension = SetPlayParticle
 * URL = db://assets/Script/NoUi3/ui/SetPlayParticle.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetPlayParticle')
@menu('NoUi/ui/SetPlayParticle(粒子播放控制:bool)')
export class SetPlayParticle extends HackUi {
    /**
     * 是否在组件启用时自动播放
     * @default false
     * @example 
     * // 在属性检查器中勾选此选项
     * // 当节点激活时会自动播放粒子效果
     */
    @property
    playOnEnable: boolean = false;

    /**
     * 粒子播放完成回调事件列表
     * @type {no.EventHandlerInfo[]}
     * @example
     * // 配置示例：
     * [{
     *   target: 目标节点,
     *   component: "组件名",
     *   handler: "回调方法名",
     *   customEventData: "自定义数据"
     * }]
     */
    @property({ type: no.EventHandlerInfo, displayName: '播放完回调' })
    endCalls: no.EventHandlerInfo[] = [];

    /**
     * 组件启用时触发
     * @实现逻辑 如果开启自动播放则立即执行播放
     */
    onEnable() {
        this.playOnEnable && this._play();
    }

    /**
     * 数据驱动播放控制
     * @param data 控制参数：
     * - true/truthy: 播放粒子
     * - false/falsy: 停止粒子
     * @example
     * // 播放粒子
     * this.node.emit('data', true);
     * // 停止粒子
     * this.node.emit('data', false);
     */
    protected onDataChange(data: any) {
        if (Boolean(data)) this._play();
        else this._stop();
    }

    /**
     * 执行粒子播放逻辑
     * @实现说明
     * 1. 优先处理2D粒子系统
     * 2. 对非循环播放的粒子设置完成回调
     * 3. 使用scheduleOnce实现定时回调
     */
    private _play() {
        // 获取粒子组件引用（优先获取2D粒子组件）
        let p: ParticleSystem2D | ParticleSystem = this.getComponent(ParticleSystem2D);
        if (p) {
            p.resetSystem(); // 2D粒子系统重启
        } else {
            p = this.getComponent(ParticleSystem);
            p.play(); // 3D粒子系统播放
        }
        // 处理非循环播放的情况（duration为-1表示循环播放）
        if (p.duration > -1) {
            this.scheduleOnce(this._onEnd, p.duration);
        }
    }

    /**
     * 停止粒子播放逻辑
     * @实现说明
     * 1. 区分处理2D/3D粒子系统
     * 2. 取消未触发的完成回调
     */
    private _stop() {
        let p: ParticleSystem2D | ParticleSystem = this.getComponent(ParticleSystem2D);
        if (p) {
            p.stopSystem(); // 2D粒子系统停止
        } else {
            p = this.getComponent(ParticleSystem);
            p.stop(); // 3D粒子系统停止
        }
        this.unschedule(this._onEnd); // 取消预定回调
    }

    /**
     * 粒子播放完成回调
     * @实现说明 执行所有注册的完成回调事件
     */
    private _onEnd() {
        no.EventHandlerInfo.execute(this.endCalls);
    }

    /**
     * 公开的播放接口
     * @example
     * // 通过代码直接调用播放
     * this.getComponent(SetPlayParticle).a_play();
     */
    public a_play() {
        this._play();
    }

    //todo 对循环播放的考虑按需暂停
    // public setParticleEnable(v: boolean) {
    //     let p = this.getComponent(ParticleSystem2D) || this.getComponent(ParticleSystem);
    //     if (v) {
    //         p.enabled = this.isParticleEnable;
    //     } else {
    //         this.isParticleEnable = p.enabled;
    //         p.enabled = false;
    //     }
    // }
}
