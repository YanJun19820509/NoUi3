import { _decorator, Component, Node, JsonAsset } from 'cc';
import { EDITOR } from 'cc/env';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { JsonInfo, YJLoadAssets } from '../editor/YJLoadAssets';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { YJCreateMapLandform } from './YJCreateMapLandform';
import { YJCreateMapPath } from './YJCreateMapPath';
const { ccclass, property, requireComponent, executeInEditMode } = _decorator;

@ccclass('YJAutoMap')
@executeInEditMode()
export class YJAutoMap extends Component {
    @property({ type: JsonInfo, displayName: '配置文件' })
    mepInfo: JsonInfo = new JsonInfo();
    @property({ editorOnly: true })
    doCheck: boolean = false;
    @property({ type: YJLoadPrefab })
    landformPrefab: YJLoadPrefab = null;
    @property({ type: YJLoadPrefab })
    pathPrefab: YJLoadPrefab = null;

    @property({ displayName: '自动加载' })
    autoLoad: boolean = true;

    @property({ type: no.EventHandlerInfo, displayName: '加载前' })
    onBeforeLoad: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '加载完成' })
    onLoadComplete: no.EventHandlerInfo[] = [];

    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;
    @property(YJLoadAssets)
    loadAsset: YJLoadAssets = null;

    private _mapConfig: any;

    update() {
        if (!EDITOR) return;
        if (!this.doCheck) return;
        this.doCheck = false;
        this.mepInfo.check();
    }

    onLoad() {
        if (EDITOR) {
            if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
            if (!this.loadAsset) this.loadAsset = no.getComponentInParents(this.node, YJLoadAssets);
            return;
        }
        this.autoLoad && this.loadMap();
    }

    public loadMap(): void {
        no.assetBundleManager.loadJSON(this.mepInfo.url, (asset: JsonAsset) => {
            this._mapConfig = asset.json;
            this.createLandform();
        });
    }

    private async createLandform() {
        const lands: any = this._mapConfig.lands;
        for (const key in lands) {
            const land = lands[key];
            if (!land.isEnable) continue;
            if (land.isPath) {
                await this.pathPrefab.loadPrefab();
                const pathNode = this.pathPrefab.clone();
                pathNode.name = land.name;
                pathNode.parent = this.node;
                const cmp = pathNode.getComponent(YJCreateMapPath);
                if (this.dynamicAtlas) {
                    cmp.dynamicAtlas = this.dynamicAtlas;
                    cmp.loadAsset = this.loadAsset;
                }
                cmp.setConfig(land);
                cmp.setTileInfos(land.tileInfos, this._mapConfig.tiles);
                cmp.pave();
            } else {
                await this.landformPrefab.loadPrefab();
                const landNode = this.landformPrefab.clone();
                landNode.name = land.name;
                landNode.parent = this.node;
                const cmp = landNode.getComponent(YJCreateMapLandform);
                if (this.dynamicAtlas) {
                    cmp.dynamicAtlas = this.dynamicAtlas;
                    cmp.loadAsset = this.loadAsset;
                }
                cmp.setConfig(land);
                cmp.setTileInfos(land.tileInfos, this._mapConfig.tiles);
                cmp.pave();
            }
        }
    }

    public a_reload() {
        this.node.removeAllChildren();
        this.createLandform();
    }
}


