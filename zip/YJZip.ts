
import { _decorator, Component, Node, assetManager, BufferAsset } from 'cc';
const { ccclass, property } = _decorator;
import { no } from '../../NoUi3/no';
import * as JSZip from './jszip.min.js';

/**
 * Predefined variables
 * Name = YJZip
 * DateTime = Thu Sep 01 2022 19:14:58 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJZip.ts
 * FileBasenameNoExtension = YJZip
 * URL = db://assets/NoUi3/zip/YJZip.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJZip')
export class YJZip {
    public static unzip(url: string, cb: (relativePath: string, isDir: boolean, data?: Uint8Array) => void) {
        assetManager.loadRemote(url, (err, file: BufferAsset) => {
            if (err) no.log(err);
            else {
                this.unZipFile(file.buffer(), cb);
            }
        });
    }

    private static unZipFile(file: ArrayBuffer | null, cb: (relativePath: string, isDir: boolean, data?: Uint8Array) => void) {
        let jszip = JSZip.default();
        jszip.loadAsync(file)
            .then(function (zip) {
                zip.forEach((relativePath, data) => {
                    cb && cb(relativePath, data.dir, !data.dir ? data._data.compressedContent: null);
                    // let path = `${dest}/${relativePath}`;
                    // if (data.dir) {
                    //     if (!jsb.fileUtils.isDirectoryExist(path)) jsb.fileUtils.createDirectory(path);
                    // } else {
                    //     jsb.fileUtils.writeValueVectorToFile(, path);
                    // }
                });
            }, function (e) {
                console.log(e);
            });
    }
}
