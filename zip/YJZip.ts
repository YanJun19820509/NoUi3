
import { _decorator, Component, Node, assetManager, BufferAsset } from 'cc';
const { ccclass, property } = _decorator;
import { no } from '../../NoUi3/no';

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
    public static unzip(url: string, cb?: (relativePath: string, isDir: boolean, totalFilesNum?: number, data?: Uint8Array) => void, onErr?: () => void) {
        if (url.indexOf('http://') > -1 || url.indexOf('https://') > -1)
            assetManager.loadRemote(url, (err, file: BufferAsset) => {
                if (err) {
                    no.log(err.message);
                    onErr && onErr();
                } else {
                    this._unzipBuffer(file.buffer(), cb, onErr);

                }
            });
        else this._unzipFile(url, cb, onErr);
    }

    private static _unzipFile(path: string, cb?: (relativePath: string, isDir: boolean, totalFilesNum?: number, data?: Uint8Array) => void, onErr?: () => void) {
        no.log('_unzipFile');
        let jszip = new window['JSZip']();
        jszip.loadAsync(path)
            .then(zip => {
                this._unzip(zip, cb);
            }, (e) => {
                no.log(e.stack);
                onErr && onErr();
            });
    }

    private static _unzipBuffer(buffer: ArrayBuffer, cb?: (relativePath: string, isDir: boolean, totalFilesNum?: number, data?: Uint8Array) => void, onErr?: () => void) {
        no.log('_unzipBuffer');
        let jszip = new window['JSZip']();
        jszip.loadAsync(buffer)
            .then(zip => {
                this._unzip(zip, cb);
            }, (e) => {
                no.log(e.stack);
                onErr && onErr();
            });
    }

    private static _unzip(zip: any, cb?: (relativePath: string, isDir: boolean, totalFilesNum?: number, data?: Uint8Array) => void) {
        let total = 0;
        zip.forEach((relativePath, data) => {
            if (!data.dir) total++;
            else cb && cb(relativePath, data.dir);
        });
        zip.forEach((relativePath, data) => {
            if (cb) {
                if (!data.dir) {
                    zip.file(data.name).async('uint8array').then(v => {
                        cb(relativePath, data.dir, total, v);
                    });
                }
            }
        });
    }
}
