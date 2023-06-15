
import { _decorator, PageView, Vec2, EventTouch, UITransform } from './yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { no } from '../no';
const { ccclass, property, menu } = _decorator;

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
export class YJPageView extends PageView {
    @property({ displayName: '触发切换的偏移量' })
    offset: number = 30;

    @property({ type: YJLoadPrefab })
    pagePrefabs: YJLoadPrefab[] = [];

    @property
    releasePagesOnDisable: boolean = true;

    @property({ type: no.EventHandlerInfo })
    onPageChanged: no.EventHandlerInfo[] = [];

    private max: number;

    public a_onTouchDown(event: Event, start: Vec2, end: Vec2) {
        this.max = this.getPages().length;
    }

    public a_onTouchMove(event: EventTouch, start: Vec2, end: Vec2) {
        if (this.direction == PageView.Direction.Horizontal) {
            let x = this.content.position.x;
            x += event.getDeltaX();
            if (x > 0) x = 0;
            else if (x < this.node.getComponent(UITransform).width - this.content.getComponent(UITransform).width) x = this.node.getComponent(UITransform).width - this.content.getComponent(UITransform).width;
            this.content.setPosition(x, this.content.position.y);
        } else if (this.direction == PageView.Direction.Vertical) {
            let y = this.content.position.y;
            y += event.getDeltaY();
            if (y < 0) y = 0;
            else if (y > this.content.getComponent(UITransform).height - this.node.getComponent(UITransform).height) y = this.content.getComponent(UITransform).height - this.node.getComponent(UITransform).height;
            this.content.setPosition(this.content.position.x, y);
        }
    }

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

    public a_onTouchCancel(event: EventTouch, start: Vec2, end: Vec2) {
        this.a_onTouchEnd(event, start, end);
    }

    public a_show(idx: number) {
        if (this.curPageIdx == idx) return;
        this.scrollToPage(idx, 0.1);
    }

    public a_removeAllPages() {
        let pages = this.getPages();
        pages?.forEach(p => {
            p.destroy();
        });
    }

    onLoad() {
        this.node.on(PageView.EventType.SCROLL_ENDED, this.onScrollEnded, this);
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

    private async createPage(i: number) {
        let p = this.pagePrefabs[i];
        if (!p) return;
        let n = await p.loadPrefab();
        if (!this?.node?.isValid) return;
        await n.getComponent(YJLoadAssets)?.load();
        if (!this?.node?.isValid) return;
        this.addPage(n);
    }

    private onScrollEnded() {
        no.EventHandlerInfo.execute(this.onPageChanged, this.curPageIdx);
    }
}
