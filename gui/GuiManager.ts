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
    public static createPanel(comp: typeof GuiPanel | string, to: 'ui' | 'popup' | 'dialog' | 'notify', params?: any, cb?: (panel: Node) => void) {
        if (!comp) return;
        if (typeof comp == 'string')
            comp = js.getClassByName(comp) as (typeof GuiPanel);
        if (!comp) return;
        let url: string = no.getPrototype(comp, YJPanelPrefabMetaKey);
        url = this.parsePrefabUrl(url);
        const allowMultipleOpen = no.isPrototypeEquals(comp, YJAllowMultipleOpen, '1');
        if (!allowMultipleOpen) {
            let a: GuiPanel;
            const children = gui[to].children;
            let child: Node;
            let panel: GuiPanel;
            for (let i = 0, n = children.length; i < n; i++) {
                child = children[i];
                panel = child.getComponent(comp);
                if (panel) {
                    a = panel;
                    break;
                }
            }
            if (a != null) {
                this._initData(a, params);
                a.initPanel().catch(e => { no.err('GuiManager', e.stack, e.message); });
                cb?.(a.node);
                return;
            } else {
                no.setPrototype(comp, { [YJPanelCreated]: '0' });
            }
        }
        if (!allowMultipleOpen) {
            if (no.isPrototypeEquals(comp, YJPanelCreated, '1')) return;
            else no.setPrototype(comp, { [YJPanelCreated]: '1' });
        }

        const uuid = gui[to].add(url, params || {});
        if (cb) {
            this.afterCreated(to, uuid, cb);
        }
    }

    /**
     * 通过url创建面板
     * @param url 面板url
     * @param to 面板层级
     * @param cb 创建后的回调
     */
    public static createPanelByUrl(url: string, to: 'ui' | 'popup' | 'dialog' | 'notify', cb?: (node: Node) => void) {
        url = this.parsePrefabUrl(url);
        const uuid = gui[to].add(url, {});
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

    private static parsePrefabUrl(url: string) {
        const { bundle, path } = no.assetBundleManager.assetPath(url);
        return `${bundle}|${path}`;
    }

    private static _afterCreatedTimer: any = null;
    private static _afterCreatedCb(to: string, uuid: number, cb: (node: Node) => void) {
        const node = gui[to].get(uuid);
        if (node) {
            cb(node);
            clearInterval(this._afterCreatedTimer);
            this._afterCreatedTimer = null;
        }
    }
    private static afterCreated(to: string, uuid: number, cb: (node: Node) => void) {
        if (this._afterCreatedTimer) {
            clearInterval(this._afterCreatedTimer);
            this._afterCreatedTimer = null;
        }
        this._afterCreatedTimer = setInterval(() => this._afterCreatedCb(to, uuid, cb));
    }
}