
import { _decorator, Component, Node } from 'cc';
import { decode, encode, EncryptType } from '../encrypt/encrypt';
import { no } from '../no';
import { YJSocketInterface } from './YJSocketInterface';
const { ccclass, property } = _decorator;

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
                try {
                    resolve(no.parse2Json(a));
                } catch (e) {
                    resolve(a);
                    no.err('no.parse2Json', 'YJHttpRequest.getDataFromServer', a);
                }
            }, v => {
                resolve(null);
            });
        });
    }

    getJsonFromServer(code: string): Promise<any | null> {
        return new Promise<any>(resolve => {
            this.httpRequest('GET', this.url + '/' + code, null, 'application/json', v => {
                if (v instanceof Object) {
                    resolve(v);
                } else {
                    try {
                        resolve(no.parse2Json(v));
                    } catch (e) {
                        no.err('no.parse2Json', 'YJHttpRequest.getJsonFromServer', v);
                    }
                }
            }, v => {
                resolve(null);
            });
        });
    }

    static downloadFile(url: string, onProgress?: (loaded: number, total: number) => void): Promise<Blob | null> {
        return new Promise<any>(resolve => {
            no.log('开始下载', url);
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.addEventListener('progress', ev => {
                if (ev.lengthComputable) {
                    onProgress?.(ev.loaded, ev.total);
                }
            });
            xhr.responseType = 'arraybuffer';
            xhr.onload = function () {
                if (this.readyState == 4 && this.status == 200) {
                    no.log('downloadFile complete')
                    resolve(xhr.response);
                } else {
                    no.log('downloadFile fail')
                    resolve(null);
                }
            };
            xhr.send();
        });
    }

    setHeader?(name: string, value: string): void {
        this.headers.push({ name: name, value: value });
    }

    private httpRequest(type: string, url: string, data: any, contentType = 'application/json', okCall?: (v: any) => void, errorCall?: (v: any) => void): void {
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
}
