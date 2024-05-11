import { no } from "../no";
import { YJCharLabel } from "../widget/charLabel/YJCharLabel";
import { Component, Prefab, Sprite, _AssetInfo, assetManager, ccclass, instantiate, property } from "../yj";

/**
 * 检测预制体，包括：1. 检查是否存在错误；2. 检查未使用SetSpriteFrameInSampler2D；3. 检查使用SetSpriteFrameInSampler2D中是否为FILLED类型。
 */

const enum CheckType {
    Error = 0,
    SetSpriteFrameInSampler2D,
    FILLED
}

@ccclass('YJCheckSpriteFrame')
export class YJCheckSpriteFrame extends Component {
    @property({ displayName: '检测预制体错误' })
    public get checkErr(): boolean {
        return false;
    }

    public set checkErr(v: boolean) {
        this.lookupAllPrefabs(CheckType.Error);
    }
    @property({ displayName: '检查未使用SetSpriteFrameInSampler2D' })
    public get checkSetSpriteFrameInSampler2D(): boolean {
        return false;
    }

    public set checkSetSpriteFrameInSampler2D(v: boolean) {
        this.lookupAllPrefabs(CheckType.SetSpriteFrameInSampler2D);
    }
    @property({ displayName: '检查Sprite为FILLED类型' })
    public get checkFILLED(): boolean {
        return false;
    }

    public set checkFILLED(v: boolean) {
        this.lookupAllPrefabs(CheckType.FILLED);
    }

    private lookupAllPrefabs(checkType: CheckType) {
        no.warn('开始检测', checkType)
        Editor.Message.request('asset-db', 'query-assets', { ccType: 'cc.Prefab' }).then(infos => {
            let aa = [];
            let path: any = {};
            infos.forEach(a => {
                if (a.path.startsWith('db://assets/res') || a.path.startsWith('db://assets/resources')) {
                    aa[aa.length] = { uuid: a.uuid, type: Prefab };
                    path[a.uuid] = a.url;
                }
            });
            if (checkType == CheckType.Error) this.checkPrefabError(aa, path);
            else {
                assetManager.loadAny(aa, null, (err, prefabs: Prefab[]) => {
                    if (!err) {
                        prefabs.forEach(p => {
                            this.checkSprite(p, path[p.uuid], checkType);
                        })
                    } else
                        no.err(err.message);
                    no.warn('检测完成')
                });
            }
        });
    }

    private checkPrefabError(requests: any[], path: any, idx = 0) {
        const a = requests[idx];
        if (!a) return no.warn('检测完成');
        assetManager.loadAny(a, null, (err, prefabs: Prefab[]) => {
            if (!err) {
                this.checkPrefabError(requests, path, ++idx);
            } else
                no.err('预制体异常：', path[a.uuid]);
        });
    }

    private checkSprite(prefab: Prefab, url: string, checkType: CheckType) {
        const node = instantiate(prefab),
            arr = node.getComponentsInChildren(Sprite);
        arr.forEach(a => {
            if (a instanceof YJCharLabel) return;
            if (checkType == CheckType.SetSpriteFrameInSampler2D) {
                //检测sprite节点上没有挂SetSpriteFrameInSampler2D
                if (!a.getComponent('SetSpriteFrameInSampler2D') && a.spriteFrame && !a.spriteFrame.name.startsWith('default_') && !a.spriteFrame.uuid.endsWith('@f9941')) {
                    no.err(`预制体${url}     节点${a.name}`);
                }
                // else if (!a.getComponent('SetSpriteFrameInSampler2D') && a.spriteFrame)
                //     no.warn(`预制体[${url}]    节点[${a.name}]  spriteFrame[${a.spriteFrame?.name}|${a.spriteFrame?.uuid}]`)
            }
            if (checkType == CheckType.FILLED) {
                //检测sprite type 为FILLED
                if (a.type == Sprite.Type.FILLED && a.getComponent('SetSpriteFrameInSampler2D')?.['loadFromAtlas']) {
                    no.err(`预制体${url}     节点${a.name}`);
                }
            }
        });
    }
}


