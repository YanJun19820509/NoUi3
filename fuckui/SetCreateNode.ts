
import { ccclass, property, menu, executeInEditMode, Node, instantiate, EDITOR, Size, v3, Layout } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJDataWork } from '../base/YJDataWork';
import { YJJobManager } from '../base/YJJobManager';
import { YJPreCreateNode } from '../base/YJPreCreateNode';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { YJUIAnimationEffect } from '../base/ani/YJUIAnimationEffect';

/**
 * Predefined variables
 * Name = SetCreateNode
 * DateTime = Mon Jan 17 2022 10:42:39 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateNode.ts
 * FileBasenameNoExtension = SetCreateNode
 * URL = db://assets/Script/NoUi3/fuckui/SetCreateNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetCreateNode')
@menu('NoUi/ui/SetCreateNode(动态创建节点:object|array)')
@executeInEditMode()
export class SetCreateNode extends FuckUi {

    @property({ type: YJLoadPrefab, displayName: '元素预制体' })
    loadPrefab: YJLoadPrefab = null;
    @property({ type: Node, displayName: '元素模板' })
    template: Node = null;

    @property({ type: Node, displayName: '容器' })
    container: Node = null;

    @property({ displayName: '仅新增' })
    onlyAdd: boolean = false;

    // @property({ tooltip: '仅第一次创建时有创建间隔' })
    // onlyFirstTime: boolean = false;
    // @property({ displayName: '创建间隔(s)', step: .01, min: 0 })
    // wait: number = 0;

    @property({ displayName: '播放动效', type: YJUIAnimationEffect, tooltip: '没有指定则不播放动效' })
    uiAnim: YJUIAnimationEffect = null;

    @property({ type: no.EventHandlerInfo, displayName: '创建完成回调' })
    onComplete: no.EventHandlerInfo[] = [];

    @property({ tooltip: '针对有YJDynamicAtlas组件的预制体' })
    onlyOne: boolean = false;
    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = false;
    @property({ tooltip: 'enable时重新创建子节点', visible() { return this.clearOnDisable; } })
    recreateOnEnable: boolean = false;
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;
    @property(YJLoadAssets)
    loadAsset: YJLoadAssets = null;

    protected needSetDynamicAtlas: boolean = true;
    // private isFirst: boolean = true;
    // private waitTime: number;
    private _isSettingData: boolean = false;
    private itemSize: Size;

    onDestroy() {
        if (EDITOR) {
            return;
        }
        if (this.loadPrefab && this.template && this.template.isValid)
            this.template.destroy();
    }

    onEnable() {
        if (EDITOR) {
            return;
        }
        if (this._isSettingData) return;
        if (this.clearOnDisable && this.recreateOnEnable) {
            this.needSetDynamicAtlas = true;
            this.resetData();
        }
    }

    onDisable() {
        if (EDITOR) {
            return;
        }
        if (this._isSettingData) return;
        this.unscheduleAllCallbacks();
        this.a_clearData();
        if (this.clearOnDisable) {
            !this.recreateOnEnable && this.a_clearData();
            this.container?.children.forEach(child => {
                child.destroy();
            });
        }
    }

    protected onDataChange(data: any) {
        this._isSettingData = true;
        // if (this.onlyFirstTime) {
        //     if (this.isFirst) {
        //         this.isFirst = false;
        //         this.waitTime = this.wait;
        //     } else this.waitTime = 0;
        // } else {
        //     this.waitTime = this.wait;
        // }
        this.setItems([].concat(data));
    }

    protected async setItems(data: any[]) {
        if (!this.container) this.container = this.node;
        if (this.onlyOne) {
            await this.setDynamicAtlasNode(data[0]);
            no.EventHandlerInfo.execute(this.onComplete);
            this._isSettingData = false;
            return;
        }

        let l = this.container.children.length;
        if (!this.onlyAdd)
            for (let i = l - 1; i >= 0; i--) {
                no.visible(this.container.children[i], !!data[i]);
            }

        let n = data.length;
        if (!n) return;

        const prefabUrl = this.loadPrefab?.prefabUrl;
        if (prefabUrl && YJPreCreateNode.ins?.has(prefabUrl)) {
            let nn = !this.onlyAdd ? n - l : n;
            if (nn > 0) {
                await YJJobManager.ins.execute((max: number) => {
                    if (!this?.node?.isValid) false;
                    let cacheItem = YJPreCreateNode.ins.useNode(prefabUrl);
                    if (cacheItem) {
                        if (this.dynamicAtlas && !cacheItem.getComponent(YJDynamicAtlas)) {
                            YJDynamicAtlas.setDynamicAtlas(cacheItem, this.dynamicAtlas);
                            YJLoadAssets.setLoadAsset(cacheItem, this.loadAsset);
                        }
                        // if (!this.itemSize) this.itemSize = no.size(cacheItem);
                        // no.position(cacheItem, v3(0, 0));
                        // // no.visible(cacheItem, false);
                        // const box = no.newNode('box');
                        // no.size(box, this.itemSize);
                        // const a = no.anchor(cacheItem);
                        // no.anchor(box, a.x, a.y);
                        // box.addChild(cacheItem);
                        // box.parent = this.container;
                        this.container.addChild(this.initItem(cacheItem));
                    } else return false;
                    if (this.container.children.length >= max) return false;
                    return true;
                }, this, n);

                l = this.container.children.length;
                YJPreCreateNode.ins.fillNode(prefabUrl);
            }
        } else {
            if (!this.template) {
                this.template = await this.loadPrefab.loadPrefab();
                if (!this?.node?.isValid) return;
            }
        }

        if (!this.onlyAdd && n - l >= 1 || (this.onlyAdd && n >= 1)) {
            await YJJobManager.ins.execute((max: number) => {
                if (!this?.node?.isValid) false;
                let item = this.loadPrefab?.instantiateNode() || instantiate(this.template);
                if (this.dynamicAtlas && !item.getComponent(YJDynamicAtlas)) {
                    YJDynamicAtlas.setDynamicAtlas(item, this.dynamicAtlas);
                    YJLoadAssets.setLoadAsset(item, this.loadAsset);
                }
                // if (!this.itemSize) this.itemSize = no.size(item);
                // no.position(item, v3(0, 0));
                // // item.active = true;
                // // no.visible(item, false);
                // const box = no.newNode('box');
                // no.size(box, this.itemSize);
                // const a = no.anchor(item);
                // no.anchor(box, a.x, a.y);
                // box.addChild(item);
                // box.parent = this.container;
                this.container.addChild(this.initItem(item));
                if (this.container.children.length >= max) return false;
            }, this, !this.onlyAdd ? n : n + l);
            if (!this.container?.isValid) return;
        }

        let start = !this.onlyAdd ? 0 : l;
        this.setItem(data, start);
        // for (let i = 0; i < n; i++) {
        //     this.setItem(data, start, i);
        // }
        no.EventHandlerInfo.execute(this.onComplete);
        this._isSettingData = false;
    }

    private initItem(item: Node) {
        no.position(item, v3(0, 0));
        // no.visible(cacheItem, false);
        if (this.uiAnim) {
            const box = no.newNode('box');
            const layout = item.getComponent(Layout);
            if (!layout) {
                if (!this.itemSize) this.itemSize = no.size(item);
                no.size(box, this.itemSize);
            } else {
                const bLayout = box.addComponent(Layout);
                bLayout.type = layout.type;
                bLayout.resizeMode = layout.resizeMode;
                bLayout.paddingTop = layout.paddingTop;
                bLayout.paddingBottom = layout.paddingBottom;
                bLayout.paddingLeft = layout.paddingLeft;
                bLayout.paddingRight = layout.paddingRight;
                bLayout.spacingX = layout.spacingX;
                bLayout.spacingY = layout.spacingY;
                bLayout.affectedByScale = layout.affectedByScale;
                bLayout.verticalDirection = layout.verticalDirection;
                bLayout.horizontalDirection = layout.horizontalDirection;
                bLayout.constraint = layout.constraint;
            }
            const a = no.anchor(item);
            no.anchor(box, a.x, a.y);
            box.addChild(item);
            return box;
        }
        return item;
    }

    private setItem(data: any[], start: number, i = 0) {
        if (i >= data.length) return;
        let item = this.container.children[start + i];
        if (this.uiAnim) item = item.children[0];
        if (data[i] == null) {
            no.visible(item, false);
            this.setItem(data, start, ++i);
            return;
        }
        let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
        if (a) {
            a.data = data[i];
            a.init();
        }
        no.visible(item, true);
        if (this.uiAnim) {
            this.uiAnim.play(item);
            this.scheduleOnce(() => {
                this.setItem(data, start, ++i);
            }, 0.1);
        } else this.setItem(data, start, ++i);
    }

    protected async setDynamicAtlasNode(data: any) {
        if (data == null) return;
        let item = this.container.children[0];
        if (!item) {
            if (!this.template) {
                this.template = await this.loadPrefab.loadPrefab();
                if (!this?.node?.isValid) return;
            }
            item = instantiate(this.template);
            await item.getComponent(YJLoadAssets)?.load();
            if (!this?.node?.isValid) return;
        }
        let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
        if (a) {
            a.data = data;
        }
        if (!item.parent) item.parent = this.container;
        else a?.init();
    }

    ///////////////////////////EDITOR///////////////
    onLoad() {
        super.onLoad();
        if (!EDITOR) {
            return;
        }
        if (!this.loadPrefab) this.loadPrefab = this.getComponent(YJLoadPrefab);
        if (!this.container) this.container = this.node;
        if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
        if (!this.loadAsset) this.loadAsset = no.getComponentInParents(this.node, YJLoadAssets);
    }
}
