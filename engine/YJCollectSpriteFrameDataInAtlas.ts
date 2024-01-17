
import { ccclass, property, executeInEditMode, Component, Node, SpriteAtlas, assetManager } from '../yj';
import { SpriteFrameDataType } from '../types';

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
export class YJCollectSpriteFrameDataInAtlas extends Component {
    @property({ displayName: '查找plist文件并生成json' })
    public get run(): boolean {
        return false;
    }

    public set run(v: boolean) {
        YJCollectSpriteFrameDataInAtlas.queryAllPlist();
    }

    @property({ type: SpriteAtlas, displayName: '单个图集' })
    public get oneAtlas(): SpriteAtlas {
        return null;
    }

    public set oneAtlas(v: SpriteAtlas) {
        Editor.Message.request('asset-db', 'query-asset-info', v.uuid).then(info => {
            const con = YJCollectSpriteFrameDataInAtlas.getSpriteFramesInfo(v),
                path = info.path;
            YJCollectSpriteFrameDataInAtlas.save(path, con);
        });
    }

    @property
    public get scale(): number {
        return YJCollectSpriteFrameDataInAtlas._scale;
    }

    public set scale(v: number) {
        YJCollectSpriteFrameDataInAtlas._scale = v;
    }

    private static _scale: number = 1;

    private static queryAllPlist() {
        this.createAtlasConfig();
    }

    private static getSpriteFramesInfo(atlas: SpriteAtlas): { [k: string]: SpriteFrameDataType } {
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
                scale: this._scale
            };
        });
        return infoMap;
    }

    private static save(path: string, info: any) {
        const file = `${path}_atlas.json`;
        console.log(`save ${file}`);
        Editor.Message.send('asset-db', 'create-asset', file, JSON.stringify(info), { overwrite: true });
    }

    public static async createAtlasConfig(dir?: string) {
        return new Promise<void>(resolve => {
            Editor.Message.request('asset-db', 'query-assets', { ccType: 'cc.SpriteAtlas' }).then(assets => {
                let aa = [];
                let path = {};
                assets.forEach(a => {
                    if (dir && a.path.indexOf(dir) == -1) return;
                    aa[aa.length] = { uuid: a.uuid, type: SpriteAtlas };
                    const name = a.name.replace('.plist', '');
                    path[name] = a.path;
                });
                let infos: { [k: string]: { [t: string]: SpriteFrameDataType } } = {};
                assetManager.loadAny(aa, null, (err, atlases: SpriteAtlas | SpriteAtlas[]) => {
                    atlases = [].concat(atlases);
                    if (!err) {
                        atlases.forEach(atlas => {
                            infos[atlas.name] = this.getSpriteFramesInfo(atlas);
                        });
                        for (const name in infos) {
                            this.save(path[name], infos[name]);
                            // const file = `${path[name]}_atlas.json`;
                            // console.log(`save ${file}`);
                            // Editor.Message.send('asset-db', 'create-asset', file, JSON.stringify(infos[name]), { overwrite: true });
                        }
                    } else
                        console.log(err);
                    resolve();
                });
            });
        });
    }
}
