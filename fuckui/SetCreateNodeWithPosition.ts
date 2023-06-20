
import { ccclass, property, executeInEditMode, EDITOR, Node, math, UITransform, instantiate, Vec3 } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJDataWork } from '../base/YJDataWork';
import { YJJobManager } from '../base/YJJobManager';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetCreateNodeWithPosition
 * DateTime = Sat Nov 19 2022 17:28:44 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateNodeWithPosition.ts
 * FileBasenameNoExtension = SetCreateNodeWithPosition
 * URL = db://assets/NoUi3/fuckui/SetCreateNodeWithPosition.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('PositionInfo')
export class PositionInfo {
    @property
    positions: Vec3[] = [];
}

@ccclass('SetCreateNodeWithPosition')
@executeInEditMode()
export class SetCreateNodeWithPosition extends FuckUi {
    @property({ type: YJLoadPrefab, displayName: '元素预制体' })
    loadPrefab: YJLoadPrefab = null;
    @property({ type: Node, displayName: '元素模板' })
    template: Node = null;
    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = false;
    @property({ tooltip: 'enable时重新创建子节点', visible() { return this.clearOnDisable; } })
    recreateOnEnable: boolean = false;
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;

    @property({ type: Node, displayName: '容器' })
    container: Node = null;
    @property({ type: PositionInfo })
    positionTypes: PositionInfo[] = [];
    @property({ editorOnly: true })
    saveCurrentPositions: boolean = false;
    @property({ editorOnly: true })
    previewNum: number = 0;
    @property({ editorOnly: true })
    previewCreate: boolean = false;


    protected needSetDynamicAtlas: boolean = true;
    private _isSettingData: boolean = false;

    update() {
        if (EDITOR) {
            if (this.saveCurrentPositions) {
                this.saveCurrentPositions = false;
                let pos: Vec3[] = [];
                this.node.children.forEach(child => {
                    pos[pos.length] = child.position.clone();
                });
                let setted = false;
                for (let i = 0, n = this.positionTypes.length; i < n; i++) {
                    const info = this.positionTypes[i];
                    if (info.positions.length == pos.length) {
                        setted = true;
                        info.positions = pos;
                        break;
                    }
                }
                if (!setted) {
                    const info = new PositionInfo();
                    info.positions = pos;
                    this.positionTypes[this.positionTypes.length] = info;
                }
            }
            if (this.previewCreate) {
                this.previewCreate = false;
                let posinfo = this.getPositions(this.previewNum);
                if (!posinfo) return;
                let size = this.template?.getComponent(UITransform).contentSize.clone() || math.size(100, 100);
                posinfo.positions.forEach(pos => {
                    let node = new Node();
                    node.addComponent(UITransform).setContentSize(size);
                    node.setPosition(pos);
                    node.parent = this.container;
                });
            }
        }
    }

    onDestroy() {
        if (this.loadPrefab && this.template && this.template.isValid)
            this.template.destroy();
    }

    onEnable() {
        if (this._isSettingData) return;
        if (this.clearOnDisable && this.recreateOnEnable) {
            this.needSetDynamicAtlas = true;
            this.resetData();
        }
    }

    onDisable() {
        if (this._isSettingData) return;
        this.unscheduleAllCallbacks();
        if (this.clearOnDisable) {
            !this.recreateOnEnable && this.a_clearData();
            this.container?.children.forEach(child => {
                child.destroy();
            });
        }
    }

    protected onDataChange(data: any) {
        this._isSettingData = true;
        this.setItems([].concat(data));
    }

    protected async setItems(data: any[]) {
        if (!this.template) {
            this.template = await this.loadPrefab.loadPrefab();
            if (!this?.node?.isValid) return;
        }

        if (this.dynamicAtlas && this.needSetDynamicAtlas) {
            this.needSetDynamicAtlas = false;
            YJDynamicAtlas.setDynamicAtlas(this.template, this.dynamicAtlas);
        }
        if (!this.container) this.container = this.node;

        let n = data.length;
        let l = this.container.children.length;
        for (let i = 0; i < l; i++) {
            // this.container.children[i].active = !!data[i];
            no.visible(this.container.children[i], !!data[i]);
        }

        if (n > l) {
            // this.container.active = false;
            await YJJobManager.ins.execute((max: number) => {
                if (!this?.node?.isValid) return false;
                let item = instantiate(this.template);
                item.active = true;
                no.visible(item, false);
                item.parent = this.container;
                if (this.container.children.length >= max) return false;
            }, this, n);
            if (!this.container?.isValid) return;
            // this.container.active = true;
        } else if (n - l == 1) {
            let item = instantiate(this.template);
            item.active = true;
            no.visible(item, false);
            item.parent = this.container;
        }
        let positionInfo = this.getPositions(n);
        for (let i = 0; i < n; i++) {
            this.setItem(data, 0, i, positionInfo.positions[i]);
        }
        this._isSettingData = false;
    }

    private setItem(data: any[], start: number, i: number, pos: Vec3) {
        if (data[i] == null) {
            return;
        }
        let item = this.container.children[start + i];
        let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
        if (a) {
            a.data = data[i];
            a.init();
        }
        item.setPosition(pos);
        // item.active = true;
        no.visible(item, true);
    }

    private getPositions(len: number): PositionInfo {
        for (let i = 0, n = this.positionTypes.length; i < n; i++) {
            const info = this.positionTypes[i];
            if (info.positions.length == len) return info;
        }
        return null;
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
    }
}
