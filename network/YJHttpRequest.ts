
import { ccclass, native, JSB, sys } from '../yj';
import { decode, encode, EncryptType } from '../encrypt/encrypt';
import { no } from '../no';
import { YJSocketInterface } from './YJSocketInterface';

/**
 * Predefined variables
 * Name = YJHttpRequest
 * DateTime = Mon Aug 29 2022 14:33:53 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJHttpRequest.ts
 * FileBasenameNoExtension = YJHttpRequest
 * URL = db://assets/NoUi3/network/YJHttpRequest.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJHttpRequest')
export class YJHttpRequest implements YJSocketInterface {
    private url: string;
    private headers: { name: string, value: string }[] = [];

    constructor(url: string) {
        this.url = url;
    }

    sendDataToServer(encryptType: EncryptType, code: string, args?: any): void {
        this.httpRequest('POST', this.url + '/' + code, args ? encode(args, encryptType) : null);
    }

    getDataFromServer(encryptType: EncryptType, code: string, args?: any, contentType?: string): Promise<any | null> {
        return new Promise<any>(resolve => {
            this.httpRequest('POST', this.url + '/' + code, args ? encode(args, encryptType) : null, contentType, v => {
                let a = decode(v, encryptType);
                no.log('getDataFromServer', a);
                resolve(this.parseData(a));
            }, v => {
                no.err('getDataFromServer', v);
                resolve(null);
            });
        });
    }

    getJsonFromServer(code: string): Promise<any | null> {
        return new Promise<any>(resolve => {
            this.httpRequest('GET', this.url + '/' + code, null, 'application/json', v => {
                resolve(this.parseData(v));
            }, v => {
                resolve(null);
            });
        });
    }

    private parseData(v: any) {
        if (v instanceof Object) {
            return v;
        } else {
            try {
                return no.parse2Json(v)
            } catch (e) {
                no.err('no.parse2Json1', 'YJHttpRequest.getJsonFromServer', v);
                try {
                    return no.parse2Json(`'${v}'`);
                } catch (ee) {
                    no.err('no.parse2Json2', 'YJHttpRequest.getJsonFromServer', v);
                    return v;
                }
            }
        }
    }

    static downloadFile(url: string, onProgress: (loaded: number, total: number) => void, onComplete: (storageFilePath?: string, fileData?: any) => void, responseType?: XMLHttpRequestResponseType) {
        no.log('开始下载 downloader', url);
        if (JSB) {
            const fileUtils = native.fileUtils, fileName = no.getFileName(url);
            const storagePath = no.pathjoin(fileUtils.getWritablePath(), 'yj_download', fileName);
            no.log('downloadFile storagepath', storagePath);
            const downloader = new native.Downloader();
            downloader.setOnTaskProgress((task, received, totalReceived, totalExpected) => {
                // no.log('downloadFile received', `${received}`, `${totalReceived}`, `${totalExpected}`, task.identifier);
                if (task.identifier == fileName) {
                    onProgress(Number(totalReceived), Number(totalExpected));
                }
            });
            downloader.setOnFileTaskSuccess(task => {
                if (task.identifier == fileName) {

                    onComplete(storagePath, fileUtils['getDataFromFile'](storagePath));
                    window['_downloader'] = null;
                }
            });
            downloader.setOnTaskError((task, errCode, errCodeInterval, errStr) => {
                if (task.identifier == fileName) {
                    // no.log('downloadFile error', errStr, errCode, errCodeInterval);
                    // onComplete();
                    downloader.createDownloadFileTask(url, storagePath, fileName);
                }
            });
            downloader.createDownloadFileTask(url, storagePath, fileName);
            window['_downloader'] = downloader;
        } else {
            // assetManager.downloader.downloadFile(url, { xhrResponseType: responseType || 'arraybuffer' }, onProgress, onComplete);
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = responseType || 'arraybuffer';
            //在原生层onprogress并未实现
            xhr.onprogress = function (ev) {
                no.log('downloadFile', ev.lengthComputable);
                if (ev.lengthComputable) {
                    onProgress(Number(ev.loaded), Number(ev.total));
                }
            };
            xhr.onload = function (ev) {
                if (this.readyState == 4 && this.status == 200) {
                    no.log('downloadFile complete')
                    onComplete(null, this.response);
                } else {
                    no.log('downloadFile fail')
                    onComplete();
                }
            };
            xhr.send();
        }
    }

    setHeader?(name: string, value: string): void {
        this.headers.push({ name: name, value: value });
    }

    private httpRequest(type: string, url: string, data: any, contentType = 'application/json', okCall?: (v: any) => void, errorCall?: (v: any) => void): void {
        // if (this.wxRequest(type, url, data, contentType, okCall, errorCall)) return;
        let xhr = new XMLHttpRequest();
        xhr.open(type, url, true);
        if (type == 'POST') {
            xhr.setRequestHeader('Accept', contentType);
            xhr.setRequestHeader('Content-Type', contentType);
        }

        if (this.headers.length > 0) {
            this.headers.forEach(header => {
                xhr.setRequestHeader(header.name, header.value);
            });
        }

        xhr.onreadystatechange = function () {
            no.log('http ready state change:', xhr.readyState);
        };

        xhr.onload = function () {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                no.log('http data onload', xhr.response);
                okCall?.(xhr.response);
            }
        };

        xhr.onerror = function () {
            no.err('无法连接服务器：', url);
            errorCall?.('no_server');
        };

        xhr.ontimeout = function () {
            no.err('连接超时：', url);
            errorCall?.('timeout');
        };

        if (data)
            xhr.send(data);
        else xhr.send();
    }

    private wxRequest(type: string, url: string, data: any, contentType: string, okCall: (v: any) => void, errorCall: (v: any) => void) {
        if (sys.platform != sys.Platform.WECHAT_GAME) return false;
        no.log('wxRequest')
        let h = {
            'content-type': contentType
        };
        if (this.headers.length > 0) {
            this.headers.forEach(header => {
                h[header.name] = header.value;
            });
        }
        window['wx'].request({
            url: url,
            data: data,
            method: type,
            header: h,
            success(res) {
                if (res.data instanceof Object) {
                    okCall?.(res.data);
                } else {
                    okCall?.(`'${res.data}'`);
                }
            },
            fail(err) {
                no.err('无法连接服务器：', url, err);
                errorCall?.('no_server');
            }
        });
        return true;
    }
}
