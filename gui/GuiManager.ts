import { gui } from "@core/gui/GUI";
import { YJPanel } from "../base/node/YJPanel";
import { no } from "../no";
import { YJAllowMultipleOpen, YJPanelCreated, YJPanelPrefabMetaKey } from "../types";
import { ccclass, js } from "../yj";
import { YJDataWork } from "../base/YJDataWork";

@ccclass('GuiManager')
export class GuiManager {

    /**
     * 通过gui显示界面
     * @param comp yjpanel
     * @param to 'ui' | 'popup' | 'dialog' | 'notify'，分别对应 base|popu|mess
     * @param params 用于dataWork的初始化参数
     * @returns 
     */
    public static createPanel(comp: typeof YJPanel | string, to: 'ui' | 'popup' | 'dialog' | 'notify', params?: any) {
        if (!comp) return;
        if (typeof comp == 'string')
            comp = js.getClassByName(comp) as (typeof YJPanel);
        if (!comp) return;
        const url = this.parsePrefabUrl(comp);
        const allowMultipleOpen = no.isPrototypeEquals(comp, YJAllowMultipleOpen, '1');
        if (!allowMultipleOpen) {
            let a: YJPanel;
            const children = gui[to].children;
            for (let i = 0, n = children.length; i < n; i++) {
                const child = children[i];
                const panel = child.getComponent(comp);
                if (panel) {
                    a = panel;
                    break;
                }
            }
            if (a != null) {
                a.initPanel().then(this._initData.bind(this, a, params)).catch(e => { no.err('GuiManager', e.stack, e.message); });
                return;
            }
        }
        if (!allowMultipleOpen) {
            if (no.isPrototypeEquals(comp, YJPanelCreated, '1')) return;
            else no.setPrototype(comp, { [YJPanelCreated]: '1' });
        }

        gui[to].add(url, params);
    }
    private static _initData(panel: YJPanel, params: any) {
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
}