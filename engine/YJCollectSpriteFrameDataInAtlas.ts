
import { _decorator, Component, Node, SpriteAtlas, assetManager } from 'cc';
import { EDITOR } from 'cc/env';
import { SpriteFrameDataType } from '../types';
import { no } from '../no';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJCollectSpriteFrameDataInAtlas
 * DateTime = Thu Dec 01 2022 16:59:28 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCollectSpriteFrameDataInAtlas.ts
 * FileBasenameNoExtension = YJCollectSpriteFrameDataInAtlas
 * URL = db://assets/NoUi3/engine/YJCollectSpriteFrameDataInAtlas.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//查找所有图集的plist，获取spriteFrame的相关数据并生成json文件
@ccclass('YJCollectSpriteFrameDataInAtlas')
@executeInEditMode()
export class YJCollectSpriteFrameDataInAtlas extends Component {
    @property({ displayName: '查找plist文件并生成json' })
    run: boolean = false;

    update() {
        if (EDITOR) {
            if (this.run) {
                this.run = false;
                this.queryAllPlist();
            }
        }
    }

    private queryAllPlist() {
        Editor.Message.request('asset-db', 'query-assets', { ccType: 'cc.SpriteAtlas' }).then(assets => {
            let aa = [];
            let path = {};
            assets.forEach(a => {
                aa[aa.length] = { uuid: a.uuid, type: SpriteAtlas };
                const name = a.name.replace('.plist', '');
                path[name] = a.path;
            });
            console.log(path);
            let infos: { [k: string]: { [t: string]: SpriteFrameDataType } } = {};
            assetManager.loadAny(aa, null, (err, atlases: SpriteAtlas[]) => {
                if (!err) {
                    console.log(atlases.length);
                    atlases.forEach(atlas => {
                        infos[atlas.name] = this.getSpriteFramesInfo(atlas);
                    });
                    for (const name in infos) {
                        const file = `${path[name]}_atlas.json`;
                        console.log(`save ${file}`);
                        Editor.Message.send('asset-db', 'create-asset', file, JSON.stringify(infos[name]), { overwrite: true });
                    }
                } else
                    console.log(err);
            });
        });
    }

    private getSpriteFramesInfo(atlas: SpriteAtlas): { [k: string]: SpriteFrameDataType } {
        let infoMap: { [k: string]: SpriteFrameDataType } = {};
        atlas.getSpriteFrames().forEach(sf => {
            infoMap[sf.name] = {
                uuid: sf.uuid,
                x: sf.rect.x,
                y: sf.rect.y,
                width: sf.rect.width,
                height: sf.rect.height,
                uv: sf.uv,
                uvSliced: sf.uvSliced,
                capInsets: sf['_capInsets'],
                rotated: sf.rotated,
            };
        });
        return infoMap;
    }
}
