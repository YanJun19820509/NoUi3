import { math } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { CreateMapObjectBase, TileInfo, TilePos } from '../../MapEngine/component/CreateMapObjectBase';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { SetSpriteFrameInSampler2D } from '../fuckui/SetSpriteFrameInSampler2D';
import { no } from '../no';
const { ccclass, property } = _decorator;

@ccclass('YJCreateMapLandform')
export class YJCreateMapLandform extends CreateMapObjectBase {
    @property({ type: YJLoadPrefab })
    tilePrefab: YJLoadPrefab = null;
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;
    @property(YJLoadAssets)
    loadAsset: YJLoadAssets = null;

    public async pave() {
        await this.tilePrefab.loadPrefab();
        const n = this._gridpos.length;
        if (this.container.uuid == this.node.uuid)
            this.container.removeAllChildren();
        let emptyNum = this.density.randomValue;
        let point = math.v2();
        for (let i = 0; i < n; i++) {
            if (emptyNum > 0) {
                emptyNum--;
                continue;
            } else if (emptyNum <= 0) {
                emptyNum = this.density.randomValue;
            }
            const pos = this._gridpos[i];
            point.set(pos.x, pos.y);
            const isIn = this.checkInSpace(point);
            if (isIn && this.isEmpty) continue;
            if (!isIn && !this.isEmpty) continue;
            this.createGrid(pos);
        }
    }

    protected createGrid(pos: TilePos, tileInfo?: TileInfo) {
        const name = `${pos.u}_${pos.v}`;
        let node = this.container.getChildByName(name);
        if (node) return;
        if (!tileInfo) {
            const idx = no.weightRandomObject(this.tileInfos, 'weight');
            tileInfo = this.tileInfos[idx];
        }

        node = this.tilePrefab.clone();
        if (this.dynamicAtlas) {
            YJDynamicAtlas.setDynamicAtlas(node, this.dynamicAtlas);
            YJLoadAssets.setLoadAsset(node, this.loadAsset);
        }
        node.getComponent(SetSpriteFrameInSampler2D).setSpriteFrame(tileInfo.tileName);
        if (this.isCenter) {
            node.setPosition(pos.x, pos.y - tileInfo.tileConfig.thickness / 2);
        } else {
            const w = this.gridSize.width / 2,
                h = this.gridSize.height / 2;
            node.setPosition(pos.x + no.randomBetween(-w, w), pos.y + no.randomBetween(-h, h))
        }
        node.parent = this.container;
        this.useGrid(pos);
    }
}


