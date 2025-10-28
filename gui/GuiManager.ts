import { gui } from "@core/gui/GUI";
import { no } from "../no";
import { YJAllowMultipleOpen, YJPanelCreated, YJPanelPrefabMetaKey } from "../types";
import { ccclass, js, Node } from "../yj";
import { YJDataWork } from "../base/YJDataWork";
import { GuiPanel } from "./GuiPanel";

@ccclass('GuiManager')
export class GuiManager {

    /**
     * 通过gui显示界面
     * @param comp yjpanel
     * @param to 'ui' | 'popup' | 'dialog' | 'notify'，分别对应 base|popu|mess
     * @param params 用于dataWork的初始化参数
     * @returns 
     */
    public static createPanel<T extends GuiPanel>(comp: typeof GuiPanel | string, to: 'ui' | 'popup' | 'dialog' | 'notify', params?: any, cb?: (panel: T) => void) {
        if (!comp) return;
        if (typeof comp == 'string')
            comp = js.getClassByName(comp) as (typeof GuiPanel);
        if (!comp) return;
        const url = this.parsePrefabUrl(comp);
        // const allowMultipleOpen = no.isPrototypeEquals(comp, YJAllowMultipleOpen, '1');
        // if (!allowMultipleOpen) {
        //     let a: GuiPanel;
        //     const children = gui[to].children;
        //     let child: Node;
        //     let panel: GuiPanel;
        //     for (let i = 0, n = children.length; i < n; i++) {
        //         child = children[i];
        //         panel = child.getComponent(comp);
        //         if (panel) {
        //             a = panel;
        //             break;
        //         }
        //     }
        //     if (a != null) {
        //         this._initData(a, params);
        //         a.initPanel().catch(e => { no.err('GuiManager', e.stack, e.message); });
        //         return;
        //     }
        // }
        // if (!allowMultipleOpen) {
        //     if (no.isPrototypeEquals(comp, YJPanelCreated, '1')) return;
        //     else no.setPrototype(comp, { [YJPanelCreated]: '1' });
        // }

        const uuid = gui[to].add(url, params || {});
        if (cb) this.afterCreated(to, uuid, cb);
    }

    public static closePanel(panel: GuiPanel) {
        gui.delete(panel.node);
    }

    private static _initData(panel: GuiPanel, params: any) {
        const dataWork: YJDataWork = panel['dataWork'];
        if (dataWork) {
            dataWork.clear().initWithData(params);
        }
    }

    private static parsePrefabUrl(comp: any) {
        let url: string = no.getPrototype(comp, YJPanelPrefabMetaKey);
        const { bundle, path } = no.assetBundleManager.assetPath(url);
        return `${bundle}|${path}`;
    }

    private static afterCreated<T extends GuiPanel>(to: string, uuid: number, cb: (panel: T) => void) {
        const node = gui[to].get(uuid);
        if (!node) {
            return setTimeout(this.afterCreated, 100, to, uuid, cb);
        }
        const panel = node.getComponent(GuiPanel);
        cb(panel as T);
    }
}