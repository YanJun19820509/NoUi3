
import { _decorator, Component, Node } from 'cc';
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

    sendDataToServer(code: string, args?: any): void {
        this.httpRequest('POST', this.url + '/' + code, args);
    }

    getDataFromServer(code: string, args?: any): Promise<any | null> {
        return new Promise<any>(resolve => {
            this.httpRequest('POST', this.url + '/' + code, args, v => {
                resolve(v);
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
                var response = xhr.responseText;
                let a = JSON.parse(response);
                no.log('response', response);
                if (a.code == 0) {
                    okCall?.(a.data);
                } else {
                    no.err(a.msg);
                    errorCall?.(a);
                }
            }
        };

        xhr.onerror = function () {
            no.err('无法连接服务器：', url);
            errorCall?.('no_server');
        };

        xhr.ontimeout = function(){
            no.err('连接超时：', url);
            errorCall?.('timeout');
        };

        if (data)
            xhr.send(JSON.stringify(data));
        else xhr.send();
    }
}
