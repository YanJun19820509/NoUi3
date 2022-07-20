
import { _decorator, Component, Node, instantiate } from 'cc';
import { EDITOR } from 'cc/env';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
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

    private content: Node;

    public async load(): Promise<Node> {
        if (this.content) {
            return Promise.resolve(this.content);
        } else {
            let n = await this.prefab.loadPrefab();
            this.content = instantiate(n);
            return Promise.resolve(this.content);
        }
    }

    public hide(): void {
        if (this.content) this.content.active = false;
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
        this.showContent(data);
    }

    private async showContent(name: string) {
        for (let i = 0, n = this.contents.length; i < n; i++) {
            let info = this.contents[i];
            if (info.name == name) {
                let node = await info.load();
                node.parent = this.container;
                node.active = true;
                this.scheduleOnce(() => {
                    this.hideContent(name);
                })
                break;
            }
        }
    }

    private hideContent(exceptName: string) {
        this.contents.forEach(info => {
            if (info.name != exceptName) info.hide();
        });
    }

    public a_show(name: string) {
        this.setData(name);
    }

}
