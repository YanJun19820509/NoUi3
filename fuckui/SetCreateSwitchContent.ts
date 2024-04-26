
import { ccclass, property, executeInEditMode, EDITOR, Node, isValid } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';

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
        if (this.loadedNode) {
            if (!isValid(this.loadedNode)) return;
            if (this.loadedNode['__origin_x__'] == null) {
                this.loadedNode['__origin_x__'] = no.x(this.loadedNode);
            }
            no.visibleByOpacity(this.loadedNode, v);
            no.x(this.loadedNode, !v ? 20000 : this.loadedNode['__origin_x__']);
        }
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

    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = false;

    onLoad() {
        if (EDITOR) {
            if (!this.container)
                this.container = this.node;
        } else super.onLoad();
    }

    onDisable() {
        if (EDITOR) {
            return;
        }
        this.unscheduleAllCallbacks();
        this.a_clearData();
        if (this.clearOnDisable) {
            this.contents?.forEach(info => {
                info.clear();
            });
            this.container.destroyAllChildren();
        }
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
