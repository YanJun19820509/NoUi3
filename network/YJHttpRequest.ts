
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

    constructor(url: string) {
        this.url = url;
    }

    sendDataToServer(encryptType: EncryptType, code: string, args?: any): void {
        this.httpRequest('POST', this.url + '/' + code, args ? encode(args, encryptType) : null);
    }

    getDataFromServer(encryptType: EncryptType, code: string, args?: any): Promise<any | null> {
        return new Promise<any>(resolve => {
            this.httpRequest('POST', this.url + '/' + code, args ? encode(args, encryptType) : null, v => {
                let a = decode(v, encryptType);
                try {
                    resolve(JSON.parse(a));
                } catch (e) {
                    no.err('JSON.parse', 'YJHttpRequest.getDataFromServer', a);
                }
            }, v => {
                resolve(null);
            });
        });
    }

    private httpRequest(type: string, url: string, data: any, okCall?: (v: any) => void, errorCall?: (v: any) => void): void {
        let xhr = new XMLHttpRequest();
        xhr.open(type, url, true);
        if (type == 'POST') {
            xhr.setRequestHeader('Content-Type', 'application/json');
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
