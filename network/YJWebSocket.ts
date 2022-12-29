
import { _decorator } from 'cc';
import { encode, EncryptType } from '../encrypt/encrypt';
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
    protected ws: WebSocket;
    private url: string;
    private reIniting: boolean = false;
    protected receivedData: any[] = [];

    public static new(url: string): YJWebSocket {
        let a = new YJWebSocket();
        a.initWebSocket(url);
        return a;
    }

    protected initWebSocket(url: string) {
        this.url = url;
        this.ws = new WebSocket(url);

        this.ws.onopen = (event) => {
            no.log(`websocket open:${this.url}`);
        };
        this.ws.onmessage = (event) => {
            no.log("response text msg: " + event.data);
            this.onMessage(event.data);
        };
        this.ws.onerror = (event) => {
            no.log('websocket error', event);
            this.onClose();
        };
        this.ws.onclose = (event) => {
            no.log(`websocket close:${this.url}`);
            this.onClose();
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

    public onClose() {
        this.reIniting = false;
        this.reInit();
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

    public async isOk(): Promise<boolean> {
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
        this.ws.close();
        this.ws = null;
    }

    /**
     * 向服务器发送数据
     * @param encryptType 加密方式
     * @param data 
     */
    public async sendDataToServer(encryptType: EncryptType, data: any) {
        if (await this.isOk()) {
            let v: string | ArrayBuffer = encode(data, encryptType);
            this.ws.send(v);
        }
    }

    /**
     * 从服务器返回的数据中查找
     * @param handler 
     */
    public findReceiveData(handler: (data: any) => boolean) {
        for (let i = 0, n = this.receivedData.length; i < n; i++) {
            if (handler(this.receivedData[i])) {
                this.receivedData.splice(i, 1);
                break;
            }
        }
    }

    public clear(): void {
        this.receivedData.length = 0;
        this.ws?.close();
        this.ws = null;
    }
}
