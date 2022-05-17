
import { _decorator, Node } from 'cc';
import YJLoadPrefab from '../../base/node/YJLoadPrefab';
import { panelPrefabPath, YJPanel } from '../../base/node/YJPanel';
import { YJDataWork } from '../../base/YJDataWork';
import { no } from '../../no';
import { YJGuideManager } from './YJGuideManager';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJGuidePanel
 * DateTime = Mon May 16 2022 09:24:54 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJGuidePanel.ts
 * FileBasenameNoExtension = YJGuidePanel
 * URL = db://assets/NoUi3/widget/guide/YJGuidePanel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJGuideTypeInfo')
export class YJGuideTypeInfo {
    @property(YJLoadPrefab)
    loadPrefab: YJLoadPrefab = null;
    @property
    type: string = '';
}

@ccclass('YJGuidePanel')
@panelPrefabPath('db://assets/NoUi3/widget/guide/guidePanel.prefab')
export class YJGuidePanel extends YJPanel {
    @property(YJDataWork)
    dataWork: YJDataWork = null;

    @property(YJGuideTypeInfo)
    guideTypes: YJGuideTypeInfo[] = [];

    public curStep: string;
    private static _ins: YJGuidePanel;
    private guideNodeMap: Object;

    onLoad() {
        YJGuidePanel._ins = this;
    }

    onDestroy() {
        YJGuidePanel._ins = null;
    }

    protected onInitPanel() {
        this.guideNodeMap = this.guideNodeMap || {};
        this.setGuide();
    }

    protected onClosePanel() {

    }

    private async setGuide() {
        let info = YJGuideManager.ins.getGuideInfo(this.curStep);
        if (info.event) {
            this.showGuideNode(info.type);
            await no.waitForEvent(info.event);
            this.nextStep();
        } else this.showGuide(info);
    }

    private async showGuide(info: any) {
        let guideNode: Node = this.guideNodeMap[info.type];
        if (!guideNode) {
            let a = no.itemOfArray<YJGuideTypeInfo>(this.guideTypes, info.type, 'type');
            guideNode = await a.loadPrefab.loadPrefab();
            this.guideNodeMap[info.type] = guideNode;
        }
        let b = guideNode.getComponent(YJDataWork);
        b.data = info;
        b.init();
        this.showGuideNode(info.type);
    }

    private showGuideNode(type: string) {
        for (let k in this.guideNodeMap) {
            this.guideNodeMap[k].active = k == type;
        }
    }

    private nextStep() {
        let info = YJGuideManager.ins.getGuideInfo(this.curStep);
        if (info.save) YJGuideManager.ins.save(info.save);
        if (info.next_id) {
            this.curStep = info.next_id;
            this.setGuide();
        } else this.closePanel();
    }

    public static next(): void {
        YJGuidePanel._ins?.nextStep();
    }

}
