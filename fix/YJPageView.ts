
import { ccclass, property, menu, PageView, Vec2, EventTouch, UITransform, Layout, Vec3 } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { no } from '../no';
import { Node } from 'cc';
import { YJIndicator } from '../widget/indicator/YJIndicator';

/**
 * Predefined variables
 * Name = YJPageView
 * DateTime = Fri Jan 14 2022 18:27:34 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPageView.ts
 * FileBasenameNoExtension = YJPageView
 * URL = db://assets/Script/common/fix/YJPageView.ts
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
    @property({ type: YJIndicator })
    yjIndicator: YJIndicator = null;
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

    private _needUpdateView: boolean = true;
    private _needUpdataIndicator: boolean = false;
    private _pageCount: number = 0;

    private _viewSize: number;

    private _layout: Layout;
    // private _touchStartPos: Vec2;
    // private _contentTouchStartPos: Vec3 = new Vec3();

    lateUpdate(dt: number) {
        super.lateUpdate?.(dt);
        if (this._needUpdataIndicator) {
            this._needUpdataIndicator = false;
            this.updateIndicator();
        }
    }

    // /**
    //  * 触摸开始事件处理
    //  * @param event 触摸事件
    //  * @param start 起始坐标
    //  * @param end 结束坐标
    //  * @description 初始化总页数，用于后续边界判断
    //  */
    // public a_onTouchDown(event: EventTouch) {
    //     this._touchStartPos = event.getLocation();
    //     this.content.getPosition(this._contentTouchStartPos);
    // }

    // /**
    //  * 触摸移动事件处理
    //  * @param event 触摸事件
    //  * @param start 起始坐标
    //  * @param end 结束坐标
    //  * @description 实时更新内容位置并限制边界
    //  * @example
    //  * // 水平滑动时：
    //  * // - 限制content的x坐标在 [nodeWidth - contentWidth, 0] 范围内
    //  * // 垂直滑动时：
    //  * // - 限制content的y坐标在 [0, nodeHeight - contentHeight] 范围内
    //  */
    // public a_onTouchMove(event: EventTouch) {
    //     const start = this._touchStartPos;
    //     const end = event.getLocation();
    //     if (this.direction == PageView.Direction.Horizontal) {
    //         let x = this._contentTouchStartPos.x + end.x - start.x;
    //         no.x(this.content, x);
    //     } else if (this.direction == PageView.Direction.Vertical) {
    //         let y = this._contentTouchStartPos.y + end.y - start.y;
    //         no.y(this.content, y);
    //     }
    // }

    // /**
    //  * 触摸结束事件处理
    //  * @param event 触摸事件
    //  * @param start 起始坐标
    //  * @param end 结束坐标
    //  * @description 根据滑动距离判断是否需要切换页面
    //  * @example
    //  * // 水平滑动：
    //  * // - 向右滑动超过offset：切换到上一页
    //  * // - 向左滑动超过offset：切换到下一页
    //  * // 垂直滑动：
    //  * // - 向上滑动超过offset：切换到下一页
    //  * // - 向下滑动超过offset：切换到上一页
    //  */
    // public a_onTouchEnd(event: EventTouch) {
    //     const start = this._touchStartPos;
    //     const end = event.getLocation();
    //     let i = this._curPageIdx;
    //     if (this.direction == PageView.Direction.Horizontal) {
    //         if (end.x - start.x > this.offset) i--;
    //         else if (start.x - end.x > this.offset) i++;
    //     }
    //     else if (this.direction == PageView.Direction.Vertical) {
    //         if (end.y - start.y > this.offset) i++;
    //         else if (start.y - end.y > this.offset) i--;
    //     }
    //     this.scrollToPage(i, 0.1);
    // }

    // /**
    //  * 触摸取消事件处理（直接调用触摸结束逻辑）
    //  */
    // public a_onTouchCancel(event: EventTouch) {
    //     this.a_onTouchEnd(event);
    // }

    /**
     * 立即跳转到指定页面
     * @param idx 目标页面索引
     * @example
     * // 跳转到第二页：
     * pageView.a_show(1);
     */
    public a_show(idx: number) {
        if (idx == this._curPageIdx) return;
        this.scrollToPage(idx, 0.1);
    }

    // /**
    //  * 移除所有页面并销毁
    //  * @description 用于手动释放页面资源
    //  */
    // public a_removeAllPages() {
    //     let pages = this.getPages();
    //     if (pages) {
    //         for (let i = 0; i < pages.length; i++) {
    //             pages[i].destroy();
    //         }
    //     }
    // }

    private _idx: number = 0;
    onLoad() {
        // 注册滚动结束事件监听
        this.node.on(PageView.EventType.SCROLL_ENDED, this.onScrollEnded, this);
        // this.node.on(Node.EventType.TOUCH_START, this.a_onTouchDown, this);
        // this.node.on(Node.EventType.TOUCH_MOVE, this.a_onTouchMove, this);
        // this.node.on(Node.EventType.TOUCH_END, this.a_onTouchEnd, this);
        // this.node.on(Node.EventType.TOUCH_CANCEL, this.a_onTouchCancel, this);
        // 分帧创建页面预制体（避免卡顿）
        this._idx = 0;
        this.schedule(() => {
            this.createPage();
        }, 0.05, this.pagePrefabs.length - 1);
    }

    onDisable() {
        if (!this.releasePagesOnDisable) return;
        this.removeAllPages();
    }

    onDestroy() {
        this.node.targetOff(this);
    }

    private get layout(): Layout {
        if (!this._layout) {
            this._layout = this.content.getComponent(Layout);
        }
        return this._layout;
    }

    private get viewSize() {
        if (!this._viewSize) {
            if (this.direction === PageView.Direction.Horizontal) {
                this._viewSize = no.width(this.node);
            } else {
                this._viewSize = no.height(this.node);
            }
        }
        return this._viewSize;
    }

    private updateIndicator() {
        if (this.yjIndicator) {
            this.yjIndicator.initWithData({ num: this._pageCount, cur: this._curPageIdx });
        }
    }

    public initPageView(pageSize: number, showIndex: number) {
        if (this.direction === PageView.Direction.Horizontal) {
            no.width(this.content, this.viewSize * pageSize);
        } else {
            no.height(this.content, this.viewSize * pageSize);
        }
        this.yjIndicator?.clear().initWithData({ num: pageSize, cur: showIndex });
        this._curPageIdx = showIndex;
    }

    /**
     * 异步创建单个页面
     * @param i 预制体数组索引
     * @description 加载流程：
     * 1. 加载预制体
     * 2. 加载关联资源
     * 3. 添加到PageView
     */
    private async createPage() {
        let p = this.pagePrefabs[this._idx++];
        if (!p) return;
        let n = await p.loadPrefab();
        if (!this?.node?.isValid) return;
        await n.getComponent(YJLoadAssets)?.load();
        if (!this?.node?.isValid) return;
        this.addPage(n);
    }

    private setPagePos(page: Node, index: number) {
        page['__pageIdx'] = index;
        if (this.direction === PageView.Direction.Horizontal) {
            no.x(page, this.viewSize * (index + .5))
        } else {
            no.y(page, this.viewSize * (index + .5))
        }
    }

    public moveToPage(idx: number) {
        this.scrollToOffset(this._moveOffsetValue(idx), 0, true);
    }

    public scrollToPage(idx: number, timeInSecond = 0.3) {
        if (idx < 0 || idx >= this._pages.length) {
            return;
        }

        this._curPageIdx = idx;
        this.scrollToOffset(this._moveOffsetValue(idx), timeInSecond, true);
        this._needUpdataIndicator = true;
    }

    /**
     * 滚动结束事件回调
     * @description 触发onPageChanged事件
     */
    private onScrollEnded() {
        no.EventHandlerInfo.execute(this.onPageChanged, this.curPageIdx);
    }

    public addPage(page: Node): void {
        if (!this._needUpdateView) {
            if (page['__pageIdx'] == undefined)
                this.setPagePos(page, this._pages.length);
        }
        this._pageCount++;
        super.addPage(page);
    }

    public insertPage(page: Node, index: number): void {
        if (!this._needUpdateView) {
            this.setPagePos(page, index);
        }
        if (index < this._pageCount) {
            this._pageCount++;
        }
        super.insertPage(page, index);
    }

    public removePageAtIndex(index: number): void {
        this.markUpdatePageView();
        if (index < this._pageCount) {
            this._pageCount--;
        }
        super.removePageAtIndex(index);
    }

    protected _updatePageView() {
        // 当页面数组变化时修改 content 大小
        if (!this.content) {
            return;
        }

        const pageCount = this._pages.length;
        // 进行排序
        const contentPos = this._initContentPos;
        for (let i = 0; i < pageCount; ++i) {
            const page = this._pages[i];
            // page.setSiblingIndex(i);
            const pos = page.position;
            if (this.direction === PageView.Direction.Horizontal) {
                this._scrollCenterOffsetX[i] = Math.abs(contentPos.x + pos.x);
            } else {
                this._scrollCenterOffsetY[i] = Math.abs(contentPos.y + pos.y);
            }
        }

        if (this._needUpdateView) {
            if (this._curPageIdx >= pageCount) {
                this._curPageIdx = pageCount === 0 ? 0 : pageCount - 1;
                this._lastPageIdx = this._curPageIdx;
            }
            this._needUpdataIndicator = true;
        }
    }

    public markNotUpdatePageView() {
        this._needUpdateView = false;
        this.layout.enabled = false;
    }

    public markUpdatePageView() {
        this._needUpdateView = true;
        this.layout.enabled = true;
    }
}
