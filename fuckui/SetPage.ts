
import { _decorator, instantiate, PageView } from 'cc';
import { EDITOR } from 'cc/env';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetCreateNode } from './SetCreateNode';
const { ccclass, property, menu, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = SetPage
 * DateTime = Mon Jan 17 2022 12:00:32 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPage.ts
 * FileBasenameNoExtension = SetPage
 * URL = db://assets/Script/NoUi3/fuckui/SetPage.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetPage')
@executeInEditMode()
export class SetPage extends FuckUi {

    @property({ type: YJLoadPrefab, displayName: '页面', tooltip: '需要挂载SetCreateNode组件' })
    page: YJLoadPrefab = null;

    @property(PageView)
    view: PageView = null;
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;

    protected onDataChange(data: any) {
        data = [].concat(data);
        if (data.length == 0) this._clear();
        else {
            data.forEach((d: any) => {
                if (d instanceof Object) this._add(d);
                else if (typeof d == 'number') this._remove(d);
            });
        }
    }

    private async _add(data: any) {
        if (!this.page.loaded) {
            await this.page.loadPrefab();
        }
        let node = instantiate(this.page.loadedNode);
        if (this.dynamicAtlas) {
            YJDynamicAtlas.setDynamicAtlas(node, this.dynamicAtlas);
        }
        await node.getComponent(YJLoadAssets)?.load();
        this.view.addPage(node);
        (node.getComponent(SetCreateNode) || node.getComponentInChildren(SetCreateNode))?.setData(data);
    }

    private _remove(index: number) {
        this.view?.removePageAtIndex(index);
    }

    private _clear() {
        this.view?.removeAllPages();
    }

    ///////////////////////////EDITOR///////////////
    onLoad() {
        super.onLoad();
        if (!EDITOR) {
            return;
        }
        if (!this.page) this.page = this.getComponent(YJLoadPrefab);
        if (!this.view) this.view = this.getComponent(PageView);
        if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
    }
}
