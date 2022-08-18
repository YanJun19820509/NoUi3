
import { _decorator } from 'cc';
import { no } from '../no';
import { YJSocketInterface } from './YJSocketInterface';
const { ccclass } = _decorator;

/**
 * Predefined variables
 * Name = YJWebSocket
 * DateTime = Thu Aug 18 2022 11:18:20 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJWebSocket.ts
 * FileBasenameNoExtension = YJWebSocket
 * URL = db://assets/NoUi3/network/YJWebSocket.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJWebSocket')
export class YJWebSocket implements YJSocketInterface {
    private ws: WebSocket;
    private url: string;
    private reIniting: boolean = false;
    private receivedData: any = {};

    public static new(url: string): YJWebSocket {
        let a = new YJWebSocket();
        a.initWebSocket(url);
        return a;
    }

    private initWebSocket(url: string) {
        this.ws = new WebSocket(url);

        this.ws.onopen = (event) => {
            no.log(`websocket open:${this.url}`);
            this.reIniting = false;
        };
        this.ws.onmessage = (event) => {
            no.log("response text msg: " + event.data);
            this.reIniting = false;
            this.onMessage(event.data);
        };
        this.ws.onerror = (event) => {
            no.log('websocket error', event);
            this.reIniting = false;
            this.reInit();
        };
        this.ws.onclose = (event) => {
            no.log(`websocket close:${this.url}`);
            this.reIniting = false;
        };
    }

    private onMessage(data: any) {
        if (data == null || data == '') return;
        let a = window.atob(data);
        let b = JSON.parse(a);
        this.receivedData[b.c] = b.v;
    }

    private reInit() {
        if (this.reIniting) return;
        if (this.url != null) {
            this.reIniting = true;
            this.ws?.close();
            this.ws = null;
            this.initWebSocket(this.url);
        }
    }

    private async isOk(): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            if (this.ws?.readyState !== WebSocket.OPEN) {
                if (this.url != null) {
                    this.reInit();
                    let a = setInterval(() => {
                        if (this.ws?.readyState === WebSocket.OPEN) {
                            clearInterval(a);
                            resolve(true);
                        }
                    }, 500);
                } else resolve(false);
            } else resolve(true);
        });
    }

    /**断开 */
    public close() {
        this.ws.close(1);
    }

    /**
     * 向服务器发送数据
     * @param code 指令
     * @param args 参数
     */
    public async sendDataToServer(code: string, args?: any) {
        if (await this.isOk()) {
            let v = window.btoa(JSON.stringify({ c: code, p: args }));
            this.ws.send(v);
        }
    }

    /**
     * 向服务器请求数据
     * @param code 指令
     * @param args 参数
     */
    public async getDataFromServer(code: string, args?: any): Promise<any> {
        if (await this.isOk()) {
            let v = window.btoa(JSON.stringify({ c: code, p: args }));
            this.ws.send(v);
            return new Promise<any>(resolve => {
                let a = setInterval(() => {
                    let d = this.receivedData[code];
                    if (d != null) {
                        clearInterval(a);
                        resolve(d);
                        this.receivedData[code] = null;
                    }
                }, 50 / 3);
            });
        } else return Promise.resolve(null);
    }

}
