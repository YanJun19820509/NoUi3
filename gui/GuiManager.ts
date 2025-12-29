import { gui } from "@core/gui/GUI";
import { no } from "../no";
import { YJAddPanelToMetaKey, YJAllowMultipleOpen, YJPanelCreated, YJPanelPrefabMetaKey } from "../types";
import { ccclass, easing, js, Node, Prefab, view } from "../yj";
import { YJDataWork } from "../base/YJDataWork";
import { GuiPanel } from "./GuiPanel";

@ccclass('GuiManager')
export class GuiManager {
    private static _loadedPrefabs: Prefab[] = [];
    /**
     * 通过gui显示界面
     * @param comp yjpanel
     * @param to 'ui' | 'popup' | 'dialog' | 'notify'，分别对应 base|popu|mess
     * @param params 用于dataWork的初始化参数
     * @returns 
     */
    public static createPanel(comp: typeof GuiPanel | string, to?: string, params?: any, cb?: (panel: Node) => void) {
        if (!comp) return;
        if (typeof comp == 'string')
            comp = js.getClassByName(comp) as (typeof GuiPanel);
        if (!comp) return;
        to = to || no.getPrototype(comp, YJAddPanelToMetaKey);
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

        const uuid = gui[to].add(url, params || {}, { modal: false });
        this.afterCreated(to, uuid, cb);
    }

    public static switchPanel(comp: typeof GuiPanel | string, dir: 'left' | 'right', to: string, params?: any, cb?: (panel: Node) => void) {
        this.createPanel(comp, to, params, panel => {
            const size = view.getVisibleSize();
            panel.setPosition(dir == 'left' ? -size.width : size.width, 0);
            const children = gui[to].children;
            let child: Node;
            const tweenData = {
                duration: .5,
                by: 1,
                props: {
                    pos: [dir == 'left' ? size.width : -size.width, 0]
                },
                easing: easing.quadOut
            };
            for (let i = 0, n = children.length; i < n; i++) {
                child = children[i];
                no.TweenSet.play(no.parseTweenData(tweenData, child))
            }
            no.scheduleOnce(() => cb?.(panel), .6, this);
        });
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

    /**
     * 关闭面板
     * @param panel 面板或面板类名
     * @param to 面板层级,当panel为面板类名字符串时，必须指定to
     */
    public static closePanel(panel: GuiPanel | string, to?: string) {
        if (typeof panel == 'string') {
            const children = gui[to].children;
            let child: Node;
            let p: GuiPanel;
            for (let i = 0, n = children.length; i < n; i++) {
                child = children[i];
                p = child.getComponent(panel) as GuiPanel;
                if (p) {
                    gui.delete(child);
                    break;
                }
            }
        } else {
            gui.delete(panel.node);
        }
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

    private static _afterCreatedTimer: { [uuid: number]: any } = {};
    private static _afterCreatedCb(to: string, uuid: number, cb?: (node: Node) => void) {
        const node: Node = gui[to].get(uuid);
        if (node) {
            this._loadedPrefabs.push(node['_prefab'].asset);
            cb?.(node);
            clearInterval(this._afterCreatedTimer[uuid]);
            delete this._afterCreatedTimer[uuid];
        }
    }
    public static afterCreated(to: string, uuid: number, cb?: (node: Node) => void) {
        this._afterCreatedTimer[uuid] = setInterval(() => this._afterCreatedCb(to, uuid, cb));
    }

    public static clearAll() {
        if (this._loadedPrefabs.length == 0) return;
        gui.releaseAll();
        this._loadedPrefabs.forEach(prefab => {
            no.assetBundleManager.release(prefab);
        });
        this._loadedPrefabs.length = 0;
    }
}