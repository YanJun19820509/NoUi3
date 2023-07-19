import { YJHintWatcher } from "../../base/YJHintWatcher";
import { YJToggleGroupManager } from "../../base/node/YJToggleGroupManager";
import { FuckUi } from "../../fuckui/FuckUi";
import { no } from "../../no";
import { Component, ccclass, property, Node, instantiate, Label, requireComponent, Toggle } from "../../yj";

//菜单构建器

@ccclass('YJMenuItemInfo')
export class YJMenuItemInfo {
    @property
    title: string = '';
    @property({ displayName: '红点key', tooltip: '多个key用逗号分隔' })
    redHintKeys: string = '';
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
    @property
    autoCreate: boolean = true;

    onLoad() {
        this.autoCreate && this.createMenu();
    }

    public createMenu() {
        this.menuItems.forEach(info => {
            const item = instantiate(this.itemTemp);
            item.getComponent(Toggle).isChecked = false;
            if (info.title)
                item.getComponentInChildren(Label)?.node.getComponent(FuckUi)?.setData(no.jsonStringify(info.title));
            if (info.redHintKeys)
                item.getComponentInChildren(YJHintWatcher)?.setHintTypes(info.redHintKeys);
            item.active = true;
            item.parent = this.container || this.node;
        });
        this.scheduleOnce(() => {
            this.getComponent(YJToggleGroupManager).initToggles();
        })
    }
}
