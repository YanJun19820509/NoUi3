
import { EDITOR, ccclass, property, executeInEditMode, instantiate, PageView, Node } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { HackUi } from './HackUi';
import { SetCreateNode } from './SetCreateNode';
import { YJJobManager } from 'NoUi3/base/YJJobManager';

/**
 * Predefined variables
 * Name = SetPage
 * DateTime = Mon Jan 17 2022 12:00:32 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPage.ts
 * FileBasenameNoExtension = SetPage
 * URL = db://assets/Script/NoUi3/ui/SetPage.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetPage')
@executeInEditMode()
export class SetPage extends HackUi {

    @property({ type: YJLoadPrefab, displayName: '页面', tooltip: '需要挂载SetCreateNode组件' })
    page: YJLoadPrefab = null;

    @property(PageView)
    view: PageView = null;

    private tempNode: Node;

    protected async onDataChange(data: any) {
        data = [].concat(data);
        if (data.length == 0) this._clear();
        else {
            if (!this.tempNode) this.tempNode = await this.page.loadPrefab();
            this.setPages(data);
        }
    }

    private setPages(data: any[]) {
        const num = data.length;
        let i = 0;
        YJJobManager.ins.addTask(() => {
            const d = data[i++];
            if (d instanceof Object) this.setPage(d);
            else if (typeof d == 'number') this._remove(d);
            return i >= num;
        });
    }

    private async setPage(data: any) {
        let node = instantiate(this.tempNode);
        await node.getComponent(YJLoadAssets)?.load();
        if (!this?.node?.isValid) return;
        this.view.addPage(node);
        (node.getComponent(SetCreateNode) || node.getComponentInChildren(SetCreateNode))?.a_setData(data);
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
    }
}
