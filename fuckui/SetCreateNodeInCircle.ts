
import { ccclass, property, executeInEditMode, EDITOR, Node, math, UITransform, instantiate, Vec3 } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJDataWork } from '../base/YJDataWork';
import { YJPreCreateNode } from '../base/YJPreCreateNode';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetCreateNodeInCircle
 * DateTime = Mon Jan 30 2023 16:47:50 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateNodeInCircle.ts
 * FileBasenameNoExtension = SetCreateNodeInCircle
 * URL = db://assets/NoUi3/fuckui/SetCreateNodeInCircle.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
@ccclass('CirclePositionInfo')
export class CirclePositionInfo {
    @property
    pos: Vec3 = math.v3();
    @property
    rotation: number = 0;
}
//创建圆形分布的节点
@ccclass('SetCreateNodeInCircle')
@executeInEditMode()
export class SetCreateNodeInCircle extends FuckUi {
    @property({ type: YJLoadPrefab, displayName: '元素预制体' })
    loadPrefab: YJLoadPrefab = null;
    @property({ type: Node, displayName: '元素模板' })
    template: Node = null;
    @property({ type: Node, displayName: '容器' })
    container: Node = null;
    @property({ displayName: '起始角度' })
    startRotation: number = 0;
    @property({ displayName: '半径', min: 1 })
    radius: number = 0;
    @property({ displayName: '创建数量', min: 1, step: 1 })
    num: number = 1;
    @property({ displayName: '计算' })
    run: boolean = false;
    @property({ type: CirclePositionInfo, readonly: true })
    posInfos: CirclePositionInfo[] = [];
    @property({ displayName: '预览' })
    preview: boolean = false;
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;
    @property(YJLoadAssets)
    loadAsset: YJLoadAssets = null;

    ///////////////////////////EDITOR///////////////
    onLoad() {
        super.onLoad();
        if (!EDITOR) {
            return;
        }
        if (!this.loadPrefab) this.loadPrefab = this.getComponent(YJLoadPrefab);
        if (!this.container) this.container = this.node;
        if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
        if (!this.loadAsset) this.loadAsset = no.getComponentInParents(this.node, YJLoadAssets);
    }

    update() {
        if (!EDITOR) return;
        if (this.run) {
            this.run = false;
            if (!this.container) return;
            const size = this.container.getComponent(UITransform).contentSize;
            const anchor = this.container.getComponent(UITransform).anchorPoint;
            this.posInfos.length = 0;
            const a = 360 / this.num, b = Math.PI / 180;
            const center = math.v2(size.width * (0.5 - anchor.x), size.height * (0.5 - anchor.y));
            for (let i = 0; i < this.num; i++) {
                let pi = new CirclePositionInfo();
                let ro = this.startRotation + a * i;
                pi.pos.x = this.radius * Math.sin(b * ro) + center.x;
                pi.pos.y = this.radius * Math.cos(b * ro) + center.y;
                pi.rotation = - ro;
                this.posInfos[this.posInfos.length] = pi;
            }
        }
        if (this.preview) {
            this.preview = false;
            if (!this.template) return;
            for (let i = 0; i < this.num; i++) {
                let item = instantiate(this.template);
                this.setPos(item, i);
                item.parent = this.container;
                item.active = true;
            }
        }
    }

    onDestroy() {
        if (EDITOR) {
            return;
        }
        if (this.loadPrefab && this.template && this.template.isValid)
            this.template.destroy();
    }

    protected onDataChange(data: any) {
        this.setItems([].concat(data));
    }

    protected async setItems(data: any[]) {
        let l = this.container.children.length;
        if (l == 0) {
            const prefabUrl = this.loadPrefab?.prefabUrl;
            if (prefabUrl && YJPreCreateNode.ins.has(prefabUrl)) {
                for (let i = 0; i < this.num; i++) {
                    let cacheItem = YJPreCreateNode.ins.useNode(prefabUrl);
                    if (cacheItem) {
                        if (this.dynamicAtlas) {
                            YJDynamicAtlas.setDynamicAtlas(cacheItem, this.dynamicAtlas);
                            YJLoadAssets.setLoadAsset(cacheItem, this.loadAsset);
                        }
                        cacheItem.active = false;
                        this.setPos(cacheItem, i);
                        cacheItem.parent = this.container;
                    } else break;
                }
                YJPreCreateNode.ins.fillNode(prefabUrl);
            } else {
                for (let i = 0; i < this.num; i++) {
                    let item = this.loadPrefab?.instantiateNode() || instantiate(this.template);
                    if (this.dynamicAtlas) {
                        YJDynamicAtlas.setDynamicAtlas(item, this.dynamicAtlas);
                        YJLoadAssets.setLoadAsset(item, this.loadAsset);
                    }
                    item.active = false;
                    this.setPos(item, i);
                    item.parent = this.container;
                }
            }

            l = this.num;
        }
        for (let i = 0; i < l; i++) {
            let item = this.container.children[i];
            if (data[i] == null) {
                item.active = false;
            } else {
                let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
                if (a) {
                    a.data = data[i];
                    a.init();
                }
                item.active = true;
            }
        }
    }

    private setPos(item: Node, idx: number) {
        item.setPosition(this.posInfos[idx].pos);
        // item.setRotation(0, 0, this.posInfos[idx].rotation, this.posInfos[idx].rotation);
        item.angle = this.posInfos[idx].rotation;
    }
}

