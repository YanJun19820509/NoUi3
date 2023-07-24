import { CCString } from "cc";
import { no } from "../no";
import { ccclass, Component, EDITOR, executeInEditMode, property, TextAsset } from "../yj";
import { YJProtobuf } from "./YJProtobuf";

/**proto管理器 */
@ccclass('YJProtobufManager')
@executeInEditMode()
export class YJProtobufManager extends Component {
    @property({ type: CCString })
    root: string = '';
    @property
    check: boolean = false;
    @property({ type: CCString, readonly: true })
    protoFiles: string[] = [];
    @property({ type: CCString, readonly: true })
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
        YJProtobufManager._protobuf.loadProto(this.bundleName, this.protoFiles);
    }

    private loadFiles() {
        this.protoFiles.length = 0;
        no.assetBundleManager.loadAssetInfosInEditorModeUnderFolder(this.root, 'cc.TextAsset', infos => {
            infos.forEach(info => {
                if (info.url.includes('.proto'))
                    this.protoFiles[this.protoFiles.length] = info.url.replace(this.root + '/', '').replace('.proto', '');
            });
        });
        this.bundleName = this.root.replace('db://assets/', '');

    }
}
