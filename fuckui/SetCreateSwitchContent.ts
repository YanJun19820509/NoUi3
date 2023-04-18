
import { _decorator, Component, Node, instantiate } from 'cc';
import { EDITOR } from 'cc/env';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = SetCreateSwitchContent
 * DateTime = Tue Jul 19 2022 14:52:24 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateSwitchContent.ts
 * FileBasenameNoExtension = SetCreateSwitchContent
 * URL = db://assets/NoUi3/fuckui/SetCreateSwitchContent.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
@ccclass('ContentInfo')
class ContentInfo {
    @property
    name: string = '';
    @property(YJLoadPrefab)
    prefab: YJLoadPrefab = null;

    private loadedNode: Node;

    public async loadTo(parent: Node, dynamicAtlas: YJDynamicAtlas, loadAsset: YJLoadAssets) {
        this.loadedNode = await this.prefab.loadPrefab();
        if (!no.checkValid(parent)) return;
        if (!this.loadedNode.getComponent(YJDynamicAtlas) && dynamicAtlas)
            YJDynamicAtlas.setDynamicAtlas(this.loadedNode, dynamicAtlas);
        if (this.loadedNode.getComponent(YJLoadAssets))
            await this.loadedNode.getComponent(YJLoadAssets).load();
        else
            YJLoadAssets.setLoadAsset(this.loadedNode, loadAsset);
        this.loadedNode.parent = parent;
    }

    public show(v: boolean): void {
        if (this.loadedNode) this.loadedNode.active = v;
    }

    public get isLoaded(): boolean {
        return !!this.loadedNode;
    }

    public clear() {
        this.prefab.clear();
        this.loadedNode = null;
    }
}

/**
 * 创建多个用于切换显示的内容节点
 * data: string ContentInfo.name
 */
@ccclass('SetCreateSwitchContent')
@executeInEditMode()
export class SetCreateSwitchContent extends FuckUi {
    @property(ContentInfo)
    contents: ContentInfo[] = [];
    @property(Node)
    container: Node = null;
    @property
    noCache: boolean = false;
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;
    @property(YJLoadAssets)
    loadAsset: YJLoadAssets = null;

    onLoad() {
        if (EDITOR) {
            if (!this.container)
                this.container = this.node;
        } else super.onLoad();
    }

    protected onDataChange(data: any) {
        if (typeof data == 'string') this.a_showByName(data);
        else if (typeof data == 'number') this.a_showByIndex(data);
    }

    private async showContent(info: ContentInfo) {
        if (!info) return;
        if (!info.isLoaded) {
            await info.loadTo(this.container, this.dynamicAtlas, this.loadAsset);
            if (!this?.node?.isValid) return;
        }
        this.scheduleOnce(() => {
            this.hideContent(info.name);
        });
    }

    private hideContent(exceptName: string) {
        this.contents?.forEach(info => {
            if (this.noCache && info.name != exceptName) info.clear();
            else
                info.show(info.name == exceptName);
        });
    }

    public a_showByName(name: string) {
        let i = no.indexOfArray(this.contents, name, 'name');
        if (i == -1) return;
        this.a_showByIndex(i);
    }

    public a_showByIndex(i: number) {
        this.showContent(this.contents[Number(i)]);
    }
}
