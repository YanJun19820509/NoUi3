
import { _decorator, Component, Node, instantiate, Prefab, UITransform, math } from 'cc';
import { EDITOR } from 'cc/env';
import { YJDataWork } from '../base/YJDataWork';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = SetCreateNodeByUrl
 * DateTime = Fri Mar 25 2022 15:10:40 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateNodeByUrl.ts
 * FileBasenameNoExtension = SetCreateNodeByUrl
 * URL = db://assets/NoUi3/fuckui/SetCreateNodeByUrl.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

/**
 * 参数 : {
 *  url: string,
 *  data: object | array
 * }
 */
@ccclass('SetCreateNodeByUrl')
@menu('NoUi/ui/SetCreateNodeByUrl(根据prefab的url动态创建节点:object)')
@executeInEditMode()
export class SetCreateNodeByUrl extends FuckUi {

    @property({ type: Node, displayName: '容器' })
    container: Node = null;
    @property({ tooltip: '根据子节点大小重置宽高，当子节点个数大于1时不生效' })
    resize: boolean = false;
    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = false;
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;
    @property(YJLoadAssets)
    loadAsset: YJLoadAssets = null;

    private url: string;
    private needDestroyChildrenUuid: string[] = [];
    private isDestroied: boolean = false;
    private prefab: Prefab;


    onDisable() {
        if (this.clearOnDisable) {
            this.a_clearData();
            this.clear(true);
        }
    }

    onDestroy() {
        this.isDestroied = true;
    }

    protected onDataChange(d: any) {
        let { url, data }: { url: string, data: any[] } = d;
        if (url && this.url != url) {
            this.url = url;
            no.assetBundleManager.loadPrefab(url, item => {
                if (data.length == 1) this.resizeContentSize(item.data);
                this.prefab = item;
                this.setNeedDestroyChildren();
                this.setItems(data).then(() => {
                    this.clear();
                });
            });
        } else {
            this.setItems(data);
        }
    }

    private async setItems(data: any[]) {
        if (!this.prefab) return;
        if (!this.container) this.container = this.node;
        if (!this.container?.isValid || this.isDestroied) return;
        let n = data.length
        let l = this.container.children.length - this.needDestroyChildrenUuid.length;
        if (l < n) {
            for (let i = l; i < n; i++) {
                let item = instantiate(this.prefab);
                if (this.dynamicAtlas) {
                    YJDynamicAtlas.setDynamicAtlas(item, this.dynamicAtlas);
                    YJLoadAssets.setLoadAsset(item, this.loadAsset);
                }
                if (item.getComponent(YJLoadAssets))
                    await item.getComponent(YJLoadAssets).load();
                item.active = true;
                let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
                if (a) {
                    a.data = data[i];
                }
                item.parent = this.container;

            }
        }
        for (let i = 0; i < l; i++) {
            let item = this.container.children[i];
            if (data[i] == null) item.active = false;
            else {
                item.active = true;
                let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
                if (a) {
                    a.data = data[i];
                    a.init();
                }
            }
        }
    }

    private resizeContentSize(child: Node) {
        if (!this.resize) return;
        let scale = child.scale;
        let size = child.getComponent(UITransform).contentSize.clone();
        size.width *= scale.x;
        size.height *= scale.y;
        this.container.getComponent(UITransform).contentSize = size;
    }

    private clear(all = false) {
        this.container?.children.forEach(child => {
            if (all || this.needDestroyChildrenUuid.indexOf(child.uuid) != -1)
                child.destroy();
        });
        if (!this.isValid) return;
        this.needDestroyChildrenUuid.length = 0;
    }

    private setNeedDestroyChildren() {
        this.needDestroyChildrenUuid.length = 0;
        this.container?.children.forEach(child => {
            this.needDestroyChildrenUuid[this.needDestroyChildrenUuid.length] = child.uuid;
            child.active = false;
        });
    }

    ///////////////////////////EDITOR///////////////
    onLoad() {
        this.isDestroied = false;
        super.onLoad();
        if (!EDITOR) {
            return;
        }
        if (!this.container) this.container = this.node;
        if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
        if (!this.loadAsset) this.loadAsset = no.getComponentInParents(this.node, YJLoadAssets);
    }
}
