
import { _decorator, Node, instantiate } from 'cc';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJDataWork } from '../base/YJDataWork';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

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
export class SetCreateNode extends FuckUi {

    @property({ type: YJLoadPrefab, displayName: '元素预制体' })
    loadPrefab: YJLoadPrefab = null;
    @property({ type: Node, displayName: '元素模板' })
    template: Node = null;

    @property({ type: Node, displayName: '容器' })
    container: Node = null;
    @property({ tooltip: '针对有YJDynamicAtlas组件的预制体' })
    onlyOne: boolean = false;
    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = false;
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;

    onDestroy() {
        if (this.loadPrefab && this.template && this.template.isValid)
            this.template.destroy();
    }

    onDisable() {
        if (this.clearOnDisable) {
            this.a_clearData();
            this.container?.children.forEach(child => {
                child.destroy();
            });
        }
    }

    protected onDataChange(data: any) {
        this.setItems([].concat(data));
    }

    protected async setItems(data: any[]) {
        if (!this.template) {
            this.template = await this.loadPrefab.loadPrefab();
        }
        if (!this.container) this.container = this.node;

        if (this.onlyOne) {
            this.setDynamicAtlasNode(data[0]);
            return;
        }

        let n = data.length
        let l = this.container.children.length;
        if (l < n) {
            for (let i = l; i < n; i++) {
                let item = instantiate(this.template);
                if (this.dynamicAtlas) {
                    YJDynamicAtlas.setDynamicAtlas(item, this.dynamicAtlas);
                }
                let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
                item.active = !!data[i];
                if (a && data[i]) {
                    a.data = data[i];
                }
                item.parent = this.container;
            }
        }

        for (let i = 0; i < l; i++) {
            let item = this.container.children[i];
            if (data[i] == null) item.active = false;
            else {
                let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
                item.active = !!data[i];
                if (a && data[i]) {
                    a.data = data[i];
                    a.init();
                }
            }
        }
    }

    protected async setDynamicAtlasNode(data: any) {
        if (data == null) return;
        let item = this.container.children[0];
        if (!item) {
            item = this.template;
            if (this.dynamicAtlas) {
                YJDynamicAtlas.setDynamicAtlas(item, this.dynamicAtlas);
            }
            await item.getComponent(YJLoadAssets)?.load();
        }
        let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
        if (a) {
            a.data = data;
        }
        if (!item.parent) item.parent = this.container;
        else a?.init();
    }
}
