
import { _decorator, Component, Node, SpriteAtlas, assetManager } from 'cc';
import { EDITOR } from 'cc/env';
import { SpriteFrameDataType } from '../types';
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
            assets.forEach(a => {
                aa[aa.length] = { uuid: a.uuid, type: SpriteAtlas };
            });
            let infos: { [k: string]: { [t: string]: SpriteFrameDataType } } = {};
            assetManager.loadAny(aa, null, (err, atlases: SpriteAtlas[]) => {
                console.log(err);
                if (!err) {
                    console.log(atlases.length);
                    atlases.forEach(atlas => {
                        infos[atlas.name] = this.getSpriteFramesInfo(atlas);
                    });

                    Editor.Dialog.select({
                        title: '创建spriteFrame数据json文件',
                        path: Editor.Project.path + '\\assets\\resources',
                        multi: false,
                        type: 'directory',
                        button: '选择'
                    }).then(a => {
                        if (!a.canceled) {
                            let path = a.filePaths[0];
                            // console.log(path);
                            path = path.replace(/\\/g, '/');
                            let root = Editor.Project.path.replace(/\\/g, '/');
                            path = path.replace(root + '/', 'db://');
                            // console.log(path);
                            for (const name in infos) {
                                const file = `${path}/${name}.json`;
                                console.log(`save ${file}`);
                                Editor.Message.send('asset-db', 'create-asset', file, JSON.stringify(infos[name]), { overwrite: true });
                            }
                        }
                    });
                }
            });
        });
    }

    private getSpriteFramesInfo(atlas: SpriteAtlas): { [k: string]: SpriteFrameDataType } {
        let infoMap: { [k: string]: SpriteFrameDataType } = {};
        atlas.getSpriteFrames().forEach(sf => {
            infoMap[sf.name] = {
                uuid: sf._uuid,
                x: sf.rect.x,
                y: sf.rect.y,
                width: sf.rect.width,
                height: sf.rect.height,
                uv: sf.uv,
                unbiasUV: sf.unbiasUV,
                uvSliced: sf.uvSliced,
                capInsets: sf['_capInsets'],
                _rotated: sf.rotated,
            };
        });
        return infoMap;
    }
}
