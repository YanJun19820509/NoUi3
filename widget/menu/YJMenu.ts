import { YJHintWatcher } from "../../base/YJHintWatcher";
import { YJToggleGroupManager } from "../../base/node/YJToggleGroupManager";
import { FuckUi } from "../../fuckui/FuckUi";
import { no } from "../../no";
import { Component, ccclass, property, Node, instantiate, Label, requireComponent, Toggle } from "../../yj";
import { YJCharLabel } from "../charLabel/YJCharLabel";

//菜单构建器

@ccclass('YJMenuItemInfo')
export class YJMenuItemInfo {
    @property
    title: string = '';
    @property({ displayName: '红点key', tooltip: '多个key用逗号分隔' })
    redHintKeys: string = '';
    @property
    DEBUG: boolean = false;
}

@ccclass('YJMenu')
@requireComponent(YJToggleGroupManager)
export class YJMenu extends Component {
    @property({ type: YJMenuItemInfo })
    menuItems: YJMenuItemInfo[] = []
    @property({ type: Node, displayName: '菜单子项模板' })
    itemTemp: Node = null;
    @property({ type: Node })
    container: Node = null;
    @property({ step: 1, min: -1 })
    defaultChecked: number = 0;
    @property
    autoCreate: boolean = true;

    onLoad() {
        this.autoCreate && this.createMenu(this.menuItems);
    }

    onEnable() {
        this.scheduleOnce(() => {
            this.getComponent(YJToggleGroupManager).initToggles();
        })
    }

    public createMenu(menuItems: YJMenuItemInfo[]) {
        if (!menuItems || menuItems.length == 0) return;
        this.container = this.container || this.node;
        this.container.removeAllChildren();
        menuItems.forEach((info, i) => {
            if (!no.isDebug() && info.DEBUG) return;
            const item = instantiate(this.itemTemp);
            item.getComponent(Toggle).isChecked = this.defaultChecked == i;
            if (info.title) {
                let list: any[] = item.getComponentsInChildren(Label);
                if (list.length == 0)
                    list = item.getComponentsInChildren(YJCharLabel);
                list.forEach(a => {
                    a.getComponent(FuckUi)?.setData(no.jsonStringify(info.title));
                });
            }
            if (info.redHintKeys)
                item.getComponentInChildren(YJHintWatcher)?.setHintTypes(info.redHintKeys);
            item.active = true;
            item.parent = this.container || this.node;
        });
    }
}
