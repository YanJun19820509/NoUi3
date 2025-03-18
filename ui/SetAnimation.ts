
import { ccclass, property, requireComponent, AnimationClip, Animation } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetAnimation
 * DateTime = Mon Jan 17 2022 09:59:59 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetAnimation.ts
 * FileBasenameNoExtension = SetAnimation
 * URL = db://assets/Script/NoUi3/ui/SetAnimation.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetAnimation')
@requireComponent(Animation)
/**
 * 动画控制组件
 * 
 * @功能说明
 * - 通过数据驱动方式控制动画播放
 * - 支持动态加载外部动画资源
 * - 提供完整的动画生命周期事件回调
 * - 自动管理动画资源的加载和释放
 * 
 * @使用示例
 * // 播放默认动画
 * a_setData({ name: 'idle' });
 * 
 * // 动态加载并播放动画
 * a_setData({
 *   path: 'anim/hero_run', // 动画资源路径
 *   name: 'run',           // 动画状态名称
 *   speed: 1.5,            // 播放速度
 *   repeat: 3              // 重复次数
 * });
 * 
 * // 停止动画并重置
 * a_setData({ name: 'attack', repeat: 0 });
 */
export class SetAnimation extends HackUi {
    // ======================== 动画配置属性 ========================
    /** 默认动画状态名称 */
    @property
    defaultName: string = '';
    
    /** 动画开始播放前回调（可绑定多个事件处理器） */
    @property({ type: no.EventHandlerInfo, displayName: '播放开始前的回调' })
    beforeStartHandlers: no.EventHandlerInfo[] = [];

    /** 动画播放完成后回调（可绑定多个事件处理器） */
    @property({ type: no.EventHandlerInfo, displayName: '播放完成后的回调' })
    afterEndHandlers: no.EventHandlerInfo[] = [];

    /** 动画帧事件回调（可绑定多个事件处理器） */
    @property({ type: no.EventHandlerInfo, displayName: '帧事件触发的回调' })
    eventHandlers: no.EventHandlerInfo[] = [];

    // ======================== 资源管理 ========================
    /** 需要释放的动画剪辑缓存（防止内存泄漏） */
    private needReleaseClips: AnimationClip[] = [];

    // ======================== 生命周期管理 ========================
    /**
     * 组件禁用时清理资源
     * @实现要点
     * - 移除所有动态创建的动画状态
     * - 释放动画剪辑的资源引用
     */
    onDisable() {
        let ani = this.getComponent(Animation);
        let n = this.needReleaseClips.length;
        // 倒序清理保证数组操作安全
        while (n-- > 0) {
            let clip = this.needReleaseClips.shift();
            ani.removeState(clip.name);      // 移除动画状态
            no.assetBundleManager.decRef(clip); // 释放资源引用
        }
    }

    // ======================== 数据驱动核心 ========================
    /**
     * 处理动画播放指令
     * @param data 动画参数对象 {
     *   path?: string,   // 动画资源路径（需要动态加载时）
     *   name: string,    // 动画状态名称
     *   speed?: number,  // 播放速度（默认1）
     *   repeat?: number  // 重复次数（null/-1=无限循环，0=停止）
     * }
     * 
     * @示例
     * onDataChange({
     *   path: 'anim/hero_jump',
     *   name: 'jump',
     *   speed: 2.0,
     *   repeat: 1
     * })
     */
    protected onDataChange(data: any) {
        let ani = this.getComponent(Animation);
        if (!ani.enabled) return; // 确保动画组件已启用
        
        // 解析参数（使用默认值填充缺失参数）
        let { path, name, speed, repeat } = data;
        name = name || this.defaultName;
        
        if (name) {
            // 判断是否需要加载新动画
            if (!ani.getState(name) && path) {
                this._loadClipAndPlay(path, name, speed, repeat);
            } else {
                this._play(name, speed, repeat);
            }
        }
    }

    // ======================== 动画加载逻辑 ========================
    /**
     * 加载并播放外部动画资源
     * @param path 资源路径（如'anim/hero_run'）
     * @param name 动画状态名称
     * @param speed 播放速度
     * @param repeat 重复次数
     * 
     * @实现流程
     * 1. 异步加载动画剪辑
     * 2. 创建动画状态
     * 3. 加入资源释放队列
     * 4. 执行播放逻辑
     */
    private _loadClipAndPlay(path: string, name: string, speed = 1, repeat?: number) {
        no.assetBundleManager.loadAnimationClip(path, (clip) => {
            // 校验节点有效性（防止加载完成时组件已销毁）
            if (this?.node?.isValid) {
                this.getComponent(Animation).createState(clip, name);
                this._play(name, speed, repeat);
                no.addToArray(this.needReleaseClips, clip); // 记录需释放的资源
            }
        });
    }

    // ======================== 动画控制逻辑 ========================
    /**
     * 执行动画播放
     * @param name 动画状态名称
     * @param speed 播放速度
     * @param repeat 重复次数（null/-1=无限循环，0=停止）
     * 
     * @实现特性
     * - 支持播放控制：播放/停止/重置
     * - 自动处理事件监听
     * - 灵活的循环控制
     */
    private _play(name: string, speed = 1, repeat?: number) {
        let ani: Animation = this.getComponent(Animation);
        let state = ani.getState(name);
        
        // 处理停止指令
        if (repeat == 0) {
            state?.stop();
            state?.setTime(0); // 重置播放进度
            return;
        }

        if (state) {
            // 注册动画事件监听
            ani.on(Animation.EventType.PLAY, this.onPlay, this);
            ani.on(Animation.EventType.FINISHED, this.onFinished, this);
            
            // 配置循环参数
            if (repeat == null || repeat == -1) repeat = 999;
            state.wrapMode = AnimationClip.WrapMode.Loop;
            state.repeatCount = repeat;
            state.speed = speed;
            state.play();
        }
    }

    // ======================== 事件回调 ========================
    /** 动画开始播放时触发 */
    private onPlay() {
        no.EventHandlerInfo.execute(this.beforeStartHandlers);
    }

    /** 动画播放完成时触发（单次循环结束时也会触发） */
    private onFinished() {
        no.EventHandlerInfo.execute(this.afterEndHandlers);
    }

    /**
     * 处理动画帧事件
     * @param v 事件参数（可从动画剪辑中派发自定义事件）
     * 
     * @使用示例
     * // 在动画剪辑中添加帧事件：
     * animationClip.emitEvent(0.5, 'attackFrame', { damage: 100 })
     * // 在组件中接收：
     * onFrameEvent({ event: 'attackFrame', data: { damage: 100 } })
     */
    public onFrameEvent(v: any): void {
        no.EventHandlerInfo.execute(this.eventHandlers, v);
    }
}
