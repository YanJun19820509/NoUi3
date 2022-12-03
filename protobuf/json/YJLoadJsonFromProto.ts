
import { _decorator, Component, Node, BufferAsset } from 'cc';
import { no } from '../../no';
import { YJProtobuf } from '../YJProtobuf';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJLoadJsonFromProto
 * DateTime = Sat Nov 26 2022 16:25:18 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJLoadJsonFromProto.ts
 * FileBasenameNoExtension = YJLoadJsonFromProto
 * URL = db://assets/Script/NoUi3/protobuf/json/YJLoadJsonFromProto.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJLoadJsonFromProto')
export class YJLoadJsonFromProto {
    /**
     * 加载 proto 文件和 bin 文件，解析出 json
     * @param protoPath proto 文件路径
     * @param dataPath bin 文件路径
     * @param jsonKey
     * @returns 
     */
    public static async loadProtoAndData(protoPath: string, dataPath: string, jsonKey: string): Promise<any> {
        const proto = YJProtobuf.new();
        await proto.loadProto(protoPath);
        return new Promise<any>(resolve => {
            no.assetBundleManager.loadBuffer(dataPath, (asset: BufferAsset) => {
                let data = proto.decode(jsonKey, new Uint8Array(asset.buffer()));
                resolve(data);
            });
        });
    }
}
