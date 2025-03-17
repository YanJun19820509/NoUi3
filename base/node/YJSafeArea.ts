
import { ccclass, requireComponent, property, sys, Widget, SafeArea, UITransform, widgetManager, isValid } from '../../yj';
import { EDITOR } from 'cc/env';
import { YJFitScreen } from '../YJFitScreen';

/**
 * Predefined variables
 * Name = YJSafeArea
 * DateTime = Mon Apr 11 2022 09:42:28 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSafeArea.ts
 * FileBasenameNoExtension = YJSafeArea
 * URL = db://assets/NoUi3/base/node/YJSafeArea.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 竖屏下原生SafeArea组件会留出顶部和底部空间，当useOrigin为false时，则不会留出底部空间。横屏时与原生效果无异。
 */
@ccclass('YJSafeArea')
@requireComponent(Widget)
/**
 * 安全区域适配组件（增强版）
 * @remarks
 * - 继承原生SafeArea并扩展竖屏模式下的控制能力
 * - 在竖屏模式下可选择保留顶部/底部安全区域（原生组件会同时保留上下）
 * - 横屏模式保持原生SafeArea行为
 * - 通过Widget组件实现动态适配
 * 
 * @example
 * // 场景1：全面屏手机底部导航栏适配
 * // 开启safeBottom保留底部安全区域，避免内容被虚拟按键遮挡
 * 
 * // 场景2：带刘海的横屏游戏界面
 * // 使用默认配置自动避开左右安全区域，保持横屏显示完整内容
 * 
 * // 场景3：竖屏弹窗界面
 * // 开启safeTop保留顶部状态栏区域，safeBottom关闭以使用全屏高度
 */
export class YJSafeArea extends SafeArea {
    @property({ tooltip: '保留顶部安全区域（竖屏模式下有效）' })
    safeTop: boolean = false;
    @property({ tooltip: '保留底部安全区域（竖屏模式下有效）' })
    safeBottom: boolean = false;

    /**
     * 更新安全区域适配
     * @remarks
     * 执行流程：
     * 1. 校验节点有效性
     * 2. 获取Widget和UITransform组件
     * 3. 编辑器环境下初始化Widget对齐设置
     * 4. 运行时环境：
     *    - 竖屏模式根据配置计算顶部/底部留白
     *    - 横屏模式保持原生安全区域行为
     *    - 通过调整锚点保持节点位置稳定
     * 
     * @example
     * // 手动触发安全区域更新：
     * this.getComponent(YJSafeArea)?.updateArea();
     * 
     * // 监听屏幕旋转事件：
     * screen.onOrientationChange(() => {
     *     this.scheduleOnce(() => this.getComponent(YJSafeArea)?.updateArea());
     * });
     */
    public updateArea() {
        // TODO 未来版本需要移除对Widget组件的依赖
        if (!isValid(this.node)) return;
        
        // 获取布局组件和变换组件
        const widget = this.node.getComponent(Widget) as Widget;
        const uiTransComp = this.node.getComponent(UITransform) as UITransform;
        if (!widget || !uiTransComp) {
            return;
        }

        // 编辑器环境下初始化对齐设置
        if (EDITOR) {
            widget.top = widget.bottom = widget.left = widget.right = 0;
            widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
            return;
        }

        // 启用全方向对齐
        widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
        
        // 获取可视区域和系统安全区域
        const visibleSize = YJFitScreen.getVisibleSize();
        const screenWidth = visibleSize.width;
        const screenHeight = visibleSize.height;
        const safeArea = sys.getSafeAreaRect();

        // 竖屏模式特殊处理
        if (screenHeight > screenWidth) {
            // 计算顶部留白（屏幕高度 - 安全区域Y轴起点 - 安全区域高度）
            widget.top = this.safeTop ? screenHeight - safeArea.y - safeArea.height : 0;
            // 底部留白直接取安全区域Y轴起点（即底部安全区域高度）
            widget.bottom = this.safeBottom ? safeArea.y : 0;
        } else {
            // 横屏模式保持原生行为（当前注释保留未来扩展可能性）
            // widget.left = safeArea.x;
            // widget.right = screenWidth - safeArea.x - safeArea.width;
        }

        // 通过锚点调整保持节点位置稳定
        const lastPos = this.node.position.clone();
        const lastAnchorPoint = uiTransComp.anchorPoint.clone();
        this.scheduleOnce(() => {
            // 计算新的锚点位置（补偿因尺寸变化导致的位移）
            const curPos = this.node.position.clone();
            const anchorX = lastAnchorPoint.x - (curPos.x - lastPos.x) / uiTransComp.width;
            const anchorY = lastAnchorPoint.y - (curPos.y - lastPos.y) / uiTransComp.height;
            uiTransComp.setAnchorPoint(anchorX, anchorY);
        });

        // 强制更新Widget管理器（确保布局立即生效）
        widgetManager.add(widget);
    }
}
