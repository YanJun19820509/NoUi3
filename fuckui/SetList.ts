
import { _decorator, Component, Node, instantiate, ScrollView, Size, UITransform, Layout, js, size } from 'cc';
import { EDITOR } from 'cc/env';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJDataWork } from '../base/YJDataWork';
import { YJJobManager } from '../base/YJJobManager';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetCreateNode } from './SetCreateNode';
const { ccclass, property, menu, executeInEditMode } = _decorator;

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

    @property(ScrollView)
    scrollView: ScrollView = null;
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
    setTemplateInfo: boolean = false;
    @property({ displayName: '所需元素节点个数', readonly: true })
    showMax: number = 0;
    @property({ visible() { return false; } })
    itemSize: Size = size();


    private listData: any[];
    // private listItems: Node[] = [];
    private isVertical: boolean;
    private content: Node;
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
    private touched: boolean = false;
    private isFirst: boolean = true;
    private waitTime: number;
    private _isSettingData: boolean = false;

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
        // this.itemSize = this.template.getComponent(UITransform).getBoundingBox().size;
        // this.viewSize = this.scrollView.node.getComponent(UITransform).getBoundingBox().size;
        this.isVertical = this.scrollView.vertical;
        this.content = this.scrollView.content;
        // this.listItems = this.content.children;

        // if (this.isVertical) {
        //     this.showMax = Math.ceil(this.viewSize.height / this.itemSize.height);
        // } else {
        //     this.showMax = Math.ceil(this.viewSize.width / this.itemSize.width);
        // }
        this._loaded = true;

        this.scrollView.node.on(ScrollView.EventType.SCROLL_BEGAN, () => {
            this.touched = true;
        }, this);

        this.scrollView.node.on(ScrollView.EventType.SCROLL_ENDED, () => {
            this.touched = false;
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
        if (this.clearOnDisable) {
            !this.recreateOnEnable && this.a_clearData();
            this.content?.children.forEach(item => {
                item.destroy();
            });
            // this.listItems = [];
        }
    }

    onDestroy() {
        if (EDITOR) return;
        if (this.template && this.template.isValid)
            this.template.destroy();
    }

    protected async onDataChange(data: any) {
        this._isSettingData = true;
        if (this.onlyFirstTime) {
            if (this.isFirst) {
                this.isFirst = false;
                this.waitTime = this.wait;
            } else this.waitTime = 0;
        } else {
            this.waitTime = this.wait;
        }
        this.unscheduleAllCallbacks();
        if (!this.node.isValid) return;
        await no.waitFor(() => { return this._loaded; }, this);
        let listItems = this.content.children;
        if (this.waitTime > 0) {
            for (let i = 0, n = listItems.length; i < n; i++) {
                let item = listItems[i];
                item.active = false;
            }
        }
        let a = [].concat(data);
        if (this.columnNumber > 1) {
            a = no.arrayToArrays(a, this.columnNumber);
        }
        this.allNum = a.length;
        if (listItems.length == 0 || this.listData?.length != this.allNum) {
            if (this.showMax >= this.allNum) this.showNum = this.allNum;
            else this.showNum = this.showMax + 2;
            await this.initItems();
            if (!this?.node?.isValid) return;
        }
        this.listData = a;
        let i = this.lastIndex;
        if (!this.listData[this.lastIndex]) i = 0;
        await this.setList(this.autoScrollBack ? 0 : i);
        if (!this?.node?.isValid) return;
        this._isSettingData = false;
    }

    private async initItems() {
        if (!this.node.isValid) return;
        await no.waitFor(() => { return this.template != null; }, this);
        if (this.isVertical) {
            this.contentSize = this.allNum * this.itemSize.height;
            this.content.getComponent(UITransform).width = this.itemSize.width;
            this.content.getComponent(UITransform).height = this.contentSize;
        } else {
            this.contentSize = this.allNum * this.itemSize.width;
            this.content.getComponent(UITransform).width = this.contentSize;
            this.content.getComponent(UITransform).height = this.itemSize.height;
        }
        let listItems = this.content.children;
        for (let i = listItems.length; i < this.showNum; i++) {
            let item = instantiate(this.template);
            item.parent = this.content;
            if (this.dynamicAtlas) {
                YJDynamicAtlas.setDynamicAtlas(item, this.dynamicAtlas);
                YJLoadAssets.setLoadAsset(item, this.loadAsset);
            }
        }
    }

    private async setList(start: number) {
        if (!this.node.isValid) return;
        let listItems = this.content.children;
        await no.waitFor(() => { return listItems.length >= this.showNum; }, this);
        if (start != this.lastIndex) {
            if (this.allNum - start < this.showMax) {
                start = this.allNum - this.showMax;
            }
            if (start < 0) start = 0;
            let p = this.content.getPosition();
            if (this.isVertical) {
                p.y = start * this.itemSize.height;
            } else {
                p.x = start * this.itemSize.width;

            }
            this.content.setPosition(p);
            this.lastIndex = start;
        }
        let i = 0, n = listItems.length;
        await YJJobManager.ins.execute(() => {
            if (!this?.node?.isValid) return false;
            this.setItem(start, i++);
            if (i >= n) return false;
        }, this);
    }

    private setItem(start: number, i: number) {
        let item = this.content.children[i];
        if (!item) return false;
        this.setItemPosition(item, start + i);
        if (this.listData[start + i]) {
            this.setItemData(item, this.listData[start + i]);
            item.active = true;
        } else item.active = false;
    }

    private setItemData(item: Node, data = []) {
        let b = item.getComponent(YJDataWork);
        if (b) {
            b.data = data;
            b.init();
        }
        else {
            let a = item.getComponent(SetCreateNode);
            if (a)
                a.setData(JSON.stringify(data));
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
            p.x = (index + itemAnchor.x) * this.itemSize.width - contentSize.height * no.anchorX(this.content);
        }
        item.setPosition(p);
    }

    update() {
        if (EDITOR) {
            this.getComponent(Layout)?.destroy();
            if (this.setTemplateInfo) {
                this.setTemplateInfo = false;
                this.preInitItems();
            }
            return;
        }
        if (!this.touched) return;
        let listItems = this.content.children;
        if (this.listData == null || listItems == null || listItems.length == 0) return;
        let curPos = 0;
        let startIndex = 0;
        if (this.isVertical) {
            curPos = no.y(this.content);
            startIndex = no.floor(curPos / this.itemSize.height);
        } else {
            curPos = no.x(this.content);
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
        this.showMax = showMax + 2;
    }
}
