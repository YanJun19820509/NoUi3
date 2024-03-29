
import { _decorator, Node } from 'cc';
import YJLoadPrefab from '../../base/node/YJLoadPrefab';
import { panelPrefabPath, YJPanel } from '../../base/node/YJPanel';
import { YJDataWork } from '../../base/YJDataWork';
import { YJLoadAssets } from '../../editor/YJLoadAssets';
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

    @property(Node)
    container: Node = null;

    public curStep: string;
    private static _ins: YJGuidePanel;
    private guideNodeMap: Object;
    protected isGuiding: boolean = false;

    onLoad() {
        YJGuidePanel._ins = this;
    }

    onDestroy() {
        YJGuidePanel._ins = null;
    }

    protected onLoadPanel() {
        this.guideNodeMap = this.guideNodeMap || {};
        this.setGuide();
    }

    protected onClosePanel() {
        this.isGuiding = false;
        no.evn.targetOff(this);
    }

    //子类实现
    protected guideInfo(): any {

    }

    protected async setGuide() {
        let info = this.guideInfo();
        this.dataWork.setValue('lock', info.lock == 1);
        if (info.save) YJGuideManager.ins.save(info.save);
        if (info.event) {
            this.showGuideNode(info.type);
            if (info.content)
                await no.waiForEventValueEqual(info.event, info.content[0], this);
            else await no.waitForEvent(info.event, this);
            if (!this?.node?.isValid) return;
            this.nextStep();
        } else this.showGuide(info);
    }

    protected async showGuide(info: any) {
        if (!this?.node?.isValid) return;
        let guideNode: Node = this.guideNodeMap[info.type];
        if (!guideNode) {
            let a = no.itemOfArray<YJGuideTypeInfo>(this.guideTypes, info.type, 'type');
            guideNode = await a.loadPrefab.loadPrefab();
            if (!this?.node?.isValid) return;
            if (guideNode.getComponent(YJLoadAssets))
                await guideNode.getComponent(YJLoadAssets).load();
            if (!this?.node?.isValid) return;
            guideNode.parent = this.container;
            this.guideNodeMap[info.type] = guideNode;
        }
        let b = guideNode.getComponent(YJDataWork);
        b.clear();
        b.data = info;
        b.init();
        this.showGuideNode(info.type);
    }

    protected showGuideNode(type: string) {
        for (let k in this.guideNodeMap) {
            if (this.onShowGuideNode(k))
                this.guideNodeMap[k].active = k == type;
        }
    }

    protected onShowGuideNode(type: string): boolean {
        return true;
    }

    protected nextStep() {
        let info = this.guideInfo();
        if (info.next_id) {
            this.curStep = info.next_id;
            this.showGuideNode('yj小僧');
            this.setGuide();
        } else this.closePanel();
    }

    public static next(): void {
        this._ins?.nextStep();
    }

    /**
     * 是否在引导中
     */
    public static get isGuiding(): boolean {
        return !!this._ins?.isGuiding;
    }

    /**
     * 隐藏所有类型引导节点
     */
    public hideAllGuideNodes() {
        for (let k in this.guideNodeMap) {
            this.guideNodeMap[k].active = false;
        }
    }
}
