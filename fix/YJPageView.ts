
import { ccclass, property, menu, PageView, Vec2, EventTouch, UITransform } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { no } from '../no';

/**
 * Predefined variables
 * Name = YJPageView
 * DateTime = Fri Jan 14 2022 18:27:34 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPageView.ts
 * FileBasenameNoExtension = YJPageView
 * URL = db://assets/Script/NoUi3/fix/YJPageView.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJPageView')
@menu('NoUi/fix/YJPageView(修正拖动问题)')
/**
 * 增强版PageView组件，主要功能：
 * 1. 修复原生PageView快速拖动异常问题
 * 2. 支持预加载页面预制体
 * 3. 提供页面切换事件回调
 * 4. 支持禁用时自动释放页面资源
 * 
 * @example
 * // 编辑器设置示例：
 * // - pagePrefabs: 添加需要预加载的页面预制体组件
 * // - offset: 50 (滑动超过50像素触发翻页)
 * 
 * // 代码使用示例：
 * const pageView = this.node.getComponent(YJPageView);
 * pageView.a_show(2); // 跳转到第三页
 */
export class YJPageView extends PageView {
    /** 触发页面切换的最小滑动距离（单位：像素） */
    @property({ displayName: '触发切换的偏移量' })
    offset: number = 30;

    /** 页面预制体加载配置数组（支持异步加载） */
    @property({ type: YJLoadPrefab })
    pagePrefabs: YJLoadPrefab[] = [];

    /** 是否在组件禁用时自动释放所有页面资源（默认true） */
    @property
    releasePagesOnDisable: boolean = true;

    /** 页面切换完成事件（参数：当前页码） */
    @property({ type: no.EventHandlerInfo })
    onPageChanged: no.EventHandlerInfo[] = [];

    private max: number; // 总页数缓存

    /**
     * 触摸开始事件处理
     * @param event 触摸事件
     * @param start 起始坐标
     * @param end 结束坐标
     * @description 初始化总页数，用于后续边界判断
     */
    public a_onTouchDown(event: Event, start: Vec2, end: Vec2) {
        this.max = this.getPages().length;
    }

    /**
     * 触摸移动事件处理
     * @param event 触摸事件
     * @param start 起始坐标
     * @param end 结束坐标
     * @description 实时更新内容位置并限制边界
     * @example
     * // 水平滑动时：
     * // - 限制content的x坐标在 [nodeWidth - contentWidth, 0] 范围内
     * // 垂直滑动时：
     * // - 限制content的y坐标在 [0, nodeHeight - contentHeight] 范围内
     */
    public a_onTouchMove(event: EventTouch, start: Vec2, end: Vec2) {
        const nodeTransform = this.node.getComponent(UITransform);
        const contentTransform = this.content.getComponent(UITransform);
        if (this.direction == PageView.Direction.Horizontal) {
            let x = this.content.position.x;
            x += event.getDeltaX();
            if (x > 0) x = 0;
            else if (x < nodeTransform.width - contentTransform.width) x = nodeTransform.width - contentTransform.width;
            this.content.setPosition(x, this.content.position.y);
        } else if (this.direction == PageView.Direction.Vertical) {
            let y = this.content.position.y;
            y += event.getDeltaY();
            if (y < 0) y = 0;
            else if (y > nodeTransform.height - contentTransform.height) y = nodeTransform.height - contentTransform.height;
            this.content.setPosition(this.content.position.x, y);
        }
    }

    /**
     * 触摸结束事件处理
     * @param event 触摸事件
     * @param start 起始坐标
     * @param end 结束坐标
     * @description 根据滑动距离判断是否需要切换页面
     * @example
     * // 水平滑动：
     * // - 向右滑动超过offset：切换到上一页
     * // - 向左滑动超过offset：切换到下一页
     * // 垂直滑动：
     * // - 向上滑动超过offset：切换到下一页
     * // - 向下滑动超过offset：切换到上一页
     */
    public a_onTouchEnd(event: EventTouch, start: Vec2, end: Vec2) {
        let i = this.getCurrentPageIndex();
        if (this.direction == PageView.Direction.Horizontal) {
            if (end.x - start.x > this.offset) i--;
            else if (start.x - end.x > this.offset) i++;
            if (i < 0) i = 0;
        }
        else if (this.direction == PageView.Direction.Vertical) {
            if (end.y - start.y > this.offset) i++;
            else if (start.y - end.y > this.offset) i--;
            if (i < 0) i = 0;
        }

        else if (i >= this.max) i = this.max - 1;
        this.scrollToPage(i, 0.1);
    }

    /**
     * 触摸取消事件处理（直接调用触摸结束逻辑）
     */
    public a_onTouchCancel(event: EventTouch, start: Vec2, end: Vec2) {
        this.a_onTouchEnd(event, start, end);
    }

    /**
     * 立即跳转到指定页面
     * @param idx 目标页面索引
     * @example
     * // 跳转到第二页：
     * pageView.a_show(1);
     */
    public a_show(idx: number) {
        if (this.curPageIdx == idx) return;
        this.scrollToPage(idx, 0.1);
    }

    /**
     * 移除所有页面并销毁
     * @description 用于手动释放页面资源
     */
    public a_removeAllPages() {
        let pages = this.getPages();
        if (pages) {
            for (let i = 0; i < pages.length; i++) {
                pages[i].destroy();
            }
        }
    }

    onLoad() {
        // 注册滚动结束事件监听
        this.node.on(PageView.EventType.SCROLL_ENDED, this.onScrollEnded, this);
        // 分帧创建页面预制体（避免卡顿）
        let i = 0;
        this.schedule(() => {
            this.createPage(i++);
        }, 0.05, this.pagePrefabs.length - 1);
    }

    onDisable() {
        if (!this.releasePagesOnDisable) return;
        this.a_removeAllPages();
    }

    onDestroy() {
        this.node.targetOff(this);
    }

    /**
     * 异步创建单个页面
     * @param i 预制体数组索引
     * @description 加载流程：
     * 1. 加载预制体
     * 2. 加载关联资源
     * 3. 添加到PageView
     */
    private async createPage(i: number) {
        let p = this.pagePrefabs[i];
        if (!p) return;
        let n = await p.loadPrefab();
        if (!this?.node?.isValid) return;
        await n.getComponent(YJLoadAssets)?.load();
        if (!this?.node?.isValid) return;
        this.addPage(n);
    }

    /**
     * 滚动结束事件回调
     * @description 触发onPageChanged事件
     */
    private onScrollEnded() {
        no.EventHandlerInfo.execute(this.onPageChanged, this.curPageIdx);
    }
}
