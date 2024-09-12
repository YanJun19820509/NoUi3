
import { ccclass, menu, property, executeInEditMode, EDITOR, Node, instantiate } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJCacheObject } from '../base/YJCacheObject';
import { YJDataWork } from '../base/YJDataWork';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetCreateCacheNode
 * DateTime = Tue Apr 19 2022 10:17:54 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateCacheNode.ts
 * FileBasenameNoExtension = SetCreateCacheNode
 * URL = db://assets/NoUi3/fuckui/SetCreateCacheNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetCreateCacheNode')
@menu('NoUi/ui/SetCreateCacheNode(动态创建可回收节点:object|array)')
@executeInEditMode()
export class SetCreateCacheNode extends FuckUi {
    @property({ type: YJLoadPrefab, displayName: '元素预制体' })
    loadPrefab: YJLoadPrefab = null;
    @property({ type: Node, displayName: '元素模板' })
    template: Node = null;

    @property({ type: Node, displayName: '容器' })
    container: Node = null;

    private recycleType: string;

    onDestroy() {
        if (this.loadPrefab && this.template && this.template.isValid)
            this.template.destroy();
        no.cachePool.clear(this.recycleType);
    }

    protected onDataChange(data: any) {
        this.setItems([].concat(data));
    }

    private async setItems(data: any[]) {
        if (!this.template) {
            this.template = await this.loadPrefab.loadPrefab();
            if (!this?.node?.isValid) return;
            await this.template.getComponent(YJLoadAssets)?.load();
            if (!this?.node?.isValid) return;
        }
        if (!this.container) this.container = this.node;
        if (!this.recycleType) this.recycleType = this.template.getComponent(YJCacheObject).recycleType;

        this.setItem(data, 0);
    }

    private setItem(data: any[], i: number) {
        if (i >= data.length) return;
        if (!data[i]) {
            this.setItem(data, ++i);
            return;
        };
        let item = no.cachePool.reuse<Node>(this.recycleType), needWait = false;
        if (!item) {
            item = instantiate(this.template);
            item.active = true;
            needWait = true;
        }
        item.parent = this.container;
        let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
        if (a) {
            a.data = data[i];
            a.init();
        }
        no.visible(item, true);
        if (needWait) this.scheduleOnce(() => {
            this.setItem(data, ++i);
        });
        else this.setItem(data, ++i);
    }

    ///////////////////////////EDITOR///////////////
    onLoad() {
        super.onLoad();
        if (!EDITOR) {
            return;
        }
        if (!this.loadPrefab) this.loadPrefab = this.getComponent(YJLoadPrefab);
        if (!this.container) this.container = this.node;
    }
}
