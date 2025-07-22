import { ccclass, property, menu, Skeleton, requireComponent, sys, size, EDITOR, isValid, Node, SpineSocket } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';
import { YJSpineManager } from '../base/YJSpineManager';

/**
 * Predefined variables
 * Name = SetSpine
 * DateTime = Mon Jan 17 2022 14:32:44 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpine.ts
 * FileBasenameNoExtension = SetSpine
 * URL = db://assets/Script/common/ui/SetSpine.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 * data:{path, skin, animation, loop, timeScale, loopNum, startEvent, endEvent, eventParam}|[{path, skin, animation, loop, timeScale, startEvent, endEvent, eventParam},...]
 * 支持动画链
 */

@ccclass('SocketInfo')
export class SocketInfo {
    @property
    path: string = '';
    @property({ type: Node })
    node: Node = null;

    constructor(path: string, target: Node) {
        this.path = path;
        this.node = target;
    }
}

@ccclass('SetSpine')
@menu('NoUi/ui/SetSpine(设置spine动画)')
@requireComponent(Skeleton)
/**
 * 设置spine动画
 * data:{path, skin, animation, loop, timeScale, loopNum, startEvent, endEvent, eventParam}|[{path, skin, animation, loop, timeScale, startEvent, endEvent, eventParam},...]
 * 支持动画链
 */
export class SetSpine extends HackUi {

    // 是否在组件启用时自动播放动画（例如：组件初始化或重新激活时自动播放）
    @property
    autoPlayOnEnable: boolean = false;

    // Spine资源路径（示例值："spine/hero"，对应spine/hero.json）
    @property
    spineUrl: string = '';

    // 自动播放的动画名称（当autoPlayOnEnable为true时可见，示例："idle"）
    @property({ visible() { return this.autoPlayOnEnable; } })
    animationName: string = '';

    // 触发开始回调的动画索引（示例："0,2" 表示第1个和第3个动画会触发开始回调）
    @property({ displayName: '支持开始回调的下标', tooltip: '当有动画播放队列时，可指定队列中某些下标的动画在开始播放时执行回调，多个下标用逗号分隔' })
    startIndexes: string = '';

    // 动画开始事件处理器（示例：在动画开始时播放音效）
    @property({ type: no.EventHandlerInfo, displayName: '动画播放开始回调' })
    startCall: no.EventHandlerInfo = new no.EventHandlerInfo();

    // 触发结束回调的动画索引（示例："1,3" 表示第2个和第4个动画会触发结束回调）
    @property({ displayName: '支持结束回调的下标', tooltip: '当有动画播放队列时，可指定队列中某些下标的动画在结束播放时执行回调，多个下标用逗号分隔' })
    endIndexes: string = '';

    // 动画结束事件处理器（示例：在动画结束时切换界面）
    @property({ type: no.EventHandlerInfo, displayName: '动画播放结束回调' })
    endCall: no.EventHandlerInfo = new no.EventHandlerInfo();

    // 是否需要在切换动画时清空轨道（用于解决某些动画切换异常问题）
    @property({ tooltip: '当两个动作切换出现异常时，可尝试勾选' })
    needClearTracks: boolean = true;

    @property({ tooltip: '当disable时是否销毁spine' })
    canDisable: boolean = true;

    @property({ tooltip: '使用节点size，不使用spine默认size' })
    useNodeSize: boolean = false;
    @property({ type: SocketInfo })
    scokets: SocketInfo[] = [];

    @property
    get sync(): boolean {
        return false;
    }

    set sync(v: boolean) {
        // 获取当前节点的Spine组件
        const spine = this.getComponent(Skeleton);

        // 检查是否需要自动获取资源路径
        if (spine.skeletonData) {
            // 通过UUID异步获取资源路径（示例：'db://assets/spine/hero.json'）
            no.EditorMode.getAssetUrlByUuid(spine.skeletonData._uuid).then(url => {
                if (!url) return;

                // 处理资源路径格式（示例：'spine/hero'）
                this.spineUrl = url.replace('db://assets/', '').replace('.json', '');

                // 记录当前动画名称（示例：'idle'或'attack'）
                this.animationName = spine.animation;
            });
        }
        if (spine.sockets.length) {
            this.scokets = [];
            for (let i = 0; i < spine.sockets.length; i++) {
                this.scokets.push(new SocketInfo(spine.sockets[i].path, spine.sockets[i].target));
            }
        }
    }

    /** 
     * 全局性能开关 - 低帧率时禁用Spine动画
     * （设置为true时，当帧率低于45帧会自动禁用spine渲染）
     */
    public static disableSpineWhenLowFPS: boolean = false;

    // 当前使用的Spine资源路径（示例："spine/hero"）
    curPath: string;
    // 是否因全屏界面隐藏
    private isFullScreenHide: boolean = false;
    // 动画播放队列（示例：[{path:"spine/hero", animation:"attack"}, {path:"spine/effect", animation:"burst"}]）
    private spineQueue: any[];
    // 当前播放的队列索引
    private queueIndex: number = 0;
    // 全局缩放比例（微信小游戏等平台可能需要特殊处理）
    private GlobalScale: number = 1;
    // 初始缩放比例（用于重置操作）
    private defaultScale: number = 1;
    // 循环次数（用于动画链的循环控制）
    private loopNum: number = 0;
    // 处理后的开始回调索引数组（示例：["0","2"]）
    private _startIndexes: string[];
    // 处理后的结束回调索引数组（示例：["1","3"]）
    private _endIndexes: string[];
    // 当前控制的Spine组件实例
    private _curSpine: Skeleton;
    //动画播放开始广播的事件
    private _startEvent: string;
    //动画播放结束广播的事件
    private _endEvent: string;
    //事件参数
    private _eventParam: any;


    //性能判断
    // private checkFPS(dt: number) {
    //     if (SetSpine.disableSpineWhenLowFPS) {
    //         const fps = 1 / dt;
    //         if (fps < 45 && this.canSetSpine) {
    //             this.canSetSpine = false;
    //             this.getComponent(Skeleton).enabled = false;
    //         } else if (fps > 55 && !this.canSetSpine) {
    //             this.canSetSpine = true;
    //         }
    //     }
    // }

    /**
     * 组件启用时的处理
     * 功能说明：
     * - 微信小游戏平台设置全局缩放比例
     * - 禁用基础Spine组件（使用动态创建的实例）
     * - 根据自动播放配置初始化动画
     * @示例 
     * 当组件启用时自动播放默认动画：
     * this.autoPlayOnEnable = true
     */
    onEnable() {
        if (EDITOR) return;
        // 微信小游戏平台特殊处理（性能优化）
        if (sys.platform == sys.Platform.WECHAT_GAME)
            this.GlobalScale = .5;
        // 获取基础Spine组件并禁用（使用动态创建的实例）
        let spine = this.getComponent(Skeleton);
        spine.enabled = false;
        // 自动播放配置检查
        if (this.autoPlayOnEnable) {
            // 触发数据变化事件初始化动画（参数格式示例）
            this.onDataChange({
                path: this.curPath,       // 资源路径 
                animation: this.animationName, // 默认动画名称
                loop: spine.loop          // 是否循环
            });
        }
    }

    /**
     * 组件禁用时的清理操作
     * 功能说明：
     * - 根据配置清理动画轨道
     * - 销毁Spine实例节点
     * @规则：
     * - canDisable=false时跳过清理（用于临时禁用）
     * @示例 
     * 需要保留Spine实例时：
     * this.canDisable = false
     */
    onDisable() {
        if (EDITOR) return;
        if (!this.canDisable) return;
        let spine = this._curSpine;
        if (!spine) return;
        // 清理动画轨道（非缓存模式时）
        this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
        // 销毁Spine节点释放资源
        spine.node?.destroy();
    }

    /**
     * 组件销毁时的资源释放
     * 功能说明：
     * - 通过资源管理器释放当前Spine资源
     * @示例 
     * 当切换场景时自动调用释放资源
     */
    onDestroy() {
        YJSpineManager.ins.set(this.curPath);
    }

    /**
     * 数据驱动动画更新
     * @param data 动画配置数据，支持格式：
     * - 对象格式：{ 
     *     path: 'spine/hero',  // 资源路径（可选）
     *     animation: 'attack', // 动画名称
     *     loop: true           // 是否循环
     *   }
     * - 队列格式：[{...}, {...}] 按顺序执行的动画配置
     * @规则：
     * - 微信平台强制使用0.5缩放比例
     * - startIndexes/endIndexes用逗号分隔字符串转数组
     * @示例
     * 播放攻击动画：
     * this.a_setData({ animation: 'attack', loop: false })
     */
    protected onDataChange(data: any) {
        // 微信平台缩放设置
        if (sys.platform == sys.Platform.WECHAT_GAME && this.GlobalScale != .5)
            this.GlobalScale = .5;
        // 转换起始/结束索引配置
        if (this.startIndexes)
            this._startIndexes = this.startIndexes.split(','); // 示例："0,1,2" => [0,1,2]
        if (this.endIndexes)
            this._endIndexes = this.endIndexes.split(',');
        // 初始化动画队列
        this.spineQueue = [].concat(data); // 支持数组和对象格式
        this.queueIndex = -1;
        this.setSpineData();
    }

    // 修改销毁节点的通用方法
    private destroySpineNode(spine: Skeleton, path = this.curPath) {
        if (!spine) return;
        this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
        // 在销毁节点前更新引用计数
        if (this.curPath && isValid(spine?.node, true)) {
            YJSpineManager.ins.set(path);
        }
        spine.node?.destroy();
    }

    /**
     * 设置Spine动画数据核心方法
     * @功能说明：
     * 1. 处理动画队列数据
     * 2. 管理Spine资源加载与释放
     * 3. 控制动画播放逻辑
     * @示例
     * // 播放新资源动画
     * setSpineData({ path: 'spine/hero', animation: 'run' })
     * // 仅切换动画（使用现有资源）
     * setSpineData({ animation: 'attack', loop: true })
     */
    private setSpineData() {
        // 从队列获取当前动画配置
        const data = this.spineQueue[++this.queueIndex];
        if (!data) return;

        // 解构配置参数（带默认值）
        let { path, skin, animation, loop, timeScale, loopNum, pause, duration, startEvent, endEvent, eventParam }: {
            path: string,
            skin: string,
            animation: string,
            loop: boolean,
            timeScale: number,
            loopNum: number,
            pause: boolean,
            duration: number,
            startEvent: string,
            endEvent: string
            eventParam: any
        } = data;

        let spine = this._curSpine;

        // 清理逻辑：当没有指定路径和动画时销毁现有spine
        if (!path && !animation) {
            if (!spine) return;
            // 示例：当传入{animation: null}时清除当前动画
            this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
            spine.node?.destroy();
            return;
        }

        // 使用默认spineUrl路径（当未指定path且当前没有加载过资源时）
        if (!path && !this.curPath && this.spineUrl) {
            path = this.spineUrl;
        }

        // 资源路径变更时释放旧资源
        if (path && this.curPath && this.curPath != path) {
            YJSpineManager.ins.set(this.curPath);
        }
        this._startEvent = startEvent;
        this._endEvent = endEvent;
        this._eventParam = eventParam || animation;
        // 需要加载新资源的情况
        if (!spine?.isValid || (path && this.curPath != path)) {
            if (!path) path = this.curPath;

            // 异步加载spine资源
            YJSpineManager.ins.get(path).then(res => {
                if (!res) {
                    no.err(`spine资源${path}不存在`);
                    return;
                }
                // 组件有效性检查
                if (!isValid(this.node, true)) {
                    this.destroySpineNode(this._curSpine, path);
                    return;
                }

                this.curPath = path;

                // 销毁旧spine节点（异步加载后需要重新获取引用）
                this.destroySpineNode(this._curSpine);

                // 创建新spine节点
                const newSpineNode = no.newNode('spine', [Skeleton]);
                newSpineNode.layer = this.node.layer;
                newSpineNode.parent = this.node;
                const spine = newSpineNode.getComponent(Skeleton);
                this._curSpine = spine;

                // 继承基础spine组件属性
                const bSpine = this.getComponent(Skeleton);
                spine.customMaterial = bSpine.customMaterial;
                this.defaultScale = bSpine.timeScale;
                spine.premultipliedAlpha = bSpine.premultipliedAlpha;
                spine.defaultCacheMode = bSpine.defaultCacheMode;
                // spine.enableBatch = bSpine.enableBatch;

                // 设置骨骼数据
                spine.skeletonData = res;
                if (this.scokets.length) {
                    for (let i = 0, n = this.scokets.length; i < n; i++) {
                        const { path, node } = this.scokets[i];
                        spine.sockets.push(new SpineSocket(path, node));
                    }
                    spine.sockets = spine.sockets;
                }
                // 时间缩放计算（全局缩放系数 * 配置缩放系数）
                spine.timeScale = ((timeScale || bSpine.timeScale) * this.GlobalScale);

                // 自动设置节点尺寸
                const width = res.getRuntimeData().width;
                const height = res.getRuntimeData().height;
                if (!this.useNodeSize) {
                    if (width > 0 && height > 0) {
                        no.size(this.node, size(width, height));
                    }
                } else {
                    const nodeSize = no.size(this.node);
                    newSpineNode.setScale(nodeSize.width / width, nodeSize.height / height);
                }

                // 构建动画标识（皮肤:动画名）
                let tempStr = (skin ? (skin + ':') : '') + animation;

                // 播放控制逻辑
                if (pause) {
                    this.a_pause(tempStr); // 示例：暂停动画
                } else if (loop) {
                    this.a_playLoop(tempStr); // 示例：循环播放
                } else if (loopNum > 1) {
                    this.loopNum = loopNum;
                    this.playLoopNum(tempStr); // 示例：指定次数循环
                } else {
                    this.a_playOnce(tempStr); // 示例：单次播放
                }

                this.playDuration(duration); // 设置播放时长限制
            });
        } else if (animation != null) { // 使用现有资源播放动画
            if (!spine) return;
            spine.node.active = true;
            // 时间缩放计算（使用默认值或当前配置值）
            spine.timeScale = ((timeScale || this.defaultScale) * this.GlobalScale);

            let tempStr = (skin ? (skin + ':') : '') + animation;
            if (pause) {
                this.a_pause(tempStr);
            } else if (loop) {
                this.a_playLoop(tempStr);
            } else if (loopNum > 1) {
                this.loopNum = loopNum;
                this.playLoopNum(tempStr);
            } else {
                this.a_playOnce(tempStr);
            }
            this.playDuration(duration);
        } else { // 无有效动画配置时
            this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
            spine.enabled = false; // 禁用组件
        }
    }

    /**
     * 播放指定次数的循环动画
     * @param animation 动画标识（格式：皮肤名:动画名 或 动画名）
     * @example
     * // 播放"skin1:attack"动画3次
     * this.loopNum = 3;
     * this.playLoopNum("skin1:attack");
     */
    private playLoopNum(animation: string) {
        if (!animation) return;
        // 解析皮肤和动画名称（格式：皮肤名:动画名）
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;

        const spine = this._curSpine;
        // 处理轨道清理（仅当组件已启用且需要清理时）
        if (spine.enabled)
            this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
        else
            spine.enabled = true; // 激活组件

        spine.loop = false; // 禁用自动循环
        !!skin && spine.setSkin(skin); // 设置皮肤（如果存在）

        this.bindStartCall(spine); // 绑定开始回调

        // 循环次数控制逻辑
        this.loopNum--;
        if (this.loopNum == 0)
            this.bindEndCall(spine); // 最后一次播放绑定结束回调
        else
            this.bindLoop1EndCall(spine); // 非最后一次绑定循环结束回调

        this._play(spine, name, false); // 执行播放
    }

    /**
     * 设置播放时长限制
     * @param duration 持续时间（单位：秒）
     * @example
     * // 5秒后自动停止当前动画
     * this.playDuration(5);
     */
    private playDuration(duration: number) {
        if (!duration) return;
        // 使用定时器实现时长控制
        this.scheduleOnce(() => {
            const spine = this._curSpine;
            spine.clearTrack(0); // 清理轨道0
            spine.loop = false; // 确保停止循环
            this?.endCall.execute(spine); // 执行结束回调
            this.emitEndEvent();
            this.setSpineData(); // 重置spine数据
        }, duration);
    }

    /**
     * 单次播放动画
     * @param e 事件对象或动画字符串
     * @param animation 动画标识（可选，格式：皮肤名:动画名）
     * @example
     * // 单次播放"jump"动画
     * this.a_playOnce("jump");
     * 
     * // 单次播放"skin2:run"动画
     * this.a_playOnce("skin2:run");
     */
    public a_playOnce(e: any, animation?: string) {
        animation = animation || e;
        if (!animation) return;
        // 解析皮肤和动画名称
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;

        const spine = this._curSpine;
        // 处理轨道清理（仅当组件已启用且需要清理时）
        if (spine.enabled)
            this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
        else
            spine.enabled = true; // 激活组件

        spine.loop = false; // 单次播放模式
        !!skin && spine.setSkin(skin); // 设置皮肤（如果存在）

        this.bindStartCall(spine); // 动画开始回调
        this.bindEndCall(spine); // 动画结束回调
        this._play(spine, name, false); // 执行播放
    }

    /**
     * 循环播放指定动画
     * @param e 事件对象或动画字符串
     * @param animation 动画标识（格式：皮肤名:动画名 或 动画名）
     * @example 
     * // 循环播放"run"动画
     * this.a_playLoop("run");
     * 
     * // 使用指定皮肤循环播放"skin1:walk"动画
     * this.a_playLoop("skin1:walk");
     */
    public a_playLoop(e: any, animation?: string) {
        animation = animation || e;
        if (!animation) return;
        // 解析皮肤和动画名称（格式：皮肤名:动画名）
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;

        const spine = this._curSpine;
        // 处理轨道清理（仅当组件已启用且需要清理时）
        if (spine.enabled)
            this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
        else
            spine.enabled = true; // 激活组件

        spine.loop = true; // 循环播放模式
        !!skin && spine.setSkin(skin); // 设置皮肤（如果存在）

        this._play(spine, name, true); // 执行播放
    }

    /**
     * 实际执行动画播放的核心方法
     * @param spine 骨骼动画组件实例
     * @param animationName 要播放的动画名称
     * @param loop 是否循环播放
     * @规则：
     * - 检查Spine功能是否启用
     * - 验证动画数据是否存在
     * - 检查节点激活状态
     * - 最终设置动画
     * @example
     * // 当节点未激活时输出警告：
     * "spine节点player未在场景中激活"
     */
    private _play(spine: Skeleton, animationName: string, loop: boolean) {
        if (!no.spineEnable()) return;

        // 检查动画数据是否存在
        if (!spine.isAnimationCached() && !spine.skeletonData) {
            no.warn(`spine节点${spine.node.name}没有动画数据  this.curPath ${this.curPath}`);
            return;
        }

        // 检查节点层级激活状态
        if (!spine?.node?.activeInHierarchy) {
            no.warn(`spine节点${spine.node.name}未在场景中激活  this.curPath ${this.curPath}`);
            return;
        }

        // 检查节点自身激活状态
        if (!spine?.node?.active) {
            no.warn(`spine节点${spine.node.name}自身未激活  this.curPath ${this.curPath}`);
            return;
        }

        // 设置动画到轨道0
        if (spine?._skeleton?.data) {
            spine.setAnimation(0, animationName, loop);
        }
    }

    /**
     * 停止当前动画并销毁节点
     * @example
     * // 停止当前动画并释放资源
     * this.a_stop();
     */
    public a_stop(): void {
        const spine = this._curSpine;
        spine?.clearTrack(0); // 清理当前轨道动画
        spine?.node?.destroy(); // 销毁节点释放资源
    }

    /**
     * 暂停当前动画并准备新动画
     * @param e 事件对象或动画名称
     * @param animation 可选动画名称（格式："皮肤:动画名"）
     * @规则：
     * - 支持两种参数格式：直接传动画名称 或 事件对象+动画名称
     * - 当需要切换皮肤时使用"皮肤:动画名"格式
     * - 会重置动画轨道并停止循环
     * @示例 
     * // 暂停并准备idle动画
     * this.a_pause('idle');
     * // 暂停并准备hero皮肤的attack动画
     * this.a_pause('hero:attack');
     */
    public a_pause(e: any, animation?: string): void {
        // 参数处理：支持事件对象或直接传动画名称
        animation = animation || e;
        if (!animation) return;

        // 解析皮肤和动画名称（格式："皮肤:动画名"）
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;

        const spine = this._curSpine;
        // 处理动画轨道：当需要清除轨道且非缓存动画时执行清理
        if (spine.enabled)
            this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
        else spine.enabled = true; // 激活组件

        spine.loop = false; // 停止循环播放
        !!skin && spine.setSkin(skin); // 设置指定皮肤（如果存在）
    }

    /**
     * 清空当前Spine动画
     * @规则：
     * - 立即停止当前动画
     * - 销毁Spine节点释放资源
     * @示例
     * this.a_setEmpty(); // 清空当前显示的Spine
     */
    public a_setEmpty(): void {
        this.a_stop();
    }

    /**
     * 绑定动画开始回调
     * @param spine Spine骨架组件
     * @规则：
     * - 当Spine功能可用时使用原生事件监听
     * - 不可用时使用定时器模拟
     * - 通过_startIndexes过滤需要处理的队列索引
     * @示例
     * // 在加载Spine资源时调用：
     * this.bindStartCall(spineComponent);
     */
    private bindStartCall(spine: Skeleton) {
        if (no.spineEnable()) {
            // 原生事件监听模式
            spine?.setStartListener(() => {
                spine?.setStartListener(() => { }); // 单次监听自动移除
                this.emitStartEvent();
                if (!this._startIndexes || this._startIndexes.includes(String(this.queueIndex)))
                    this?.startCall.execute(spine, this.queueIndex);
            });
        } else {
            // 模拟模式：立即执行回调
            this.emitStartEvent();
            if (!this._startIndexes || this._startIndexes.includes(String(this.queueIndex)))
                this?.startCall.execute(spine, this.queueIndex);
        }
    }

    /**
     * 绑定动画结束回调
     * @param spine Spine骨架组件
     * @规则：
     * - 动画结束后自动重置Spine数据
     * - 处理逻辑同bindStartCall
     * @示例
     * // 在播放动画时调用：
     * this.bindEndCall(spineComponent);
     */
    private bindEndCall(spine: Skeleton) {
        if (no.spineEnable()) {
            spine?.setCompleteListener(() => {
                spine?.setCompleteListener(() => { }); // 单次监听自动移除
                this.emitEndEvent();
                if (!this._endIndexes || this._endIndexes.includes(String(this.queueIndex)))
                    this?.endCall.execute(spine, this.queueIndex);
                this.setSpineData(); // 重置动画数据
            });
        } else {
            // 模拟模式：延迟1秒后执行
            this.scheduleOnce(() => {
                this.emitEndEvent();
                if (!this._endIndexes || this._endIndexes.includes(String(this.queueIndex)))
                    this?.endCall.execute(spine, this.queueIndex);
                this.setSpineData(); // 重置动画数据
            }, 1);
        }
    }

    /**
     * 绑定循环动画结束回调（单次循环版本）
     * @param spine Spine骨架组件
     * @规则：
     * - 当Spine可用时使用原生完成事件监听
     * - 不可用时使用定时器模拟动画结束
     * - 每次动画结束后自动移除监听（通过覆盖空函数实现）
     * @示例 
     * // 在播放循环动画时调用：
     * this.bindLoop1EndCall(spineComp);
     */
    private bindLoop1EndCall(spine: Skeleton) {
        if (no.spineEnable()) {
            // 原生模式：使用Spine内置事件系统
            spine?.setCompleteListener(() => {
                spine?.setCompleteListener(() => { }); // 单次监听自动移除
                this.emitEndEvent();
                this.playLoopNum(spine.animation); // 处理循环计数逻辑
            });
        } else {
            // 模拟模式：延迟1秒后执行（假设动画时长约1秒）
            this.scheduleOnce(() => {
                this.emitEndEvent();
                this.playLoopNum(spine.animation);
            }, 1);
        }
    }

    //todo 对循环播放的动画考虑按需暂停（待实现逻辑）

    /**
     * 设置Spine组件启用状态
     * @param v 是否启用 
     * @规则：
     * - 当canDisable为false时强制保持启用
     * - 节点未激活时不做处理
     * - 全屏隐藏状态优先于普通禁用
     * @示例
     * // 禁用Spine渲染：
     * this.setSpineEnable(false);
     * // 恢复Spine渲染：
     * this.setSpineEnable(true);
     */
    public setSpineEnable(v: boolean) {
        if (!this.canDisable) return; // 不可禁用时直接返回
        const spine = this._curSpine;
        if (!spine.node.activeInHierarchy) return; // 节点未激活不处理

        // 状态无变化时提前返回
        if (v && !this.isFullScreenHide) return;
        if (!v && !spine.enabled) {
            this.isFullScreenHide = false; // 重置全屏隐藏标志
            return;
        }

        // 执行状态变更
        if (v) {
            spine.enabled = true;
            this.isFullScreenHide = false; // 清除全屏隐藏状态
        } else {
            this.isFullScreenHide = true; // 标记为全屏隐藏
            spine.enabled = false;
        }
    }

    private emitStartEvent() {
        if (this._startEvent) {
            no.evn.emit(this._startEvent, this._eventParam);
        }
    }

    private emitEndEvent() {
        if (this._endEvent) {
            no.evn.emit(this._endEvent, this._eventParam);
        }
    }
}
