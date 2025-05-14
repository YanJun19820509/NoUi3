

/**
 * Predefined variables
 * Name = LoadingPanel
 * DateTime = Sun Oct 09 2022 11:27:20 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = LoadingPanel.ts
 * FileBasenameNoExtension = LoadingPanel
 * URL = db://assets/sub/ui-temp/loading_panel/LoadingPanel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

import { YJDataWork } from "../../../base/YJDataWork";
import { YJPanel } from "../../../base/node/YJPanel";
import { YJWindowManager } from "../../../base/node/YJWindowManager";
import { no } from "../../../no";
import { panelPrefabPath } from "../../../types";
import { ccclass, macro, property } from "../../../yj";

//通用loading面板，当有界面将要显示时会自动出现在最上层，当界面关闭时会移到下层界面之下，如果当前没有任何界面将关闭
@ccclass('LoadingPanel')
@panelPrefabPath('db://assets/WJCY/scripts/common/base/node/popu/loading_panel.prefab')
export class LoadingPanel extends YJPanel {
    @property({ type: YJDataWork })
    dataWork: YJDataWork = null;

    private static _ins: LoadingPanel;
    private curTo: string;
    // cacheToPool: boolean = false;

    public static get ins(): LoadingPanel {
        return this._ins;
    }

    onLoad(): void {
        super.onLoad();
        LoadingPanel._ins = this;
    }

    onDestroy(): void {
        LoadingPanel._ins = null;
    }

    protected onInitPanel() {
        no.evn.on('__popu_panel_open', this.onPanelOpen, this);
        no.evn.on('__popu_panel_close', this.onPanelClose, this);
        this.dataWork.setValue('show', true)
            .setValue('hide', 1);
    }

    private onPanelOpen() {
        // this.schedule(() => {
        //     no.siblingIndex(this.node, this.node.parent.children.length - 2);
        // }, 0, 30);
    }

    // private _num: number = 0;
    // private checkSiblingIndex() {
    //     let all = 0, opened = 0, i = no.siblingIndex(this.node);
    //     this.node.parent.children.forEach(c => {
    //         all++;
    //         if (c.getComponent(YJPanel)?.status == 'open') opened++;
    //     });
    //     // if (i == all - 2) return;
    //     if (opened == 1) {
    //         if (++this._num == 30) {
    //             this._isChecking = false;
    //             this.hide();
    //         }
    //         return;
    //     }
    //     this._num = 0;
    //     // no.siblingIndex(this.node, all - 2);
    //     this.showAni(false);
    //     this.unschedule(this.checkSiblingIndex);
    //     this._isChecking = false;
    // }

    private onPanelClose() {
        if (this.curTo != 'popu') {
            YJWindowManager.setPanelTo(this, 'popu');
            this.curTo = 'popu';
        }
        this.schedule(() => {
            let all = 0, opened = 0;
            this.node.parent.children.forEach(c => {
                all++;
                if (c.getComponent(YJPanel)?.status == 'open') opened++;
            });
            if (opened == 1) {
                this.onHide();
                return;
            }
            if (this.status == 'open') {
                no.siblingIndex(this.node, all - 2);
            }
        }, 0, 30);
    }

    public static show(cb?: () => void) {
        YJWindowManager.createPanel(this, 'popu', (panel: LoadingPanel) => {
            panel.curTo = 'popu';
            panel.unscheduleAllCallbacks();
            panel.scheduleOnce(panel.showAni, .5);
        }, cb);
    }

    public static showTo(to: string, cb?: () => void) {
        if (this._ins?.curTo == 'popu' && to == 'popu') {
            this.show(cb);
            return;
        }
        const self = YJWindowManager.opennedPanel<LoadingPanel>(LoadingPanel, this._ins?.curTo || 'popu');
        if (!self) {
            YJWindowManager.createPanel(this, to, (panel: LoadingPanel) => {
                panel.curTo = to;
                panel.unscheduleAllCallbacks();
                panel.scheduleOnce(panel.showAni, .5);
            }, cb);
        } else {
            YJWindowManager.setPanelTo(self, to);
            self.curTo = to;
            self.unscheduleAllCallbacks();
            self.scheduleOnce(self.showAni, .5);
            self.initPanel().then(cb);
        }
    }

    public static hide() {
        no.waitFor(() => { return !!this._ins; }).then(() => {
            this._ins.onPanelClose();
        });
    }

    public static done() {
        no.waitFor(() => { return !!this._ins; }).then(() => {
            this._ins.unschedule(this._ins.showAni);
            this._ins.dataWork.setValue('showAni', false);
            // this._ins._num = 0;
            // this._ins.schedule(this._ins.checkSiblingIndex, .1, macro.REPEAT_FOREVER);
        });
    }

    public static loadBundle(bundleName: string, onComplete: () => void) {
        this.show();
        no.assetBundleManager.loadBundle(bundleName, () => {
            onComplete?.();
            this.hide();
        });
    }

    private showAni(v = true) {
        this.dataWork.setValue('showAni', v);
    }

    private onHide() {
        this.dataWork.setValue('hide', true)
            .setValue('show', 1);
    }
}