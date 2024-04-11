import { SetSpriteFrameInSampler2D } from "../fuckui/SetSpriteFrameInSampler2D";
import { no } from "../no";
import { YJCharLabel } from "../widget/charLabel/YJCharLabel";
import { Component, Prefab, Sprite, _AssetInfo, assetManager, ccclass, instantiate, property } from "../yj";


@ccclass('YJCheckSpriteFrame')
export class YJCheckSpriteFrame extends Component {
    @property
    public get check(): boolean {
        return false;
    }

    public set check(v: boolean) {
        this.lookupAllPrefabs();
    }

    private lookupAllPrefabs() {
        Editor.Message.request('asset-db', 'query-assets', { ccType: 'cc.Prefab' }).then(infos => {
            let aa = [];
            let path: any = {};
            infos.forEach(a => {
                if (a.path.startsWith('db://assets/res') || a.path.startsWith('db://assets/resources')) {
                    aa[aa.length] = { uuid: a.uuid, type: Prefab };
                    path[a.uuid] = a.url;
                }
            });
            no.log('开始检测')
            assetManager.loadAny(aa, null, (err, prefabs: Prefab[]) => {
                if (!err) {
                    prefabs.forEach(p => {
                        this.checkPrefab(p, path[p.uuid]);
                    })
                } else
                    no.err(err);
                no.log('检测完成')
            });

        });
    }

    private checkPrefab(prefab: Prefab, url: string) {
        const node = instantiate(prefab),
            arr = node.getComponentsInChildren(Sprite);
        arr.forEach(a => {
            if (a instanceof YJCharLabel) return;
            //检测sprite节点上没有挂SetSpriteFrameInSampler2D
            // if (!a.getComponent(SetSpriteFrameInSampler2D) && a.spriteFrame && !a.spriteFrame.name.startsWith('default_') && !a.spriteFrame.uuid.indexOf('@f9941')) {
            //     no.err(`预制体${url}     节点${a.name}`);
            // } else if (!a.getComponent(SetSpriteFrameInSampler2D) && a.spriteFrame)
            //     no.log(`预制体[${url}]    节点[${a.name}]  spriteFrame[${a.spriteFrame?.name}|${a.spriteFrame?.uuid}]`)

            //检测sprite type 为FILLED
            // if (a.type == Sprite.Type.FILLED && a.getComponent(SetSpriteFrameInSampler2D)?.loadFromAtlas) {
            //     no.err(`预制体${url}     节点${a.name}`);
            // }
        });
    }
}


