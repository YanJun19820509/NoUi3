
import { _decorator, Component, Node, instantiate } from 'cc';
import { YJDataWork } from '../base/YJDataWork';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { SetCreateNode } from './SetCreateNode';
import { SetCreateNodeOneByOneDelegate } from './SetCreateNodeOneByOneDelegate';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = setCreateNodeOneByOne
 * DateTime = Wed Jun 22 2022 16:05:07 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = setCreateNodeOneByOne.ts
 * FileBasenameNoExtension = setCreateNodeOneByOne
 * URL = db://assets/NoUi3/fuckui/setCreateNodeOneByOne.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetCreateNodeOneByOne')
export class SetCreateNodeOneByOne extends SetCreateNode {
    @property({ displayName: '间隔时长(s)', min: 0 })
    duration: number = 1;
    @property(SetCreateNodeOneByOneDelegate)
    delegate: SetCreateNodeOneByOneDelegate = null;

    protected async setItems(data: any[]) {
        if (!this.template) {
            this.template = await this.loadPrefab.loadPrefab();
        }
        if (this.dynamicAtlas && this.needSetDynamicAtlas) {
            this.needSetDynamicAtlas = false;
            YJDynamicAtlas.setDynamicAtlas(this.template, this.dynamicAtlas);
        }
        if (!this.container) this.container = this.node;

        if (this.onlyOne) {
            this.setDynamicAtlasNode(data[0]);
            return;
        }

        let l = this.container.children.length;
        for (let i = 0; i < l; i++) {
            this.container.children[i].active = false;
        }

        let n = data.length
        if (l < n) {
            for (let i = l; i < n; i++) {
                let item = instantiate(this.template);
                item.active = false;
                item.parent = this.container;
            }
        }
        if (n > 0) {
            this.showItemsOneByOne(data, 0);
        }
    }

    private async showItemsOneByOne(data: any[], idx: number) {
        let item = this.container.children[idx];
        if (!item || data[idx] == null) {
            this.delegate?.afterAllCreated();
        } else {
            await this.delegate?.beforeCreateOneNode(idx, data[idx]);
            let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
            item.active = !!data[idx];
            if (a && data[idx]) {
                a.data = data[idx];
                a.init();
            }
            await this.delegate?.afterCreateOneNode(idx, data[idx], item);
            await no.sleep(this.duration, this);
            this.showItemsOneByOne(data, ++idx);
        }
    }
}
