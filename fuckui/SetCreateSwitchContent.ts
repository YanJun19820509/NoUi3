
import { _decorator, Component, Node, instantiate } from 'cc';
import { EDITOR } from 'cc/env';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJLoadAssets } from '../editor/YJLoadAssets';
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

    public async load(): Promise<Node> {
        if (this.prefab.loaded) {
            return Promise.resolve(this.prefab.loadedNode);
        } else {
            await this.prefab.loadPrefab();
            if (this.prefab.loadedNode.getComponent(YJLoadAssets)) {
                return this.prefab.loadedNode.getComponent(YJLoadAssets).load().then(() => {
                    return Promise.resolve(this.prefab.loadedNode);
                });
            }
            return Promise.resolve(this.prefab.loadedNode);
        }
    }

    public hide(): void {
        if (this.prefab.loaded) this.prefab.loadedNode.active = false;
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

    onLoad() {
        if (EDITOR) {
            if (!this.container)
                this.container = this.node;
        } else super.onLoad();
    }

    protected onDataChange(data: any) {
        for (let i = 0, n = this.contents.length; i < n; i++) {
            let info = this.contents[i];
            if (info.name == data) {
                this.showContent(info);
                break;
            }
        }
    }

    private async showContent(info: ContentInfo) {
        let node = await info.load();
        node.parent = this.container;
        node.active = true;
        this.scheduleOnce(() => {
            this.hideContent(info.name);
        });
    }

    private hideContent(exceptName: string) {
        this.contents?.forEach(info => {
            if (info.name != exceptName) info.hide();
        });
    }

    public a_show(name: string) {
        this.setData(name);
    }

}
