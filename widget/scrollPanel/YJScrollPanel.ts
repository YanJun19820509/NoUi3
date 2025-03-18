
import { ccclass, property, executeInEditMode, Component, Node, UITransform, Widget, EventTouch, math, Touch, Layers, EDITOR, Vec2, Vec3, isValid } from '../../yj';
import { YJNodeTarget } from '../../base/node/YJNodeTarget';
import { YJFitScreen } from '../../base/YJFitScreen';
import { SetNodeTweenAction } from '../../ui/SetNodeTweenAction';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJScrollPanel
 * DateTime = Fri Aug 12 2022 14:37:21 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJScrollPanel.ts
 * FileBasenameNoExtension = YJScrollPanel
 * URL = db://assets/NoUi3/widget/scrollPanel/YJScrollPanel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 滚动面板，适用于全屏地图功能，没有mask，支持拖动和缩放
 * 使用时直接将脚本文件拖到层级管理器中即可
 */
@ccclass('YJScrollPanel')
@executeInEditMode()
export class YJScrollPanel extends Component {
    @property({ type: Node, tooltip: '包含可滚动内容的节点（通常包含需要滚动查看的子元素，如图片/地图等）\n示例：包含多个子节点的容器节点' })
    content: Node = null;
    @property({ displayName: '支持两指缩放', tooltip: '是否启用手势缩放功能（需配合min/maxScale使用）' })
    support2FingerScale: boolean = false;
    @property({ displayName: '支持双击缩放', tooltip: '是否启用双击缩放功能\n示例：地图浏览中双击放大关键区域' })
    doubleClick: boolean = false;
    @property({ displayName: '双击检测时长(s)', min: .1, visible() { return this.doubleClick; }, 
        tooltip: '两次点击的最大间隔时间（秒）\n示例：设为0.3表示300ms内两次点击视为双击' })
    doubleClickDuration: number = 1;
    @property({ displayName: '双击放大', min: .1, visible() { return this.doubleClick; }, 
        tooltip: '双击时是否放大到maxScale\n示例：地图组件双击后放大到最大比例' })
    doubleClickScaleMax: boolean = true;
    @property({ displayName: '双击缩小', min: .1, visible() { return this.doubleClick; }, 
        tooltip: '双击时是否缩小到minScale（与双击放大同时启用时交替切换）' })
    doubleClickScaleMin: boolean = false;
    @property({ min: .1, visible() { return this.support2FingerScale; }, 
        tooltip: '最小缩放比例（0.1-1.0）\n示例：0.5表示最小缩小到50%' })
    minScale: number = .5;
    @property({ min: .1, visible() { return this.support2FingerScale; }, 
        tooltip: '最大缩放比例（1.0-3.0）\n示例：2.0表示最大放大到200%' })
    maxScale: number = 1.5;
    @property({ displayName: '滚动偏移', tooltip: '滚动到目标点后需要应用的额外偏移量（单位：像素）\n示例：v2(10, -5)表示向右偏移10px，向下偏移5px' })
    offset: Vec2 = math.v2();
    @property({ displayName: '动画时长(s)', min: 0, 
        tooltip: '滚动/缩放动画的持续时间（0表示无动画）\n示例：0.5表示半秒完成动画' })
    duration: number = .5;
    @property({ type: no.EventHandlerInfo, tooltip: '滚动开始事件（参数：当前滚动位置）\n示例：播放滚动音效/显示加载状态' })
    onMoveStart: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, tooltip: '滚动结束事件（参数：最终滚动位置）\n示例：更新地图标记/保存滚动位置' })
    onMoveStop: no.EventHandlerInfo[] = [];

    /** 记录触摸起点坐标（屏幕坐标系） */
    private startTouchPos: Vec2;
    /** 初始两指间距（用于计算缩放比例） */
    private startDis: number;
    /** 初始缩放值（用于计算缩放变化量） */
    private startScale: number;
    /** 双击开始时间戳（用于计算点击间隔） */
    private doubleClickStartTime: number = 0;
    /** 连续点击次数（用于检测双击） */
    private doubleClickNum: number = 0;
    /** 双击操作进行中标记（防止重复触发） */
    private doubleClicking: boolean = false;
    /** 当前双击缩放方向（true放大/false缩小） */
    private doubleClickScaleToMax: boolean;
    /** 是否需要检测滚动边界 */
    private needCheckCheckRange: boolean = true;
    /** 滚动进行中状态标记 */
    private startMove: boolean = false;

    onLoad() {
        // 编辑器环境下的初始化配置
        if (EDITOR) {
            // 自动添加UITransform和Widget组件（用于编辑器预览时的自适应布局）
            if (!this.getComponent(UITransform)) {
                // 添加并配置Widget组件实现全屏自适应
                this.addComponent(UITransform);
                let widget = this.addComponent(Widget);
                widget.isAlignLeft = true;    // 左对齐
                widget.left = 0;              // 左边距0像素
                widget.isAlignRight = true;   // 右对齐
                widget.right = 0;             // 右边距0像素
                widget.isAlignTop = true;     // 顶部对齐
                widget.top = 0;               // 上边距0像素
                widget.isAlignBottom = true;  // 底部对齐
                widget.bottom = 0;            // 下边距0像素
                
                /* 示例：在编辑器中创建滚动面板时自动生成全屏适配的容器
                 * 开发者只需拖拽组件到节点，即可自动生成适配父节点的布局 */
            }
            
            // 自动创建默认内容容器（如果不存在）
            if (!this.content && this.node.children.length == 0) {
                let content = new Node('content');
                content.layer = Layers.Enum.UI_2D;  // 设置UI层级
                content.addComponent(UITransform);  // 添加变换组件
                content.parent = this.node;         // 挂载到当前节点
                this.content = content;             // 设为内容容器
                
                /* 示例：当开发者首次添加组件时自动创建内容容器节点
                 * 后续只需将需要滚动的内容（如图片/文本）拖入content节点即可 */
            }
        }
        
        // 初始化双击缩放方向（默认使用配置的初始方向）
        this.doubleClickScaleToMax = this.doubleClickScaleMax;
    }

    onEnable() {
        // 确保内容容器存在（默认为当前节点）
        this.content = this.content || this.node;
        
        // 注册触摸事件监听（使用捕获阶段确保优先处理）
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this, true);  // 触摸开始
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);    // 触摸移动
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);      // 触摸结束
        // this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this, true); // 触摸取消（根据需求启用）
        
        /* 示例：玩家在移动设备上拖动地图时
         * 1. 手指按下触发TOUCH_START记录初始位置
         * 2. 移动手指触发TOUCH_MOVE更新内容位置
         * 3. 松开手指触发TOUCH_END执行惯性滑动 */
    }

    onDisable() {
        // 移除所有事件监听（防止内存泄漏）
        this.node.targetOff(this);
        
        /* 示例：当切换场景或关闭界面时自动解除事件绑定
         * 避免界面不可见时仍响应触摸事件 */
    }

    /**
     * 滚动到指定位置
     * @param pos 目标位置（基于滚动面板的本地坐标系）
     * @param offset 位置偏移量（默认使用组件配置的偏移）
     * @param duration 滚动持续时间（秒，0表示立即定位）
     * @example
     * // 滚动到面板中心位置，带1秒动画
     * this.scrollTo(new Vec3(0, 0, 0), new Vec2(10, 10), 1);
     * 
     * // 立即定位到右下角位置
     * this.scrollTo(new Vec3(100, -100, 0), null, 0);
     */
    public scrollTo(pos: Vec3, offset?: Vec2, duration?: number): void {
        if (duration == null) duration = this.duration;
        if (offset == null) offset = this.offset;
        this.doubleClicking = false;
        pos.x += offset.x;
        pos.y += offset.y;
        this.fitPos(pos, this.content.scale.x);
        if (duration <= 0) {
            this.content.setPosition(pos);
            no.EventHandlerInfo.execute(this.onMoveStop);
        } else {
            this.setTween({
                pos: [pos.x, pos.y]
            }, duration);
        }
    }

    /**
     * 滚动到指定位置并调整缩放比例
     * @param pos 目标位置（基于滚动面板的本地坐标系）
     * @param scale 目标缩放比例
     * @param offset 位置偏移量（默认使用组件配置的偏移）
     * @param duration 动画持续时间（秒，0表示立即生效）
     * @example
     * // 放大到2倍并滚动到中心点，带0.5秒动画
     * this.scrollToAndScale(new Vec3(0, 0, 0), 2, new Vec2(20, -20), 0.5);
     */
    public scrollToAndScale(pos: Vec3, scale: number, offset?: Vec2, duration?: number): void {
        if (duration == null) duration = this.duration;
        if (offset == null) offset = this.offset;
        this.doubleClicking = false;
        pos.x += offset.x;
        pos.y += offset.y;
        this.fitPos(pos, scale);
        if (duration <= 0) {
            this.content.setScale(scale, scale);
            this.content.setPosition(pos);
            no.EventHandlerInfo.execute(this.onMoveStop);
        } else {
            this.setTween({
                pos: [pos.x, pos.y],
                scale: [scale, scale]
            }, duration);
        }
    }

    /**
     * 滚动到指定目标节点位置
     * @param targetType 目标节点类型标识（需预先注册到nodeTargetManager）
     * @param offset 位置偏移量
     * @param duration 动画持续时间
     * @param cb 找到目标后的回调函数
     * @example
     * // 滚动到"enemy"目标位置，带回调
     * this.scrollToTarget('enemy', new Vec2(0, 50), 1, (target) => {
     *     console.log('已滚动到敌人位置:', target.node.name);
     * });
     */
    public scrollToTarget(targetType: string, offset?: Vec2, duration?: number, cb?: (target: YJNodeTarget) => void): void {
        const f = () => {
            let target = no.nodeTargetManager.get<YJNodeTarget>(targetType);
            if (!target) {
                console.error('scrollToTargetAndScale找不到target：', targetType);
                return;
            }
            this.unschedule(f);
            cb?.(target);
            this.scrollTo(this.fitTargetToCenter(target), offset, duration);
        };
        this.schedule(f, .1, 100);
    }

    /**
     * 滚动到目标节点位置并调整缩放比例
     * @param targetType 目标节点类型标识
     * @param scale 目标缩放比例
     * @param offset 位置偏移量
     * @param duration 动画持续时间
     * @param cb 找到目标后的回调函数
     * @example
     * // 放大到1.5倍并聚焦"boss"目标
     * this.scrollToTargetAndScale('boss', 1.5, null, 0.8, (target) => {
     *     target.highlight(); // 高亮显示BOSS
     * });
     */
    public scrollToTargetAndScale(targetType: string, scale: number, offset?: Vec2, duration?: number, cb?: (target: YJNodeTarget) => void): void {
        const f = () => {
            let target = no.nodeTargetManager.get<YJNodeTarget>(targetType);
            if (!target) {
                console.error('scrollToTargetAndScale找不到target：', targetType);
                return;
            }
            this.unschedule(f);
            cb?.(target);
            this.scrollToAndScale(this.fitTargetToCenter(target, scale), scale, offset, duration);
        };
        this.schedule(f, .1, 100);
    }

    /**
     * 调整内容缩放比例
     * @param scale 目标缩放比例 
     * @param duration 动画持续时间（秒），默认使用组件预设duration值
     * @example
     * // 立即缩放至0.5倍
     * this.scaleTo(0.5);
     * // 用1秒时间动画缩放至2倍
     * this.scaleTo(2, 1);
     */
    public scaleTo(scale: number, duration?: number): void {
        if (duration == null) duration = this.duration;
        this.doubleClicking = false; // 重置双击状态
        let pos = this.content.getPosition();
        this.fitPos(pos, scale); // 计算适配后的位置
        if (duration <= 0) {
            // 立即设置缩放和位置
            this.content.setScale(scale, scale);
            this.content.setPosition(pos);
            no.EventHandlerInfo.execute(this.onMoveStop); // 触发停止移动事件
        } else {
            // 使用缓动动画过渡
            this.setTween({
                pos: [pos.x, pos.y],
                scale: [scale, scale]
            }, duration);
        }
    }

    /**
     * 计算并更新最小缩放比例限制
     * @description 根据容器和内容尺寸计算最小缩放比例，确保内容至少填满容器
     */
    private checkScaleRange(): void {
        if (!isValid(this.node)) return;
        // 获取容器和内容的实际尺寸
        let nsize = this.node.getComponent(UITransform).contentSize;
        let csize = this.content.getComponent(UITransform).contentSize;
        // 计算最小缩放比例（取宽高比例中较大的，且不超过1）
        let minScale = Math.min(Math.max(nsize.width / csize.width, nsize.height / csize.height), 1);
        // 更新组件的最小缩放限制
        if (this.minScale < minScale) this.minScale = minScale;
        no.log('checkScaleRange', nsize, csize, this.minScale);
    }

    /**
     * 触摸开始事件处理
     * @param e 触摸事件对象
     * @description 处理单指/双指触摸开始：
     * - 单指触摸：初始化双击检测
     * - 双指触摸：记录初始距离和缩放值
     */
    private onTouchStart(e: EventTouch) {
        if (!this.content) {
            e.preventSwallow = true; // 允许事件穿透
            return;
        }
        this.startTouchPos = this.touchUILocationAR(e); // 记录触摸起点
        let touches = e.getAllTouches();
        this.startDis = null; // 重置双指距离
        this.startScale = null; // 重置初始缩放值
        
        if (touches.length < 2) {
            e.preventSwallow = true;
            // 初始化双击检测参数
            if (this.doubleClick) {
                if (!this.doubleClicking) {
                    this.doubleClicking = true;
                    this.doubleClickStartTime = 0;
                    this.doubleClickNum = 0;
                }
            }
            return;
        }
        // 双指触摸处理
        this.doubleClicking = false; // 中断双击检测
        e.propagationStopped = true; // 阻止事件冒泡
        this.startDis = this.touchesDistance(touches); // 记录初始双指距离
        this.startScale = this.content.scale.x; // 记录当前缩放值
        this.doubleClickStartTime = 0; // 重置双击计时
    }

    /**
     * 触摸移动事件处理
     * @param e 触摸事件对象
     * @description 处理不同触摸模式：
     * - 单指移动：检测是否为有效拖动（移动超过10像素则取消双击检测）
     * - 双指缩放：执行缩放操作前先检查缩放范围
     * @example
     * // 典型触摸场景：
     * // 1. 单指快速双击：触发双击缩放
     * // 2. 单指长距离拖动：触发内容滚动
     * // 3. 双指捏合：触发内容缩放
     */
    private onTouchMove(e: EventTouch) {
        if (!this.content) {
            e.preventSwallow = true;
            return;
        }
        const touches = e.getAllTouches();
        if (touches.length == 1) {
            // 单指移动处理：检测移动距离取消双击
            if (Math.abs(e.getDeltaX()) > 10 || Math.abs(e.getDeltaY()) > 10) {
                this.doubleClicking = false;
            }
            this.move(e); // 执行移动逻辑
        } else {
            // 双指缩放处理
            this.doubleClicking = false;
            if (this.needCheckCheckRange) {
                this.needCheckCheckRange = false;
                this.checkScaleRange(); // 首次缩放前检查缩放范围
            }
            this.scale(e); // 执行缩放逻辑
        }
        e.propagationStopped = true; // 阻止事件冒泡
    }

    /**
     * 触摸结束事件处理
     * @param e 触摸事件对象
     * @description 处理以下逻辑：
     * 1. 判断是否为有效点击（移动距离小于10像素）
     * 2. 触发滚动结束事件
     * 3. 处理双击缩放逻辑：
     *    - 首次点击记录时间戳
     *    - 二次点击在指定时间内触发缩放
     *    - 根据配置切换缩放方向（放大/缩小）
     * @example
     * // 典型场景：
     * // 用户快速双击地图中心区域，地图自动放大到预设的最大比例
     * // 再次双击时根据配置切换为缩小或保持放大状态
     */
    private onTouchEnd(e: EventTouch) {
        // 确保内容容器存在
        if (!this.content) {
            e.preventSwallow = true;
            return;
        }
        
        // 判断是否为有效点击（移动距离小于10像素）
        if (math.Vec2.distance(e.getStartLocation(), e.getLocation()) > 10)
            e.propagationStopped = true;  // 阻止事件冒泡（有效拖动）
        else
            e.preventSwallow = true;      // 允许事件穿透（点击操作）

        // 触发滚动结束事件
        if (this.startMove) {
            this.startMove = false;
            no.EventHandlerInfo.execute(this.onMoveStop);
        }

        // 处理双击缩放逻辑
        if (this.doubleClick) {
            if (this.doubleClicking) {
                this.doubleClickNum++;
                // 检测到第二次点击
                if (this.doubleClickNum == 2) {
                    // 首次缩放前检查边界
                    if (this.needCheckCheckRange) {
                        this.needCheckCheckRange = false;
                        this.checkScaleRange();
                    }

                    let scale = this.content.scale.x;
                    // 当前处于非默认比例时重置为1:1
                    if (scale < 1 || scale > 1) {
                        scale = 1;
                    } else {
                        // 根据配置切换缩放方向
                        if (this.doubleClickScaleToMax) {
                            scale = this.maxScale;
                            // 如果同时启用了缩小功能则切换方向
                            if (this.doubleClickScaleMin) this.doubleClickScaleToMax = false;
                        } else {
                            scale = this.minScale;
                            // 如果同时启用了放大功能则切换方向
                            if (this.doubleClickScaleMax) this.doubleClickScaleToMax = true;
                        }
                    }
                    // 执行缩放动画
                    this.scaleContent(scale, true);
                }
            }
        }
    }

    /**
     * 处理单指移动逻辑
     * @param e 触摸事件对象
     * @description 实现：
     * 1. 触发滚动开始事件
     * 2. 根据触摸偏移量计算新位置
     * 3. 应用位置并保持内容在可视范围内
     * @example
     * // 用户拖动地图时：
     * // 手指移动产生delta值，根据当前缩放比例计算实际位移量
     * // 地图内容跟随手指移动，边缘自动吸附
     */
    private move(e: EventTouch) {
        // 触发滚动开始事件
        if (!this.startMove) {
            this.startMove = true;
            no.EventHandlerInfo.execute(this.onMoveStart);
        }

        // 计算触摸偏移量
        let delta = math.v2();
        e.touch.getDelta(delta);
        
        // 计算新位置（考虑缩放比例对移动速度的影响）
        let pos = this.content.getPosition();
        let scale = this.content.scale.x;
        let newPos = pos.add3f(delta.x * scale, delta.y * scale, 0);
        
        // 限制位置在有效范围内并更新
        this.fitPos(newPos, scale);
        this.content.setPosition(pos);
    }

    /**
     * 处理双指缩放逻辑
     * @param e 触摸事件对象
     * @description 实现：
     * 1. 计算两指间距变化量
     * 2. 根据间距变化计算缩放比例
     * 3. 限制在最小/最大缩放范围内
     * 4. 应用缩放比例
     * @example
     * // 用户双指捏合时：
     * // 初始间距100px，当前间距80px，缩放比例减少20%
     * // 内容根据手指中点进行缩放，保持视觉中心稳定
     */
    private scale(e: EventTouch) {
        if (!this.support2FingerScale) return;

        // 计算当前两指间距
        let dis = this.touchesDistance(e.getAllTouches());
        // 计算缩放比例：基础比例 + 间距变化比例
        let scale = math.clamp(
            this.startScale + (dis - this.startDis) / this.startDis,
            this.minScale,
            this.maxScale
        );

        if (isNaN(scale)) return;

        // 达到边界时更新基准值
        if (scale == this.minScale || scale == this.maxScale) {
            this.startScale = scale;
            this.startDis = dis;
        }

        // 应用缩放
        this.scaleContent(scale);
    }

    /**
     * 调整内容缩放比例并保持触摸点位置稳定
     * @param scale 目标缩放比例
     * @param tween 是否使用补间动画（默认false立即生效）
     * @description 实现原理：
     * 1. 计算缩放比例变化量
     * 2. 根据触摸起点位置调整内容位置，保持视觉焦点稳定
     * 3. 应用新的缩放和位置
     * @example
     * // 双指缩放时直接设置
     * this.scaleContent(newScale);
     * // 双击缩放时使用动画过渡
     * this.scaleContent(targetScale, true);
     */
    private scaleContent(scale: number, tween = false) {
        // 计算缩放比例差值
        let s = scale - this.content.scale.x;
        // 获取当前内容位置
        let pos = this.content.getPosition();
        // 根据触摸起点偏移调整位置（保持缩放中心点稳定）
        pos.x -= this.startTouchPos.x * s;
        pos.y -= this.startTouchPos.y * s;
        // 计算适配后的合法位置
        this.fitPos(pos, scale);
        
        if (!tween) {
            // 立即设置缩放和位置
            this.content.setScale(scale, scale);
            this.content.setPosition(pos);
            no.EventHandlerInfo.execute(this.onMoveStop); // 触发停止事件
        } else {
            // 使用补间动画过渡
            this.setTween({
                pos: [pos.x, pos.y],
                scale: [scale, scale]
            });
        }
    }

    /**
     * 设置补间动画参数
     * @param props 动画属性目标值 {pos: [x,y], scale: [x,y]}
     * @param duration 动画持续时间（默认使用组件预设duration）
     * @example
     * // 创建1秒内移动到(100,200)并缩放到1.5倍的动画
     * this.setTween({ pos: [100,200], scale: [1.5,1.5] }, 1);
     */
    private setTween(props: any, duration?: number) {
        if (duration == null) duration = this.duration;
        // 动态获取或添加补间动画组件
        (this.content.getComponent(SetNodeTweenAction) || this.content.addComponent(SetNodeTweenAction))
            .a_setData({
                duration: duration,
                to: 1,
                props: props
            });
    }

    /**
     * 计算两指触摸点间距
     * @param touches 触摸点数组
     * @returns 两点之间的像素距离
     */
    private touchesDistance(touches: Touch[]): number {
        return math.Vec2.distance(touches[0].getLocation(), touches[1].getLocation());
    }

    /**
     * 转换触摸位置到内容节点的相对坐标
     * @param e 触摸事件对象
     * @returns 相对于内容节点的坐标（考虑锚点和适配）
     * @description 坐标转换流程：
     * 1. 获取UI坐标系触摸位置
     * 2. 转换为世界坐标
     * 3. 考虑屏幕适配偏移
     * 4. 最终转换为内容节点的本地坐标
     */
    private touchUILocationAR(e: EventTouch): Vec2 {
        let p = e.getUILocation();
        let pos = math.v3(p.x, p.y);
        let ut = this.node.getComponent(UITransform);
        let size = ut.contentSize.clone();
        let ar = ut.anchorPoint;
        
        // 计算锚点偏移
        pos.subtract3f(size.width * ar.x, size.height * ar.y, 0);
        // 转换为世界坐标
        ut.convertToWorldSpaceAR(pos, pos);
        // 考虑屏幕适配
        let vsize = YJFitScreen.getVisibleSize();
        pos.subtract3f((vsize.width - size.width), (vsize.height - size.height), 0);
        // 转换为内容节点本地坐标
        this.content.getComponent(UITransform).convertToNodeSpaceAR(pos, pos);
        return math.v2(pos.x, pos.y);
    }

    /**
     * 计算内容节点的边界范围
     * @param scale 当前缩放比例
     * @returns 包含四个边界的对象 {minX, minY, maxX, maxY}
     * @description 边界计算规则：
     * - 基于内容尺寸、节点锚点和当前缩放比例
     * - 确保内容始终覆盖容器可视区域
     */
    private xyXY(scale: number): { minX: number, minY: number, maxX: number, maxY: number } {
        let nsize = this.node.getComponent(UITransform).contentSize;
        let csize = this.content.getComponent(UITransform).contentSize;
        let nar = this.node.getComponent(UITransform).anchorPoint;
        let car = this.content.getComponent(UITransform).anchorPoint;
        
        return {
            minX: (car.x - 1) * csize.width * scale + (1 - nar.x) * nsize.width,
            minY: (car.y - 1) * csize.height * scale + (1 - nar.y) * nsize.height,
            maxX: car.x * csize.width * scale - nar.x * nsize.width,
            maxY: car.y * csize.height * scale - nar.y * nsize.height
        };
    }

    /**
     * 调整位置到合法范围内
     * @param pos 要调整的位置
     * @param scale 当前缩放比例
     * @example
     * // 当拖动超过边界时自动回弹
     * this.fitPos(currentPos, currentScale);
     */
    private fitPos(pos: Vec3 | Vec2, scale: number) {
        let { minX, minY, maxX, maxY } = this.xyXY(scale);

        // 水平边界限制
        pos.x = math.clamp(pos.x, minX, maxX);
        // 垂直边界限制
        pos.y = math.clamp(pos.y, minY, maxY);
    }

    /**
     * 计算目标节点居中时的位置
     * @param target 目标节点
     * @param scale 目标缩放比例
     * @returns 内容节点需要移动到的中心位置
     * @example
     * // 将boss节点居中显示
     * let targetPos = this.fitTargetToCenter(bossTarget);
     * this.scrollTo(targetPos);
     */
    private fitTargetToCenter(target: YJNodeTarget, scale = 1): Vec3 {
        let pos = math.v3();
        // 转换目标节点世界坐标到当前节点坐标系
        this.node.getComponent(UITransform).convertToNodeSpaceAR(target.nodeWorldPosition, pos);
        // 计算内容节点需要调整的位置
        let p = this.content.getPosition();
        p.subtract(pos).multiplyScalar(scale / this.content.scale.x);
        return p;
    }

    /**
     * 更新双击状态检测
     * @param dt 增量时间（秒）
     * @description 当双击操作开始后，持续检测时间间隔是否超时
     */
    update(dt: number) {
        if (!this.doubleClicking) return;
        this.doubleClickStartTime += dt;
        // 超过双击检测时长后重置状态
        if (this.doubleClickStartTime >= this.doubleClickDuration) this.doubleClicking = false;
    }
}
