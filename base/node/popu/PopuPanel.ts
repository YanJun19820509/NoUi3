import { no } from '../../../no';
import { YJWindowManager } from '../../../base/node/YJWindowManager';
import { PopuPanelContent } from './PopuPanelContent';
import { AllowMultipleOpen, YJAllowMultipleOpen, YJPanelCreated, YJPanelPrefabMetaKey } from '../../../types';
import { YJPanel } from '../../../base/node/YJPanel';
import { YJButton } from '../../../fix/YJButton';
import { ccclass, js, Prefab, property, Node, instantiate } from '../../../yj';
import { YJUIAnimationEffect } from '../../../base/ani/YJUIAnimationEffect';

@ccclass('PopuPanel')
@AllowMultipleOpen()
export class PopuPanel extends YJPanel {
    @property({ type: Node })
    content: Node = null;
    @property({ type: YJUIAnimationEffect })
    playOpenAnimation: YJUIAnimationEffect = null;
    @property({ type: YJButton })
    closeBtn: YJButton = null;

    tryNum: number = 60;

    public static show(compName: string, to = 'popu', data?: any, cb?: () => void) {
        if (!compName) return;
        const comp = js.getClassByName(compName) as (typeof PopuPanelContent);
        if (!comp) return;
        no.log('load panelcontent', compName);
        const allowMultipleOpen = comp.prototype[YJAllowMultipleOpen] == '1';
        if (!allowMultipleOpen) {
            const a = YJWindowManager.opennedPanelByType<PopuPanel>(compName, to);
            if (a) {
                a.setContentPanelData(data);
                a.initPanel().then(() => {
                    a.playOpenAnimation?.a_play();
                    no.visible(a.node, true);
                }).catch(e => { no.err('popupanel', e); });
                cb?.();
                no.evn.emit('__popu_panel_open');
                return;
            }
        }
        if (!allowMultipleOpen) {
            if (comp.prototype[YJPanelCreated] == '1') return;
            else comp.prototype[YJPanelCreated] = '1';
        }
        YJWindowManager.createPanel<PopuPanel>(this, to, panel => {
            no.visibleByOpacity(panel.node, false);
            panel.panelType = compName;
            panel.nodeCacheKey = compName;
            panel.createContent(comp as (typeof PopuPanelContent), data);
        }, () => {
            cb?.();
            no.evn.emit('__popu_panel_open');
        });
    }

    public touchCloseDisable() {
        if (this.closeBtn)
            this.closeBtn.canClick = false;
    }

    public a_closePanel() {
        const ppc = this.content.getComponentInChildren(PopuPanelContent);
        if (!ppc && this.tryNum > 0) {
            this.tryNum--;
            this.scheduleOnce(() => {
                this.a_closePanel();
            }, .1);
            return;
        }
        ppc?.onClose();
        this.closePanel();
        no.evn.emit('__popu_panel_close');
    }

    public closePopuPanel(): void {
        this.closeBtn?.a_trigger(null);
    }

    public closePopuPanelNoAni() {
        this.a_closePanel();
    }

    private createContent(comp: typeof PopuPanelContent, data?: any) {
        const k = comp.prototype[YJPanelPrefabMetaKey];
        const prefab: Prefab = no.assetBundleManager.getCachedAsset(k);
        if (prefab) {
            const node = instantiate(prefab);
            this.setContent(node, data);
        } else {
            const request = { type: Prefab, url: k };
            no.assetBundleManager.loadAny(request, (pf: Prefab) => {
                if (!pf) {
                    no.err('无法加载预制体', request.url);
                } else {
                    no.assetBundleManager.cacheAsset(k, pf);
                    const node = instantiate(pf);
                    this.setContent(node, data);
                }
            });
        }
    }

    private async setContent(node: Node, data?: any) {
        if (!no.checkValid(this.content)) return;
        // no.visible(node, false);
        const ppc = node.getComponent(PopuPanelContent);
        this.needCache = ppc.needCache;
        this.needClear = ppc.needClear;
        ppc.initContent().then(() => {
            ppc.init(this, data);
            node.parent = this.content;
            no.visibleByOpacity(this.node, true);
            this.playOpenAnimation?.a_play();
        });
    }

    private setContentPanelData(data?: any) {
        const ppc = this.content.getComponentInChildren(PopuPanelContent);
        if (!ppc) return;
        ppc.init(this, data);
        ppc.onEnable();
    }

    protected onInitPanel() {

    }
    /**
     * 需要动态创建节点的逻辑放在这里
     */
    protected onLoadPanel() {

    }

    public a_onOpenAniOver() {
        this.content.getComponentInChildren(PopuPanelContent)?.onOpenAniOver();
    }
}