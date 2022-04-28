
import { _decorator, Component, Node, instantiate } from 'cc';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJDataWork } from '../base/YJDataWork';
import { YJLoadAssets } from '../editor/YJLoadAssets';
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
    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = false;

    private needClearChildren = false;

    onDestroy() {
        this.template?.destroy();
    }

    onDisable() {
        if (this.clearOnDisable) {
            this.a_clearData();
            this.needClearChildren = true;
        }
    }

    protected onDataChange(data: any) {
        this.setItems([].concat(data));
    }

    private async setItems(data: any[]) {
        if (!this.template) {
            this.template = await this.loadPrefab.loadPrefab();
            await this.template.getComponent(YJLoadAssets)?.load();
        }
        if (!this.container) this.container = this.node;

        if (this.needClearChildren) {
            this.container.removeAllChildren();
            this.needClearChildren = false;
        }

        let n = data.length
        let l = this.container.children.length;
        if (l < n) {
            for (let i = l; i < n; i++) {
                let item = instantiate(this.template);
                let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
                item.active = !!data[i];
                if (a && data[i]) {
                    a.data = data[i];
                }
                item.parent = this.container;
            }
        }
        // n = this.container.children.length;
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
}
