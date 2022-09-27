
import { _decorator } from 'cc';
import { decode, encode, EncryptType } from '../encrypt/encrypt';
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
    private receivedData: any[] = [];

    public static new(url: string): YJWebSocket {
        let a = new YJWebSocket();
        a.initWebSocket(url);
        return a;
    }

    private initWebSocket(url: string) {
        this.url = url;
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
        if (data instanceof Blob) {
            data.arrayBuffer().then(v => {
                this.receivedData[this.receivedData.length] = v;
            });
        } else this.receivedData[this.receivedData.length] = data;
    }

    private reInit() {
        if (this.reIniting) return;
        if (this.url != null) {
            this.reIniting = true;
            // this.ws?.close();
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
    public async sendDataToServer(encryptType: EncryptType, data: any) {
        if (await this.isOk()) {
            let v: string | ArrayBuffer = encode(data, encryptType);
            this.ws.send(v);
        }
    }

    /**
     * 向服务器请求数据
     * @param code 指令
     * @param args 参数
     */
    public async getDataFromServer(encryptType: EncryptType, data: any): Promise<any> {
        if (await this.isOk()) {
            let v: string | ArrayBufferLike = encode(data, encryptType);
            if (!v) return Promise.resolve(null);
            this.ws.send(v);
            return new Promise<any>(resolve => {
                let a = setInterval(() => {
                    let d = this.getReceiveData(encryptType);
                    if (d != null) {
                        clearInterval(a);
                        resolve(d);
                    }
                }, 50 / 3);
            });
        } else return Promise.resolve(null);
    }

    private getReceiveData(type: EncryptType): any {
        for (let i = 0, n = this.receivedData.length; i < n; i++) {
            try {
                let s = decode(this.receivedData[i], type);
                if (!s) return null;
                this.receivedData.splice(i, 1);
                return s;
            } catch (e) { }
        }
        return null;
    }
}
