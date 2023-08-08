import { CCString } from "cc";
import { no } from "../no";
import { ccclass, Component, EDITOR, executeInEditMode, property, TextAsset } from "../yj";
import { YJProtobuf } from "./YJProtobuf";

/**proto管理器 
 * 通过pbjs 将多个.proto文件合成一个.json文件
 * proto管理器将加载该.json文件
*/
@ccclass('YJProtobufManager')
@executeInEditMode()
export class YJProtobufManager extends Component {
    @property
    root: string = '';
    @property
    check: boolean = false;
    @property({ readonly: true })
    protoFiles: string[] = [];
    @property({ readonly: true })
    bundleName: string = '';

    private static _protobuf: YJProtobuf;

    update() {
        if (EDITOR) {
            if (this.check) {
                this.check = false;
                this.loadFiles();
            }
        }
    }

    onLoad() {
        if (EDITOR) return;
        this.loadAllProtoFiles();
    }

    public static get protobufInstance(): YJProtobuf {
        return this._protobuf;
    }

    private loadAllProtoFiles() {
        YJProtobufManager._protobuf = new YJProtobuf();
        YJProtobufManager._protobuf.loadProtoJson(this.bundleName, this.protoFiles);
    }

    private loadFiles() {
        this.protoFiles.length = 0;
        no.assetBundleManager.loadAssetInfosInEditorModeUnderFolder(this.root, 'cc.JsonAsset', infos => {
            console.log(infos);
            infos.forEach(info => {
                if (info.url.includes('.json'))
                    this.protoFiles[this.protoFiles.length] = info.url.replace(this.root + '/', '').replace('.json', '');
            });
        });
        this.bundleName = this.root.replace('db://assets/', '');

    }
}
