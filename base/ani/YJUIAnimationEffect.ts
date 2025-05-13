import { no } from "../../no";
import { EasingType, Range } from "../../types";
import { Component, DEBUG, EDITOR, Enum, Node, UIOpacity, Vec2, ccclass, director, executeInEditMode, isValid, property, v2 } from "../../yj";
import { YJTweenTest, getEasingFn } from "./YJTween";


/**
 * 动画类型枚举
 */
enum AnimType {
    None = 0,
    Delay = 1,//延迟执行
    ExpandWidth = 2,//扩宽
    ExpandHeight = 3,//扩高
    FadeOut = 4,//淡出
    FadeIn = 5,//淡入
    MoveBy = 15,//在当前位置的基础上移动指定距离，比如当前位置为(100, 50)，MoveByArgs为(10, 10)，则最终位置为(110, 60)
    MoveTo = 18,//移动到指定位置，比如当前位置为(100, 50)，MoveToArgs为(110, 60)，则最终位置为(110, 60)
    LeftSlideIn = 6,//从左滑入
    RightSlideIn = 7,//从右滑入
    Opacity = 16,//透明度变化
    Rotation = 17,//旋转变化
    ScaleOut = 8,//缩小
    ScaleIn = 9,//放大
    ScaleTo = 10,//在当前缩放的基础上缩放至指定大小，比如当前缩放为1.2，ScaleToArgs为0.5，则最终缩放为0.6
    ScaleXOut = 11,//x轴缩小
    ScaleXIn = 12,//x轴放大
    ScaleYOut = 13,//y轴缩小
    ScaleYIn = 14,//y轴放大
    ScaleX = 19,//x轴缩放
    ScaleY = 20,//y轴缩放
    Jump = 21,//跳跃
    Shake = 22,//抖动
    RotationX = 23,//x轴旋转
    RotationY = 24,//y轴旋转
    HeartBit = 25,//心跳
}

/**
 * 单个动画效果类
 */
@ccclass('AnimationEffect')
class AnimationEffect {
    @property({ type: Enum(AnimType), displayName: "动画类型" })
    type: AnimType = AnimType.None; // 动画效果类型枚举，None表示未设置
    // 示例：设置为AnimType.MoveBy时，将根据moveByArgs参数执行相对位移动画

    @property({ displayName: "动画持续时长(秒)", min: 0, tooltip: '为0时做为set处理，仅对带参类型有效' })
    duration: number = 0.1; // 动画过渡时间（单位：秒），0表示立即设置目标值
    // 示例：设置为0.5时，缩放/移动等动画会在半秒内完成过渡

    @property({ displayName: "动画缓动函数", type: Enum(EasingType) })
    easing: EasingType = EasingType.LINEAR; // 动画运动曲线类型，控制动画的加速度变化
    // 示例：使用QUAD_OUT实现先快后慢的减速效果

    @property({ displayName: "ExpandWidth参数", type: Range, visible() { return this.type === AnimType.ExpandWidth; } })
    expandWidthArgs: Range = new Range(0, 50); // 宽度扩展参数（起始百分比，结束百分比）
    // 示例：Range(0,50)表示宽度从原尺寸的100%动画过渡到150%

    @property({ displayName: "ExpandHeight参数", type: Range, visible() { return this.type === AnimType.ExpandHeight; } })
    expandHeightArgs: Range = new Range(0, 50); // 高度扩展参数（起始百分比，结束百分比）
    // 示例：Range(20,100)表示高度从原尺寸的120%动画过渡到200%

    @property({ displayName: "MoveBy参数", visible() { return this.type === AnimType.MoveBy; } })
    moveByArgs: Vec2 = v2(0, 0); // 相对位移量（X轴偏移，Y轴偏移）
    // 示例：v2(100, -50)表示向右移动100像素，向上移动50像素

    @property({ displayName: "MoveTo参数", visible() { return this.type === AnimType.MoveTo; } })
    moveToArgs: Vec2 = v2(0, 0); // 绝对目标位置（世界坐标X，世界坐标Y）
    // 示例：v2(300, 200)表示移动到画布坐标(300,200)的位置

    @property({ displayName: "ScaleTo参数", visible() { return this.type === AnimType.ScaleTo || this.type === AnimType.ScaleX || this.type === AnimType.ScaleY; } })
    scaleToArgs: number = .5; // 目标缩放比例（1.0为原始尺寸）
    // 示例：ScaleTo类型时0.5表示缩放到原尺寸的50%，ScaleX类型时仅影响X轴缩放

    @property({ displayName: "Opacity参数", visible() { return this.type === AnimType.Opacity; }, min: 2, max: 255 })
    opacityArgs: number = 255; // 目标透明度（2-255对应实际透明度0-1）
    // 示例：设置为128时对应透明度0.5，实现半透明效果

    @property({ displayName: "Rotaion参数", visible() { return this.type === AnimType.Rotation; } })
    rotationArgs: number = 360; // 旋转角度（正值为顺时针，负值为逆时针）
    // 示例：设置为360时实现节点顺时针旋转一周的动画

    @property({ type: no.EventHandlerInfo, displayName: '回调' })
    callbacks: no.EventHandlerInfo[] = []; // 动画完成时的回调函数列表
    // 示例：可添加多个回调，在动画结束时触发界面更新或播放音效

    /**
     * 获取动画配置
     * @param node 目标节点 - 需要应用动画的节点对象
     * @returns 动画配置数组 - 返回符合YJTween格式的动画配置对象或数组
     * 
     * @功能说明
     * 1. 根据动画类型调用对应的私有方法生成基础配置
     * 2. 统一处理缓动函数和回调的注入逻辑
     * 3. 支持链式动画配置（返回数组时）和单动画配置
     * 
     * @处理规则
     * - 数组类型的动画配置：将缓动函数和回调注入到最后一个动画阶段
     * - 单对象配置：直接添加缓动和回调属性
     * - 回调执行时机：动画序列完全结束后触发
     * 
     * @示例
     * // 创建移动+淡入的组合动画
     * const moveConfig = {
     *   duration: 1,
     *   props: { pos: [200, 0] }
     * };
     * const fadeConfig = {
     *   duration: 0.5,
     *   props: { opacity: [255] }
     * };
     * // 返回格式示例：[{...moveConfig}, {...fadeConfig}]
     */
    public getTweenSet(node: Node) {
        let a: any;
        // 根据动画类型选择对应的配置生成方法
        switch (this.type) {
            case AnimType.Delay: a = this.delay(); break;          // 延迟动画
            case AnimType.ExpandWidth: a = this.expandWidth(node); break;  // 宽度扩展动画
            case AnimType.ExpandHeight: a = this.expandHeight(node); break; // 高度扩展动画
            case AnimType.FadeOut: a = this.fadeOut(node); break;  // 淡出效果
            case AnimType.FadeIn: a = this.fadeIn(node); break;    // 淡入效果
            case AnimType.MoveBy: a = this.moveBy(node); break;    // 相对位移
            case AnimType.MoveTo: a = this.moveTo(node); break;    // 绝对位移
            case AnimType.LeftSlideIn: a = this.leftSlideIn(node); break;  // 左侧滑入
            case AnimType.RightSlideIn: a = this.rightSlideIn(node); break; // 右侧滑入
            case AnimType.ScaleOut: a = this.scaleOut(node); break;  // 缩放退出
            case AnimType.ScaleIn: a = this.scaleIn(node); break;   // 缩放进入
            case AnimType.ScaleTo: a = this.scaleTo(node); break;   // 缩放到指定比例
            case AnimType.ScaleXOut: a = this.scaleXOut(node); break; // X轴缩放退出
            case AnimType.ScaleXIn: a = this.scaleXIn(node); break;  // X轴缩放进入
            case AnimType.ScaleYOut: a = this.scaleYOut(node); break; // Y轴缩放退出
            case AnimType.ScaleYIn: a = this.scaleYIn(node); break;  // Y轴缩放进入
            case AnimType.Opacity: a = this.opacity(node); break;   // 透明度变化
            case AnimType.Rotation: a = this.rotation(node); break; // 平面旋转
            case AnimType.ScaleX: a = this.scaleX(node); break;     // X轴缩放
            case AnimType.ScaleY: a = this.scaleY(node); break;     // Y轴缩放
            case AnimType.Jump: a = this.jump(node); break;         // 跳跃效果
            case AnimType.Shake: a = this.shake(node); break;       // 震动效果
            case AnimType.RotationX: a = this.rotationX(node); break; // X轴3D旋转
            case AnimType.RotationY: a = this.rotationY(node); break; // Y轴3D旋转
            case AnimType.HeartBit: a = this.heartBit(node); break;  // 心跳效果
        }

        // 统一处理缓动函数注入
        const easingFn = YJTweenTest ? this.easing : getEasingFn(this.easing);
        if (a instanceof Array) {
            // 为链式动画的最后一个阶段添加缓动
            a[a.length - 1].easing = easingFn;
        } else {
            // 单动画直接添加缓动属性
            a.easing = easingFn;
        }

        // 回调函数处理（动画完成后执行）
        if (this.callbacks.length > 0) {
            const executeCallbacks = () => no.EventHandlerInfo.execute(this.callbacks);
            if (a instanceof Array) {
                // 链式动画在最后一个元素添加回调
                a[a.length - 1].callback = executeCallbacks;
            } else {
                // 单动画直接添加回调
                a.callback = executeCallbacks;
            }
        }

        return a;
    }

    /**
     * 创建纯延迟动画效果
     * @param duration 延迟时长（秒）
     * @returns 延迟动画配置对象
     * 
     * @使用场景
     * - 在动画序列中插入等待间隔
     * - 配合sequence()实现分步动画
     * 
     * @示例
     * // 创建2秒延迟动画
     * new YJUIAnimationEffect().delay(2)
     */
    private delay() {
        return [{ delay: this.duration }];
    }

    /**
     * 从左侧滑入动画（带弹性效果）
     * @param node 目标节点
     * @returns 两阶段动画配置：
     *          1. 初始位置设置到屏幕左侧外
     *          2. 平移到正常位置
     * 
     * @实现细节
     * - 使用set操作确保初始位置准确
     * - 负坐标计算：节点宽度 + 50像素偏移保证完全移出屏幕
     * - 最终位置归零使用节点锚点定位
     * 
     * @示例
     * // 对话框从左侧快速滑入
     * this.leftSlideIn(dialogNode)
     *   .duration(0.5)
     *   .easing('backOut')
     */
    private leftSlideIn(node: Node) {
        return [{
            set: 1,  // 立即设置初始状态
            props: {
                pos: [-no.width(node) - 50, 0]  // 左侧偏移保证完全移出视口
            }
        }, {
            duration: this.duration,
            to: 1,   // 过渡到目标状态
            props: {
                pos: [0, 0]  // 使用节点锚点定位到目标位置
            }
        }];
    }

    /**
     * 从右侧滑入动画（带弹性效果）
     * @param node 目标节点
     * @returns 两阶段动画配置：
     *          1. 初始位置设置到屏幕右侧外
     *          2. 平移到正常位置
     * 
     * @注意
     * - 右侧坐标计算基于节点宽度
     * - 50像素偏移提供入场缓冲空间
     * 
     * @示例
     * // 侧边栏菜单滑入
     * this.rightSlideIn(menuPanel)
     *   .duration(0.8)
     *   .easing('elasticOut')
     */
    private rightSlideIn(node: Node) {
        return [{
            set: 1,
            props: {
                pos: [no.width(node) + 50, 0]  // 右侧偏移计算
            }
        }, {
            duration: this.duration,
            to: 1,
            props: {
                pos: [0, 0]  // 目标位置归零
            }
        }];
    }

    /**
     * 缩放进入动画（从零放大到原始尺寸）
     * @param node 目标节点
     * @returns 两阶段动画配置：
     *          1. 初始化缩放为0
     *          2. 动画恢复到原始比例
     * 
     * @特性
     * - 自动缓存原始缩放值避免数据丢失
     * - 使用对象扩展符保持比例精度
     * 
     * @示例
     * // 按钮弹出效果
     * this.scaleIn(button)
     *   .duration(0.3)
     *   .easing('bounceOut')
     */
    private scaleIn(node: Node) {
        // 缓存原始缩放值（避免多次获取）
        if (!node["__yj_ui_scale"])
            node["__yj_ui_scale"] = no.scale(node);

        const s = node["__yj_ui_scale"];
        return [{
            set: 1,  // 立即设置初始状态
            props: {
                scale: [0, 0]  // 二维缩放归零
            }
        }, {
            duration: this.duration,
            to: 1,   // 过渡到目标状态
            props: {
                scale: [s.x, s.y]  // 恢复缓存的原始缩放值
            }
        }];
    }

    /**
     * 缩放到指定大小动画
     * @param node 目标节点
     * @returns 动画配置数组:
     *          - 当duration=0时使用立即设置(set)
     *          - duration>0时使用渐变过渡(to)
     * @特性
     * - 支持统一缩放（x/y轴相同值）
     * - 自动处理即时设置与渐变动画的切换
     * 
     * @示例
     * // 创建1.2倍缩放动画（持续0.5秒）
     * .scaleToArgs = 1.2
     * this.scaleTo(node)
     *   .duration(0.5)
     *   .easing('quadOut')
     */
    private scaleTo(node: Node) {
        return [{
            duration: this.duration,
            [this.duration == 0 ? 'set' : 'to']: 1,  // 动态选择动画类型
            props: {
                scale: [this.scaleToArgs, this.scaleToArgs]  // 保持xy轴等比例缩放
            }
        }];
    }

    /**
     * 缩放消失动画（缩小到不可见）
     * @param node 目标节点
     * @returns 动画配置数组:
     *          - 自动缓存原始缩放值
     *          - 执行缩放到0的动画
     * 
     * @示例
     * // 按钮点击后缩小消失
     * this.scaleOut(button)
     *   .duration(0.3)
     *   .call(() => button.destroy()) // 动画完成后销毁
     */
    private scaleOut(node: Node) {
        if (!node["__yj_ui_scale"])
            node["__yj_ui_scale"] = no.scale(node);  // 持久化存储原始值
        return [{
            duration: this.duration,
            to: 1,
            props: {
                scale: [0, 0]  // 二维归零
            }
        }];
    }

    /**
     * X轴缩放进入动画（水平展开效果）
     * @param node 目标节点
     * @returns 两阶段动画配置:
     *          1. 初始化X轴缩放为0（保持Y轴原始比例）
     *          2. 动画恢复到原始比例
     * 
     * @示例
     * // 菜单横向展开
     * this.scaleXIn(menu)
     *   .duration(0.4)
     *   .easing('backOut')
     */
    private scaleXIn(node: Node) {
        if (!node["__yj_ui_scale"])
            node["__yj_ui_scale"] = no.scale(node);
        const s = node["__yj_ui_scale"];
        return [{
            set: 1,  // 立即设置初始状态
            props: {
                scale: [0, s.y]  // X轴归零，Y轴保持原样
            }
        }, {
            duration: this.duration,
            to: 1,
            props: {
                scale: [s.x, s.y]  // 恢复缓存的原始值
            }
        }];
    }

    /**
     * X轴缩放消失动画（水平收起效果）
     * @param node 目标节点
     * @returns 动画配置:
     *          - 保持当前Y轴比例
     *          - X轴渐变为0
     * 
     * @示例
     * // 关闭横向菜单
     * this.scaleXOut(menu)
     *   .duration(0.3)
     *   .reverse(true) // 支持反向播放
     */
    private scaleXOut(node: Node) {
        const s = no.scale(node);
        if (!node["__yj_ui_scale"])
            node["__yj_ui_scale"] = s;  // 存储当前实际缩放值
        return [{
            duration: this.duration,
            to: 1,
            props: {
                scale: [0, s.y]  // 仅修改X轴
            }
        }];
    }

    /**
     * Y轴缩放进入动画（垂直展开效果）
     * @param node 目标节点
     * @returns 动画配置:
     *          - 初始状态Y轴缩放为0（完全折叠）
     *          - 过渡到缓存的原始缩放值
     * 
     * @实现说明
     * 1. 保存节点原始缩放值到自定义属性__yj_ui_scale
     * 2. 立即设置初始状态：Y轴归零，保持X轴不变
     * 3. 执行过渡动画恢复Y轴原始比例
     * 
     * @示例
     * // 下拉菜单垂直展开
     * this.scaleYIn(dropdown)
     *   .duration(0.3)
     *   .easing('quadOut')
     */
    private scaleYIn(node: Node) {
        if (!node["__yj_ui_scale"])
            node["__yj_ui_scale"] = no.scale(node);
        const s = node["__yj_ui_scale"];
        return [{
            set: 1,  // 立即设置初始状态
            props: {
                scale: [s.x, 0]  // Y轴归零，X轴保持原样
            }
        }, {
            duration: this.duration,
            to: 1,    // 过渡到目标状态
            props: {
                scale: [s.x, s.y]  // 恢复缓存的原始值
            }
        }];
    }

    /**
     * Y轴缩放消失动画（垂直收起效果）
     * @param node 目标节点
     * @returns 动画配置:
     *          - 从当前比例过渡到Y轴0
     *          - 保留原始缩放值用于后续恢复
     * 
     * @示例
     * // 收起垂直菜单
     * this.scaleYOut(menu)
     *   .duration(0.25)
     *   .reverse(true) // 支持反向播放恢复
     */
    private scaleYOut(node: Node) {
        const s = no.scale(node);
        if (!node["__yj_ui_scale"])
            node["__yj_ui_scale"] = s;  // 存储当前实际缩放值
        return [{
            duration: this.duration,
            to: 1,
            props: {
                scale: [s.x, 0]  // 仅修改Y轴
            }
        }];
    }

    /**
     * X轴缩放动画（水平尺寸调整）
     * @param node 目标节点
     * @returns 动画配置:
     *          - 根据duration决定是立即设置(set)还是过渡动画(to)
     *          - 保持Y轴比例不变
     * 
     * @注意 与scaleXIn/Out不同，这是单向缩放操作
     * @示例
     * // 调整面板宽度
     * this.scaleToArgs = 0.8  // 设置目标缩放值
     * this.scaleX(panel)
     *   .duration(0.2)
     *   .easing('sineInOut')
     */
    private scaleX(node: Node) {
        const s = no.scale(node);
        return [{
            duration: this.duration,
            [this.duration == 0 ? 'set' : 'to']: 1,  // 0持续时间时立即设置
            props: {
                scale: [this.scaleToArgs, s.y]  // X轴缩放至目标值
            }
        }];
    }

    /**
     * Y轴缩放动画（垂直尺寸调整）
     * @param node 目标节点
     * @returns 动画配置:
     *          - 根据duration决定过渡方式
     *          - 保持X轴比例不变
     * 
     * @示例
     * // 动态调整元素高度
     * this.scaleToArgs = 1.2  // 设置目标缩放值
     * this.scaleY(element)
     *   .duration(0.4)
     *   .easing('elasticOut')
     */
    private scaleY(node: Node) {
        const s = no.scale(node);
        return [{
            duration: this.duration,
            [this.duration == 0 ? 'set' : 'to']: 1,
            props: {
                scale: [s.x, this.scaleToArgs]  // Y轴缩放至目标值
            }
        }];
    }

    /**
     * 淡出动画（透明度从当前值过渡到接近透明）
     * @param node 目标节点
     * @returns 动画配置:
     *          - 保存原始透明度到临时属性 __yj_ui_opacity
     *          - 根据duration决定立即设置(set)或过渡动画(to)
     *          - 目标透明度设为2（对应实际透明度0.0078，接近全透明）
     * 
     * @实现细节
     * - 使用临时属性保存原始透明度，供淡入动画恢复使用
     * - 透明度范围映射：2-255 对应实际透明度 0-1
     * 
     * @示例
     * // 对话框淡出消失
     * this.duration = 0.5
     * this.easing = EasingType.QUAD_OUT
     * fadeOut(dialogNode) // 半秒内完成淡出，使用二次缓出曲线
     */
    private fadeOut(node: Node) {
        if (node["__yj_ui_opacity"] === undefined)
            node["__yj_ui_opacity"] = no.opacity(node);
        return [{
            duration: this.duration,
            [this.duration == 0 ? 'set' : 'to']: 1,
            props: {
                opacity: 2
            }
        }];
    }

    /**
     * 淡入动画（透明度从当前值恢复到原始透明度）
     * @param node 目标节点 
     * @returns 动画配置:
     *          - 使用之前保存的 __yj_ui_opacity 或默认255（全不透明）
     *          - 支持立即设置或过渡动画
     * 
     * @注意
     * - 需先执行过淡出动画才能正确恢复原始透明度
     * - 未保存过透明度时使用255作为默认值
     * 
     * @示例
     * // 菜单项渐显出现
     * this.duration = 0.3
     * this.easing = EasingType.SINE_IN
     * fadeIn(menuItem) // 0.3秒内渐显，使用正弦缓入曲线
     */
    private fadeIn(node: Node) {
        return [{
            duration: this.duration,
            [this.duration == 0 ? 'set' : 'to']: 1,
            props: {
                opacity: node["__yj_ui_opacity"] || 255
            }
        }];
    }

    /**
     * 相对位移动画（基于当前位置的偏移）
     * @param node 目标节点
     * @returns 动画配置:
     *          - 计算目标位置：当前位置 + moveByArgs偏移量
     *          - 支持立即跳变或平滑过渡
     * 
     * @使用场景
     * - 按钮点击微动效果
     * - 元素入场/出场滑动效果
     * 
     * @示例
     * // 按钮点击后右移100像素
     * this.moveByArgs = v2(100, 0)
     * this.duration = 0.2
     * this.easing = EasingType.ELASTIC_OUT
     * moveBy(button) // 0.2秒弹性右移
     */
    private moveBy(node: Node) {
        const pos = no.position(node);
        return [{
            duration: this.duration,
            [this.duration == 0 ? 'set' : 'to']: 1,
            props: {
                pos: [this.moveByArgs.x + pos.x, this.moveByArgs.y + pos.y]
            }
        }];
    }

    /**
     * 绝对位移动画（移动到指定坐标）
     * @param node 目标节点
     * @returns 动画配置:
     *          - 直接使用moveToArgs作为目标坐标
     *          - 支持世界坐标系的精确定位
     * 
     * @注意
     * - 会覆盖节点的当前坐标
     * - 适合需要精确控制位置的场景
     * 
     * @示例
     * // 将图标移动到屏幕中心
     * this.moveToArgs = v2(cc.winSize.width/2, cc.winSize.height/2)
     * this.duration = 1
     * this.easing = EasingType.EXPO_OUT
     * moveTo(icon) // 1秒内指数缓动到屏幕中心
     */
    private moveTo(node: Node) {
        return [{
            duration: this.duration,
            [this.duration == 0 ? 'set' : 'to']: 1,
            props: {
                pos: [this.moveToArgs.x, this.moveToArgs.y]
            }
        }];
    }

    /**
     * 宽度扩展动画
     * @param node 目标节点
     * @实现说明
     * 1. 获取节点原始尺寸
     * 2. 分两个阶段执行：
     *    a. 立即设置初始宽度（expandWidthArgs.min百分比）
     *    b. 动画过渡到目标宽度（expandWidthArgs.max百分比）
     * @参数说明
     * - expandWidthArgs.min: 初始宽度比例（例如50表示原尺寸的50%）
     * - expandWidthArgs.max: 目标宽度比例（例如150表示原尺寸的150%）
     * @示例
     * // 创建宽度从50%扩展到150%的动画，持续1秒
     * this.expandWidthArgs = new Range(50, 150);
     * this.duration = 1;
     * this.easing = EasingType.QUAD_OUT;
     */
    private expandWidth(node: Node) {
        const size = no.size(node);
        return [{
            set: 1, // 立即设置初始状态
            props: {
                size: [this.expandWidthArgs.min, size.height]
            }
        }, {
            duration: this.duration,
            to: 1,  // 过渡到目标状态
            props: {
                size: [this.expandWidthArgs.max, size.height]
            }
        }];
    }

    /**
     * 高度扩展动画
     * @param node 目标节点
     * @实现说明
     * 1. 保持宽度不变，仅修改高度
     * 2. 分两个阶段：
     *    a. 立即设置初始高度（expandHeightArgs.min百分比）
     *    b. 动画过渡到目标高度（expandHeightArgs.max百分比）
     * @注意
     * - 百分比基于节点原始尺寸计算
     * - 适用于下拉菜单展开/收起效果
     * @示例
     * // 创建高度从0%扩展到100%的动画，持续0.5秒
     * this.expandHeightArgs = new Range(0, 100);
     * this.duration = 0.5;
     */
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

    /**
     * 透明度变化动画
     * @param node 目标节点
     * @实现说明
     * 1. 自动添加UIOpacity组件（如果不存在）
     * 2. 支持两种模式：
     *    - duration=0: 立即设置透明度
     *    - duration>0: 渐变过渡透明度
     * @参数说明
     * - opacityArgs: 目标透明度值（2-255对应实际0-1透明度）
     * @示例
     * // 淡入效果：从完全透明到不透明
     * this.opacityArgs = 255;
     * this.duration = 1;
     * 
     * // 立即设置为半透明
     * this.opacityArgs = 128;
     * this.duration = 0;
     */
    private opacity(node: Node) {
        !node.getComponent(UIOpacity) && node.addComponent(UIOpacity);
        return [{
            duration: this.duration,
            [this.duration == 0 ? 'set' : 'to']: 1,
            props: {
                opacity: this.opacityArgs
            }
        }];
    }

    /**
     * 旋转动画
     * @param node 目标节点
     * @实现说明
     * 1. 支持两种模式：
     *    - duration=0: 立即设置旋转角度
     *    - duration>0: 平滑旋转到目标角度
     * 2. 角度单位为度数，正值为顺时针旋转
     * @示例
     * // 顺时针旋转360度，持续2秒
     * this.rotationArgs = 360;
     * this.duration = 2;
     * this.easing = EasingType.SINE_IN_OUT;
     * 
     * // 立即逆时针旋转90度
     * this.rotationArgs = -90;
     * this.duration = 0;
     */
    private rotation(node: Node) {
        return [{
            duration: this.duration,
            [this.duration == 0 ? 'set' : 'to']: 1,
            props: {
                angle: this.rotationArgs
            }
        }];
    }

    /**
     * 跳跃动画
     * @param node 目标节点
     * @实现说明
     * 1. 动画分为两个阶段：
     *    - 上升阶段：持续总时长的一半，Y轴位置+10
     *    - 下降阶段：持续总时长另一半，回到原始位置
     * 2. 通过repeat参数实现完整跳跃循环（上升+下降）执行2次
     * @参数说明
     * - duration: 控制完整跳跃周期的时间（包含上升和下降）
     * @示例
     * // 创建持续0.5秒的跳跃动画（0.25秒上升 + 0.25秒下降），重复2次
     * this.jump(node)
     *   .duration(0.5)
     *   .easing('bounceOut') // 使用弹跳缓动增强效果
     */
    private jump(node: Node) {
        const pos = no.position(node);
        return [{
            duration: this.duration / 2,
            to: 1,
            props: {
                pos: [pos.x, pos.y + 10] // 上升阶段：Y轴偏移+10
            }
        }, {
            duration: this.duration / 2,
            to: 1,
            props: {
                pos: [pos.x, pos.y] // 下降阶段：回到原始位置
            }
        }, {
            repeat: 1 // 重复1次（总共执行2次完整动画）
        }];
    }

    /**
     * 抖动动画
     * @param node 目标节点
     * @实现说明
     * 1. 动画分为两个阶段：
     *    - 右移阶段：持续总时长一半，X轴位置+5
     *    - 复位阶段：持续总时长另一半，回到原始位置
     * 2. 通过repeat参数实现完整抖动循环（右移+复位）执行2次
     * @适用场景
     * - 输入错误提示
     * - 重要操作确认反馈
     * @示例
     * // 创建持续0.3秒的抖动动画（0.15秒右移 + 0.15秒复位），重复2次
     * this.shake(node)
     *   .duration(0.3)
     *   .easing('elasticOut') // 使用弹性缓动增强抖动效果
     */
    private shake(node: Node) {
        const pos = no.position(node);
        return [{
            duration: this.duration / 2,
            to: 1,
            props: {
                pos: [pos.x + 5, pos.y] // 右移阶段：X轴偏移+5
            }
        }, {
            duration: this.duration / 2,
            to: 1,
            props: {
                pos: [pos.x, pos.y] // 复位阶段：回到原始位置
            }
        }, {
            repeat: 1 // 重复1次（总共执行2次完整动画）
        }];
    }

    /**
     * X轴旋转动画（模拟3D翻转效果）
     * @param node 目标节点
     * @实现说明
     * 通过缩放Y轴模拟X轴旋转效果，分六个阶段：
     * 1. Y轴压缩到20%（持续总时长1/4）
     * 2. 立即翻转Y轴缩放方向（产生透视变形）
     * 3. Y轴拉伸到-100%（形成倒置效果）
     * 4. Y轴恢复到-20%（持续总时长1/4）
     * 5. 立即翻转回正方向
     * 6. 最终恢复原始比例
     * @注意
     * - 实际是通过缩放模拟3D旋转效果
     * - 会影响子节点的显示效果
     * @示例
     * // 创建持续0.8秒的X轴旋转动画
     * this.duration = 0.8
     * this.easing = EasingType.QUAD_OUT
     * rotationX(cardNode) // 卡牌翻转效果
     */
    private rotationX(node: Node) {
        const scale = no.scale(node);
        const t = this.duration / 4;
        return [{
            duration: t,
            to: 1,
            props: {
                scale: [scale.x, scale.y * .2]  // 第一阶段：Y轴压缩到20%
            }
        }, {
            set: 1,
            props: {
                scale: [scale.x, scale.y * -.2] // 立即翻转缩放方向（产生透视效果）
            }
        }, {
            duration: t,
            to: 1,
            props: {
                scale: [scale.x, scale.y * -1]  // Y轴完全倒置（180度翻转）
            }
        }, {
            duration: t,
            to: 1,
            props: {
                scale: [scale.x, scale.y * -.2] // 恢复部分比例
            }
        }, {
            set: 1,
            props: {
                scale: [scale.x, scale.y * .2]  // 再次翻转方向
            }
        }, {
            duration: t,
            to: 1,
            props: {
                scale: [scale.x, scale.y]       // 最终恢复原始比例
            }
        }];
    }

    /**
     * Y轴旋转动画（模拟水平翻转）
     * @param node 目标节点 
     * @实现说明
     * 通过缩放X轴模拟Y轴旋转，分六个阶段：
     * 1. X轴压缩到20%（持续总时长1/4）
     * 2. 立即翻转X轴缩放方向
     * 3. X轴拉伸到-100%（完全水平翻转）
     * 4. X轴恢复到-20%（持续总时长1/4）
     * 5. 立即翻转回正方向
     * 6. 最终恢复原始比例
     * @与rotationX区别
     * - 操作X轴缩放代替Y轴
     * - 产生水平方向翻转效果
     * @示例
     * // 创建持续1.2秒的Y轴旋转
     * this.duration = 1.2
     * this.easing = EasingType.BACK_OUT
     * rotationY(menuItem) // 菜单项旋转进入效果
     */
    private rotationY(node: Node) {
        const scale = no.scale(node);
        const t = this.duration / 4;
        return [{
            duration: t,
            to: 1,
            props: {
                scale: [scale.x * .2, scale.y]  // X轴压缩到20%
            }
        }, {
            set: 1,
            props: {
                scale: [scale.x * -.2, scale.y] // 立即翻转X轴方向
            }
        }, {
            duration: t,
            to: 1,
            props: {
                scale: [scale.x * -1, scale.y]  // 完全水平翻转
            }
        }, {
            duration: t,
            to: 1,
            props: {
                scale: [scale.x * -.2, scale.y] // 恢复部分比例
            }
        }, {
            set: 1,
            props: {
                scale: [scale.x * .2, scale.y]  // 再次翻转方向
            }
        }, {
            duration: t,
            to: 1,
            props: {
                scale: [scale.x, scale.y]       // 最终恢复原始尺寸
            }
        }];
    }

    /**
     * 心跳动画（脉冲式缩放效果）
     * @param node 目标节点
     * @returns 四阶段动画配置:
     *          1. 快速放大到130%
     *          2. 回弹缩小到90%
     *          3. 二次放大到110%
     *          4. 最终恢复原始尺寸
     * 
     * @实现说明
     * - 总时长平均分为4个阶段，每个阶段占1/4时间
     * - 使用quadOut/quadIn缓动实现脉冲节奏
     * - 自动缓存原始缩放值避免数据丢失
     * 
     * @参数说明
     * - duration: 总动画时长（秒），每个子动画时长为duration/4
     * 
     * @示例
     * // 创建持续0.8秒的心跳效果（每个阶段0.2秒）
     * this.duration = 0.8
     * this.easing = EasingType.QUAD_OUT
     * heartBit(icon) // 图标持续跳动效果
     * 
     * @注意
     * - 建议持续时间设置在0.5-1.2秒之间
     * - 适合按钮悬停/选中状态提示
     */
    private heartBit(node: Node) {
        // 获取并缓存原始缩放值（避免多次获取影响性能）
        const scale = node["__yj_ui_scale"] || no.scale(node);
        if (!node["__yj_ui_scale"])
            node["__yj_ui_scale"] = scale;

        // 计算单阶段时长（总时长均分四等份）
        const t = this.duration / 4;

        return [
            // 阶段1：快速放大到130%（使用quadOut缓动实现加速效果）
            {
                duration: t,
                to: 1,
                props: {
                    scale: [scale.x * 1.3, scale.y * 1.3]
                },
                easing: 'quadOut'
            },
            // 阶段2：回弹缩小到90%（使用quadIn缓动实现减速效果）
            {
                duration: t,
                to: 1,
                props: {
                    scale: [scale.x * .9, scale.y * .9]
                },
                easing: 'quadIn'
            },
            // 阶段3：二次放大到110%（保持动态节奏）
            {
                duration: t,
                to: 1,
                props: {
                    scale: [scale.x * 1.1, scale.y * 1.1]
                },
                easing: 'quadOut'
            },
            // 阶段4：最终恢复原始尺寸（平滑过渡）
            {
                duration: t,
                to: 1,
                props: {
                    scale: [scale.x, scale.y]
                },
                easing: 'quadIn'
            }];
    }
}

/**
 * 串行动画效果数组类
 */
@ccclass('AnimationEffectArray')
export class AnimationEffectArray {
    @property({
        type: AnimationEffect,
        displayName: "串行动画效果",
        tooltip: `多个动画效果按顺序依次执行，如果设置了串行动画效果，并行动画效果将不会执行
        【执行规则】
        - 前一个动画的onComplete事件触发后才会执行下一个
        - 任一动画中断会导致后续动画取消
        - 支持不同种类动画混合编排`
    })
    serialAnimationEffects: AnimationEffect[] = [];
}

@ccclass('AnimationEffectInfo')
class AnimationEffectInfo {
    @property
    type: string = '';

    @property({
        type: AnimationEffect,
        displayName: "串行动画效果",
        tooltip: `多个动画效果按顺序依次执行，如果设置了串行动画效果，并行动画效果将不会执行
        【执行规则】
        - 前一个动画的onComplete事件触发后才会执行下一个
        - 任一动画中断会导致后续动画取消
        - 支持不同种类动画混合编排
        @示例
        // 先执行淡入再执行移动动画：
        // 1. 添加fadeIn效果，设置duration=0.5
        // 2. 添加moveBy效果，设置duration=1.0`
    })
    serialAnimationEffects: AnimationEffect[] = [];

    @property({
        type: AnimationEffectArray,
        displayName: "并行动画效果",
        tooltip: `多个串行动画效果同时执行
        @示例
        // 同时执行两组动画：
        // 组1: 缩放+旋转
        // 组2: 颜色渐变+抖动
        // 两组动画将并行播放`
    })
    parallelAnimationEffects: AnimationEffectArray[] = [];

    @property({
        displayName: '执行次数',
        tooltip: '0表示无限循环，1表示执行一次，2表示执行两次，以此类推\n@示例\n// 设置repeat=0创建无限旋转的加载动画\n// 设置repeat=2让按钮抖动两次后停止',
        min: 0,
        step: 1
    })
    repeat: number = 1;


}

/**
 * UI动画效果组件
 */
@ccclass('YJUIAnimationEffect')
@executeInEditMode()
export class YJUIAnimationEffect extends Component {
    @property({
        type: Node,
        displayName: '目标节点',
        tooltip: '不设置则使用当前节点\n@示例\n// 在编辑器中拖拽其他节点到此属性\n// 或通过代码指定：\n// this.node.getComponent(YJUIAnimationEffect).target = someNode'
    })
    target: Node = null;

    @property({
        displayName: '作用在子节点上',
        tooltip: '当启用时，动画效果将作用于目标节点的所有子节点\n@示例\n// 菜单容器所有子项执行序列动画\n// 每个菜单项会依次执行入场效果'
    })
    onChildren: boolean = false;

    @property({
        type: AnimationEffectInfo,
        displayName: "动画效果",
        tooltip: "动画效果配置"
    })
    animationEffectInfos: AnimationEffectInfo[] = [];

    // @property({
    //     type: AnimationEffect,
    //     displayName: "串行动画效果",
    //     tooltip: `多个动画效果按顺序依次执行，如果设置了串行动画效果，并行动画效果将不会执行
    //     【执行规则】
    //     - 前一个动画的onComplete事件触发后才会执行下一个
    //     - 任一动画中断会导致后续动画取消
    //     - 支持不同种类动画混合编排
    //     @示例
    //     // 先执行淡入再执行移动动画：
    //     // 1. 添加fadeIn效果，设置duration=0.5
    //     // 2. 添加moveBy效果，设置duration=1.0`
    // })
    // serialAnimationEffects: AnimationEffect[] = [];

    // @property({
    //     type: AnimationEffectArray,
    //     displayName: "并行动画效果",
    //     tooltip: `多个串行动画效果同时执行
    //     @示例
    //     // 同时执行两组动画：
    //     // 组1: 缩放+旋转
    //     // 组2: 颜色渐变+抖动
    //     // 两组动画将并行播放`
    // })
    // parallelAnimationEffects: AnimationEffectArray[] = [];

    // @property({
    //     displayName: '执行次数',
    //     tooltip: '0表示无限循环，1表示执行一次，2表示执行两次，以此类推\n@示例\n// 设置repeat=0创建无限旋转的加载动画\n// 设置repeat=2让按钮抖动两次后停止',
    //     min: 0,
    //     step: 1
    // })
    // repeat: number = 1;

    @property({
        displayName: '自动运行',
        tooltip: '组件启用时自动开始播放动画\n@示例\n// 用于场景开场动画自动播放\n// 或敌人出现时自动执行特效'
    })
    auto: boolean = false;

    onLoad() {
        // 编辑器环境下自动关联相关组件
        if (EDITOR && !this.target) {
            const a = this.getComponent('SetList')
                || this.getComponent('SetCreateNode')
                || this.getComponent('SetNodesSwitch')
                || this.getComponent('SetSpriteFrameInSampler2D');
            if (a && !a['uiAnim']) a['uiAnim'] = this;  // 在编辑器扩展中自动绑定动画控制器
        }
    }

    onEnable() {
        // 运行时自动播放逻辑（编辑器模式下不执行）
        if (EDITOR) return;
        if (this.auto) {
            if (this.onChildren) {
                this.playOnChildren(this.node, this.animationEffectInfos[0]);  // 示例：用于菜单子项集体入场动画
            } else {
                this.play(this.node, this.animationEffectInfos[0]);  // 示例：单个UI元素的自动展示动画
            }
        }
    }

    onDisable() {
        // 当组件被禁用时自动停止所有动画
        // @实现说明 使用TweenSet.stop确保完全停止节点上的所有缓动
        // @示例 场景切换时自动停止正在进行的UI动画
        no.TweenSet.stop(this.node);
    }

    /**
     * 播放或停止动画（根据参数切换状态）
     * @param v true-播放 false-停止
     * @使用场景 
     * - 按钮控制动画启停
     * - 条件触发动画状态切换
     * @示例 
     * // 开关按钮点击事件
     * this.a_playOrStop(toggle.isChecked);
     * 
     * // 角色受伤时停止当前动画
     * if(isDamaged) this.a_playOrStop(false);
     */
    public a_playOrStop(v: boolean) {
        if (v) {
            this.a_play();
        } else {
            this.a_stop();
        }
    }

    /**
     * 播放动画核心方法
     * @实现流程
     * 1. 检查组件启用状态
     * 2. 确定目标节点（优先使用target属性指定节点）
     * 3. 根据onChildren设置决定播放模式
     * @注意
     * - 受enabled属性控制
     * - 自动处理节点有效性验证
     * @示例
     * // 播放当前节点动画
     * this.a_play();
     * 
     * // 播放指定子节点动画
     * this.target = childNode;
     * this.a_play();
     */
    public a_play(type?: string) {
        if (!this.enabled) return;
        this.a_stop();
        let info: AnimationEffectInfo;
        if (type) {
            info = this.animationEffectInfos.find(i => i.type === type);
        } else {
            info = this.animationEffectInfos[0];
        }

        const node = this.target || this.node;
        if (this.onChildren) {
            this.playOnChildren(node, info);
        } else {
            this.play(node, info);
        }
    }

    /**
     * 停止动画核心方法
     * @特性
     * - 立即停止所有关联缓动
     * - 自动清理动画队列
     * @使用场景
     * - 强制中断动画
     * - 配合a_playOrStop使用
     * @示例
     * // 紧急停止所有动画
     * this.a_stop();
     * 
     * // 窗口关闭时停止动画
     * popup.onClose = () => this.a_stop();
     */
    public a_stop() {
        no.TweenSet.stop(this.node);
    }

    /**
     * 播放动画核心逻辑
     * @param node 目标节点
     * @实现逻辑
     * 1. 检查动画是否启用
     * 2. 根据动画效果数组类型选择播放模式：
     *    - 存在串行效果时优先执行串行动画
     *    - 否则执行并行动画
     * @参数说明
     * - node: 需要执行动画的节点对象
     * @示例
     * // 在按钮节点上播放默认动画
     * this.play(buttonNode);
     * 
     * // 当有串行动画配置时自动触发序列播放
     * this.serialAnimationEffects = [effect1, effect2];
     * this.play(panelNode); // 按顺序执行effect1->effect2
     */
    public play(node: Node, info: AnimationEffectInfo) {
        if (!this.enabled) return;
        if (info.serialAnimationEffects.length > 0)
            this.playSerial(node, info);
        else
            this.playParallel(node, info);
    }

    public playOtherNode(node: Node) {
        const info = this.animationEffectInfos[0];
        if (info.serialAnimationEffects.length > 0)
            this.playSerial(node, info);
        else
            this.playParallel(node, info);
    }

    /**
     * 子节点动画播放器
     * @param node 父级容器节点
     * @实现逻辑
     * 1. 获取所有子节点
     * 2. 使用定时器按0.1秒间隔逐个播放子节点动画
     * 3. 自动处理子节点索引递增
     * @适用场景
     * - 列表项依次入场动画
     * - 批量子元素动画播放
     * @示例
     * // 使菜单项逐个下落出现
     * this.playOnChildren(menuContainer);
     * 
     * // 配合schedule实现间隔0.1秒的播放节奏
     * this.schedule(() => {...}, 0.1, count);
     */
    public playOnChildren(node: Node, info: AnimationEffectInfo) {
        if (!this.enabled) return;
        const children = node.children;
        let i = 0;
        this.schedule(() => {
            this.play(children[i++], info);
        }, 0.1, children.length - 1);
    }

    /**
     * 串行动画播放控制器
     * @param node 目标节点
     * @param repeat 剩余重复次数
     * @实现逻辑
     * 1. 调用内部播放器执行动画序列
     * 2. 根据repeat参数决定是否循环：
     *    - repeat=0时无限循环
     *    - repeat>0时递减直到0停止
     * @示例
     * // 创建3次循环的进度条动画
     * this.repeat = 3;
     * this.playSerial(progressBar, 3);
     */
    private playSerial(node: Node, info: AnimationEffectInfo) {
        let repeat = info.repeat;
        this._playSerial(node, info.serialAnimationEffects, () => {
            if (info.repeat == 0 || --repeat > 0) this.playParallel(node, info);
        });
    }

    /**
     * 并行动画播放控制器
     * @param node 目标节点 
     * @param repeat 剩余重复次数
     * @实现逻辑
     * 1. 验证节点有效性
     * 2. 并行执行所有动画序列
     * 3. 使用计数器等待所有动画完成
     * 4. 达到条件后触发循环
     * @示例
     * // 同时执行旋转和缩放动画
     * this.parallelAnimationEffects = [rotateEffect, scaleEffect];
     * this.playParallel(iconNode, 2); // 重复2次
     */
    private playParallel(node: Node, info: AnimationEffectInfo) {
        if (!isValid(node)) return;
        let all = info.parallelAnimationEffects.length,
            n = 0;
        for (let i = 0; i < all; i++) {
            const a = info.parallelAnimationEffects[i];
            this._playSerial(node, a.serialAnimationEffects, () => {
                n++;
            });
        }
        let repeat = info.repeat;
        no.scheduleUpdateCheck(() => {
            return n === all;
        }, () => {
            if (info.repeat == 0 || --repeat > 0) this.playParallel(node, info);
        }, this);
    }

    /**
     * 串行动画执行器（实际播放逻辑）
     * @param node 目标节点
     * @param serialAnimationEffects 动画效果数组
     * @param onEnd 完成回调
     * @实现细节
     * 1. 拼接所有动画效果的tween配置
     * 2. 通过TweenSet执行动画序列
     * 3. 动画完成后触发回调
     * @示例
     * // 执行移动+旋转的复合动画
     * const effects = [moveEffect, rotateEffect];
     * this._playSerial(node, effects, () => {
     *   console.log('动画序列完成');
     * });
     */
    private _playSerial(node: Node, serialAnimationEffects: AnimationEffect[], onEnd?: () => void) {
        if (!isValid(node)) return;
        let a: any[] = [];
        for (let i = 0; i < serialAnimationEffects.length; i++) {
            a = a.concat(serialAnimationEffects[i].getTweenSet(node));
        }
        no.TweenSet.play(no.parseTweenData(a, node), () => {
            onEnd?.();
        });
    }
}


