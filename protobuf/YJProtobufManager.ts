import { no } from "../no";
import { ccclass, Component, property, JsonAsset } from "../yj";
import { YJProtobuf } from "./YJProtobuf";

/**proto管理器 
 * 通过pbjs 将多个.proto文件合成一个.json文件
 * proto管理器将加载该.json文件
*/
@ccclass('YJProtobufManager')
export class YJProtobufManager extends Component {
    @property({ type: JsonAsset })
    public get protoJSON(): JsonAsset {
        return null;
    }

    public set protoJSON(v: JsonAsset) {
        no.getAssetUrlInEditorMode(v._uuid, url => {
            if (!url) return;
            this.filePath = url;
        });
    }
    @property({ readonly: true })
    filePath: string = '';

    private static _protobuf: YJProtobuf;


    onLoad() {
        // this.loadAllProtoFiles();
    }

    public static get protobufInstance(): YJProtobuf {
        return this._protobuf;
    }

    private loadAllProtoFiles() {
        const p = no.assetBundleManager.assetPath(this.filePath);
        YJProtobufManager._protobuf = new YJProtobuf();
        YJProtobufManager._protobuf.loadProtoJson(p.bundle, p.path);
    }
}
