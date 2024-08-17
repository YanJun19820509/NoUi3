
import { ccclass, property, menu, executeInEditMode, EDITOR, Node, instantiate, ScrollView, Size, UITransform, Layout, size, isValid, v3 } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJDataWork } from '../base/YJDataWork';
import { YJJobManager } from '../base/YJJobManager';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetCreateNode } from './SetCreateNode';
import { YJUIAnimationEffect } from '../base/ani/YJUIAnimationEffect';

/**
 * Predefined variables
 * Name = SetList
 * DateTime = Mon Jan 17 2022 10:55:33 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetList.ts
 * FileBasenameNoExtension = SetList
 * URL = db://assets/Script/NoUi3/fuckui/SetList.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetList')
@menu('NoUi/ui/SetList(设置列表:array)')
@executeInEditMode()
export class SetList extends FuckUi {

    @property({ type: YJLoadPrefab, displayName: '元素容器', tooltip: '管理列表子项布局的容器，需要挂载SetCreateNode组件' })
    itemPanel: YJLoadPrefab = null;
    @property({ type: Node, displayName: '元素模板' })
    template: Node = null;

    @property({ displayName: '列数', step: 1, min: 1 })
    columnNumber: number = 1;

    @property({ tooltip: '仅第一次创建时有创建间隔' })
    onlyFirstTime: boolean = false;
    @property({ displayName: '创建间隔(s)', step: .01, min: 0 })
    wait: number = 0;

    @property({ displayName: '播放动效', type: YJUIAnimationEffect, tooltip: '没有指定则不播放动效' })
    uiAnim: YJUIAnimationEffect = null;

    @property({ type: no.EventHandlerInfo, displayName: '创建完成回调' })
    onComplete: no.EventHandlerInfo[] = [];

    @property(ScrollView)
    scrollView: ScrollView = null;
    @property(Node)
    content: Node = null;
    @property({ displayName: 'content扩展' })
    offset: Size = size();
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;
    @property(YJLoadAssets)
    loadAsset: YJLoadAssets = null;

    @property({ displayName: '数据更新时自动回滚到第1个' })
    autoScrollBack: boolean = false;

    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = true;
    @property({ tooltip: 'enable时重新创建子节点', visible() { return this.clearOnDisable; } })
    recreateOnEnable: boolean = false;

    @property({ displayName: '设置元素模板相关数据' })
    public get setTemplateInfo(): boolean {
        return false;
    }
    
    public set setTemplateInfo(v: boolean) {
        this.preInitItems();
    }
    @property({ displayName: '所需元素节点个数', readonly: true })
    showMax: number = 0;
    @property({ visible() { return false; } })
    itemSize: Size = size();


    private listData: any[];
    // private listItems: Node[] = [];
    private isVertical: boolean;
    /**
     * 横向时指宽，纵向时指高
     */
    private contentSize: number;
    private showNum: number;//实际最多可显示的itemPanel个数
    private allNum: number;
    /**
     * node最后的位置，横向时指x，纵向时指y
     */
    private lastIndex: number = 0;
    private _loaded: boolean = false;
    private isFirst: boolean = true;
    private waitTime: number;
    private _isSettingData: boolean = false;
    private scrollViewContent: Node;

    async onLoad() {
        super.onLoad();
        if (EDITOR) {
            if (!this.itemPanel) this.itemPanel = this.getComponent(YJLoadPrefab);
            if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
            if (!this.loadAsset) this.loadAsset = no.getComponentInParents(this.node, YJLoadAssets);
            return;
        }
        if (!this.template) {
            this.template = await this.itemPanel.loadPrefab();
            if (!this?.node?.isValid) return;
            this.preInitItems();
        }
        if (this.showMax == 0)
            this.preInitItems();
        this.isVertical = this.scrollView.vertical;
        if (!this.content)
            this.content = this.scrollView.content;
        this.scrollViewContent = this.scrollView.content;
        this._loaded = true;
        this.scrollView.node.on(ScrollView.EventType.SCROLLING, () => {
            this.updatePos();
        }, this);
    }

    onEnable() {
        if (EDITOR) return;
        if (this._isSettingData) return;
        if (this.clearOnDisable && this.recreateOnEnable) {
            this.resetData();
        }
    }

    onDisable() {
        if (EDITOR) return;
        if (this._isSettingData) return;
        this.a_clearData();
        if (this.clearOnDisable) {
            this.clearItems();
        }
    }

    public clearItems() {
        this.content?.setPosition(0, 0);
        this.content?.children.forEach(item => {
            item.destroy();
        });
    }

    onDestroy() {
        if (EDITOR) return;
        if (this.template && this.template.isValid)
            this.template.destroy();
    }

    protected async onDataChange(data: any) {
        let a = [].concat(data);
        if (this.isFirst && a.length == 0) {
            no.EventHandlerInfo.execute(this.onComplete);
            return;
        }
        this._isSettingData = true;
        if (this.onlyFirstTime) {
            if (this.isFirst) {
                this.waitTime = this.wait;
            } else this.waitTime = 0;
        } else {
            this.waitTime = this.wait;
        }
        this.isFirst = false;
        this.unscheduleAllCallbacks();
        if (!this?.node?.isValid) return;
        await no.waitFor(() => { return this._loaded; }, this);
        if (!this?.node?.isValid || !this?.content?.isValid) return;
        let listItems = this.content.children;
        if (this.waitTime > 0) {
            for (let i = 0, n = listItems.length; i < n; i++) {
                let item = listItems[i];
                no.visible(item.children[0], false);
            }
        }
        if (this.columnNumber > 1) {
            a = no.arrayToArrays(a, this.columnNumber);
        }
        if (listItems.length == 0) {
            this.allNum = a.length;
            this.showNum = this.showMax;
            await this.initItems();
            if (!this?.node?.isValid) return;
        } else if (this.autoScrollBack || this.allNum != a.length) {
            this.lastIndex = 0;
            no.position(this.scrollViewContent, v3(0, 0));
            for (let i = 0, n = listItems.length; i < n; i++) {
                let item = listItems[i];
                this.setItemPosition(item, i);
            }
        }
        if (this.allNum != a.length) {
            // this.lastIndex = 0;
            // no.position(this.scrollViewContent, v3(0, 0));
            this.allNum = a.length;
            await this.initItems();
            // for (let i = 0, n = listItems.length; i < n; i++) {
            //     let item = listItems[i];
            //     this.setItemPosition(item, i);
            // }
        }
        this.listData = a;
        await this.setList();
        if (!this?.node?.isValid) return;
        no.EventHandlerInfo.execute(this.onComplete);
        this._isSettingData = false;
    }

    private async initItems() {
        if (!this.node.isValid) return;
        await no.waitFor(() => { return this.template != null; }, this);
        if (!this.itemSize) return;
        if (this.isVertical) {
            this.contentSize = this.allNum * this.itemSize.height + this.offset.height;
            this.content.getComponent(UITransform).width = this.itemSize.width;
            this.content.getComponent(UITransform).height = this.contentSize;
        } else {
            this.contentSize = this.allNum * this.itemSize.width + this.offset.width;
            this.content.getComponent(UITransform).width = this.contentSize;
            this.content.getComponent(UITransform).height = this.itemSize.height;
        }
        let listItems = this.content.children,
            len = listItems.length;
        if (this.showNum > len) {
            for (let i = len; i < this.showNum; i++) {
                const item = instantiate(this.template);
                no.position(item, v3(0, 0));
                // item.active = true;
                // item.parent = this.content;
                if (this.dynamicAtlas && !item.getComponent(YJDynamicAtlas)) {
                    YJDynamicAtlas.setDynamicAtlas(item, this.dynamicAtlas);
                    YJLoadAssets.setLoadAsset(item, this.loadAsset);
                }
                const box = no.newNode('box');
                no.size(box, this.itemSize);
                const a = no.anchor(item);
                no.anchor(box, a.x, a.y);
                box.addChild(item);
                box.parent = this.content;
                this.setItemPosition(box, i);
            }
        }
    }

    private async setList() {
        if (!this.node.isValid) return;
        no.sortArray(this.content.children, (a, b) => {
            return a['__dataIndex'] - b['__dataIndex'];
        });
        if (this.uiAnim?.enabled) {
            this.setItem(0);
        } else {
            const n = this.content.children.length;
            let i = 0;
            await YJJobManager.ins.execute(() => {
                if (!this?.node?.isValid) return false;
                this.setItem(i++);
                if (i >= n) return false;
            }, this);
        }
    }

    private setItem(i: number) {
        const item = this.content.children[i];
        if (!item) return;
        const data_idx = item['__dataIndex'];
        if (this.listData[data_idx]) {
            this.setItemData(item, this.listData[data_idx]);
        }
        no.visible(item.children[0], i < this.allNum);
        if (this.uiAnim?.enabled) {
            this.uiAnim.play(item.children[0]);
            this.scheduleOnce(() => {
                this.setItem(++i);
            }, 0.1);
        }
    }

    private setItemData(item: Node, data = []) {
        let b = item.children[0].getComponent(YJDataWork);
        if (b) {
            b.data = data;
            b.init();
        }
        else {
            let a = item.children[0].getComponent(SetCreateNode);
            if (a)
                a.setData(no.jsonStringify(data));
        }
    }

    private setItemPosition(item: Node, index: number) {
        item['__dataIndex'] = index;
        let p = item.getPosition();
        let itemAnchor = item.getComponent(UITransform).anchorPoint;
        let contentSize = this.content.getComponent(UITransform).getBoundingBox().size;
        if (this.isVertical) {
            p.y = -(index + 1 - itemAnchor.y) * this.itemSize.height + contentSize.height * (1 - no.anchorY(this.content));
        } else {
            p.x = (index + itemAnchor.x) * this.itemSize.width - contentSize.width * no.anchorX(this.content);
        }
        item.setPosition(p);
    }

    update() {
        if (EDITOR) {
            this.getComponent(Layout)?.destroy();
            return;
        }
    }

    private updatePos() {
        if (!isValid(this?.node)) return;
        let listItems = this.content.children;
        if (this.listData == null || listItems == null || listItems.length == 0) return;
        let curPos = 0;
        let startIndex = 0;
        if (this.isVertical) {
            curPos = no.y(this.scrollViewContent);
            startIndex = no.floor(curPos / this.itemSize.height);
        } else {
            curPos = no.x(this.scrollViewContent);
            startIndex = no.floor(-curPos / this.itemSize.width);
        }
        //到左或到顶
        if (this.lastIndex == 0 && startIndex <= this.lastIndex) return;
        //到右或到底
        if (this.lastIndex == this.allNum - (this.showNum - 2) && startIndex >= this.lastIndex) return;

        let diff = startIndex - this.lastIndex;
        if (diff != 0) {
            this.lastIndex = startIndex;
            let n = listItems.length;
            for (let i = 0; i < n; i++) {
                let item = listItems[i];
                let dataIndex = item['__dataIndex'];
                if (diff < 0) {//向右
                    if (dataIndex - startIndex > this.showNum - 1 && dataIndex - n >= 0) {
                        this.setItemData(item, this.listData[dataIndex - n]);
                        this.setItemPosition(item, dataIndex - n);
                    }
                } else if (diff > 0) {//向左
                    if (dataIndex < startIndex && dataIndex + n < this.allNum) {
                        this.setItemData(item, this.listData[dataIndex + n]);
                        this.setItemPosition(item, dataIndex + n);
                    }
                }
            }
        }
    }

    private preInitItems() {
        if (!this.scrollView || !this.template) {
            console.error('scrollView 或 template 为 null!');
            return;
        }
        this.itemSize = this.template.getComponent(UITransform).getBoundingBox().size;
        let viewSize = this.scrollView.node.getComponent(UITransform).getBoundingBox().size;
        this.isVertical = this.scrollView.vertical;
        let showMax: number;
        if (this.isVertical) {
            showMax = no.ceil(viewSize.height / this.itemSize.height);
        } else {
            showMax = no.ceil(viewSize.width / this.itemSize.width);
        }
        this.showMax = showMax + 1;
    }
}
