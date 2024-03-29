
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

    constructor() {
        this['uuid'] = no.uuid();
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
        no.log('YJWebSocket initWebSocket');
        this.ws['_uuid'] = no.uuid();

        this.ws.onopen = (event) => {
            no.log(`websocket open:${this.url}`);
            this.isClosed = false;
        };
        this.ws.onmessage = (event) => {
            // no.log("response text msg: " + event.data);
            this._onMessage(event.data);
        };
        this.ws.onerror = (event) => {
            no.err(`websocket error:${this.url}`);
            this.isClosed = true;
            this.onClose();
        };
        this.ws.onclose = (event) => {
            no.err(`websocket close:${this.url}`);
            this.isClosed = true;
            this.onClose();
        };
    }

    private _onMessage(data: any) {
        if (data == null || data == '') return;
        if (data instanceof Blob) {
            data.arrayBuffer().then(v => {
                this.receivedData[this.receivedData.length] = this.onMessage(v);
            }).catch(e => { no.err('YJWebSocket _onMessage error'); });
        } else this.receivedData[this.receivedData.length] = this.onMessage(data);
    }

    public onMessage(v: any): any {
        return v;
    }

    public onClose() {

    }

    public connect() {
        if (this.ws?.readyState != WebSocket.OPEN)
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
            no.scheduleForever(() => {
                if (!this.isClosed) {
                    no.unschedule(this);
                    resolve(true);
                } else {
                    n++;
                    if (n >= 20) {
                        no.unschedule(this);
                        resolve(false);
                    }
                }
            }, .5, this);
        });
    }

    /**断开 */
    public close() {
        if (this.ws && this.ws.readyState == WebSocket.OPEN) {
            this.ws.onclose = () => { };
            this.ws.onerror = () => { };
            this.ws.close();
            this.ws = null;
        }
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
            this.ws?.send(v);
            return true; 
        }
        return false;
    }

    /**
     * 从服务器返回的数据中查找
     * @param handler 
     */
    public findReceiveData(handler: (data: any) => boolean) {
        if (this.isClosed || !this.receivedData?.length) return;
        for (let i = 0, n = this.receivedData.length; i < n; i++) {
            if (handler(this.receivedData[i])) {
                this.receivedData.splice(i, 1);
                break;
            }
        }
    }

    /**
     * 外部处理已返回的数据，并从队列中移除
     * @param handler 
     */
    public dealReceivedData(handler: (data: any) => void): void {
        if (this.isClosed || !this.receivedData?.length) return;
        for (let i = this.receivedData.length - 1; i >= 0; i--) {
            handler(this.receivedData[i]);
            this.receivedData.splice(i, 1);
        }
    }

    public clear(): void {
        this.receivedData.length = 0;
    }

    public isOpen(): boolean {
        return this.ws?.readyState == WebSocket.OPEN;
    }
}
