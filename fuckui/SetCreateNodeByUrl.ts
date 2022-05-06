
import { _decorator, Component, Node, instantiate, Prefab } from 'cc';
import { YJDataWork } from '../base/YJDataWork';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

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
export class SetCreateNodeByUrl extends FuckUi {

    @property({ type: Node, displayName: '容器' })
    container: Node = null;
    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = false;

    private template: Node;
    private url: string;
    private pref: Prefab;

    private needClearChildren = false;

    onDisable() {
        if (this.clearOnDisable) {
            this.a_clearData();
            this.needClearChildren = true;
        }
    }

    onDestroy() {
        if (this.template && this.template.isValid)
            this.template.destroy();
    }

    protected onDataChange(d: any) {
        let { url, data }: { url: string, data: any[] } = d;
        if (url && this.url != url) {
            this.container?.removeAllChildren();
            this.url = url;
            no.assetBundleManager.loadPrefab(url, item => {
                // this.pref = item;
                this.template = instantiate(item)
                this.setItems(data);
                item.decRef();
            });
        } else {
            this.setItems(data);
        }
    }

    private setItems(data: any[]) {
        if (!this.template) return;
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
}
