
import { _decorator, Component, Node, assetManager, BufferAsset } from 'cc';
const { ccclass, property } = _decorator;
import { no } from '../../NoUi3/no';
import pako from './pako.min.js';

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
    /**
     * 解压压缩文件
     * @param url 远程或本地文件路径
     * @param cb 
     * @param onErr 
     */
    public static unzip(url: string, cb?: (relativePath: string, isDir: boolean, totalFilesNum?: number, data?: Uint8Array) => void, onErr?: () => void) {
        no.log('unzip path', url);
        if (url.indexOf('http://') > -1 || url.indexOf('https://') > -1)
            assetManager.loadRemote(url, (err, file: BufferAsset) => {
                if (err) {
                    no.log(err.message);
                    onErr && onErr();
                } else {
                    this.unzipBuffer(file.buffer(), cb, onErr);
                }
            });
        else this._unzipFile(url, cb, onErr);
    }

    /**
     * 解压压缩文件
     * @param buffer 压缩文件内容
     * @param cb 
     * @param onErr 
     */
    public static unzipBuffer(buffer: ArrayBuffer | Uint8Array | Blob, cb?: (relativePath: string, isDir: boolean, totalFilesNum?: number, data?: Uint8Array) => void, onErr?: () => void) {
        no.log('unzipBuffer');
        let jszip = new window['JSZip']();
        jszip.loadAsync(buffer)
            .then(zip => {
                this._unzip(zip, cb);
            }, (e) => {
                no.log(e.stack);
                onErr && onErr();
            });
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

    /**压缩数据 */
    public static compress(data: string): Uint8Array {
        if (!pako) return no.string2Bytes(data);
        return pako.gzip(data);
    }

    /**解压数据 */
    public static decompress(buffer: Uint8Array): string {
        if (!pako) return no.bytes2String(buffer);
        return pako.ungzip(buffer, { to: 'string' });
    }
}
