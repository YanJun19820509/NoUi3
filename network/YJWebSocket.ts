
import { _decorator } from 'cc';
import { JSB } from 'cc/env';
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
    private isClosed: boolean = true;

    public static new(url: string): YJWebSocket {
        let a = new YJWebSocket();
        a.url = url;
        return a;
    }

    protected initWebSocket() {
        if (JSB && jsb.fileUtils) {
            let AdapterWebSocket: any = WebSocket;
            let realPath = "cacert.pem";
            let fileUtils = jsb.fileUtils;
            // 兼容3.5 和2.x引擎
            let ca_cache_path = fileUtils.getWritablePath() + "cacert.pem";
            if (!fileUtils.isFileExist(ca_cache_path)) {
                if (!fileUtils.isFileExist(realPath)) {
                    realPath = "PublicRes/" + realPath;
                }
                let content = fileUtils.getStringFromFile(realPath);
                if (content) {
                    fileUtils.writeStringToFile(content, ca_cache_path);
                }
            }
            realPath = ca_cache_path;
            this.ws = new AdapterWebSocket(this.url, [], realPath);
        } else {
            this.ws = new WebSocket(this.url);
        }
        // Android 必须加入CA证书才能使用wss
        no.log('initWebSocket');
        this.ws['_uuid'] = no.uuid();

        this.ws.onopen = (event) => {
            no.log(`websocket open:${this.url}`);
            this.isClosed = false;
        };
        this.ws.onmessage = (event) => {
            no.log("response text msg: " + event.data);
            this.onMessage(event.data);
        };
        this.ws.onerror = (event) => {
            no.log('websocket error', event);
            this.isClosed = true;
            this.onClose();
        };
        this.ws.onclose = (event) => {
            no.log(`websocket close:${this.url}`);
            this.isClosed = true;
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

    }

    public connect() {
        this.clear();
        this.initWebSocket();
    }

    private reInit() {
        if (this.reIniting) return;
        if (this.url != null) {
            this.reIniting = true;
            this.connect();
        }
    }

    public async isOk(): Promise<boolean> {
        if (!this.isClosed) return true;
        return new Promise<boolean>(resolve => {
            let n = 0;
            let a = setInterval(() => {
                if (!this.isClosed) {
                    clearInterval(a);
                    resolve(true);
                } else {
                    n++;
                    if (n >= 20) {
                        clearInterval(a);
                        resolve(false);
                    }
                }
            }, 500);
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
            // no.log('sendDataToServer', this.ws['_uuid']);
            this.ws.send(v);
            return true;
        }
        return false;
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
