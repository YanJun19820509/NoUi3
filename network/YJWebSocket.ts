
import { ccclass, native, JSB, sys } from '../yj';
import { encode, EncryptType } from '../encrypt/encrypt';
import { no } from '../no';
import { YJSocketInterface } from './YJSocketInterface';

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
    protected ws: any;
    private url: string;
    private reIniting: boolean = false;
    private isClosed: boolean = false;
    private isWxWs: boolean = false;

    public static new(url: string): YJWebSocket {
        let a = new YJWebSocket();
        a.url = url;
        return a;
    }

    constructor() {
        this['uuid'] = no.uuid();
    }

    protected initWebSocket() {
        no.log('YJWebSocket initWebSocket');
        if (JSB && native.fileUtils) {
            let AdapterWebSocket: any = WebSocket;
            let realPath = "cacert.pem";
            let fileUtils = native.fileUtils;
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
            // Android 必须加入CA证书才能使用wss
            realPath = ca_cache_path;
            this.ws = new AdapterWebSocket(this.url, [], realPath);
            this._initWs();
        }
        else if (sys.platform == sys.Platform.WECHAT_GAME) {
            this._createWXws();
        }
        else {
            this.ws = new WebSocket(this.url);
            this._initWs();
        }
    }

    private _initWs() {
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
            no.err(`websocket error:${this.url}`, event);
            if (this.isClosed) return;
            this.isClosed = true;
            this.onClose();
        };
        this.ws.onclose = (event) => {
            no.err(`websocket close:${this.url}`, event);
            if (this.isClosed) return;
            this.isClosed = true;
            this.onClose();
        };
    }

    private _createWXws() {
        no.log('_createWXws');
        const wx = window['wx'];
        this.ws = wx.connectSocket({
            url: this.url
        });

        this.ws['_uuid'] = no.uuid();

        this.ws.onOpen((res) => {
            no.log(`websocket open:${this.url}`);
            this.isClosed = false;
        });

        this.ws.onMessage((res) => {
            this._onMessage(res.data);
        });

        this.ws.onError((res) => {
            no.err(`websocket error:${this.url}`, res);
            if (this.isClosed) return;
            this.isClosed = true;
            this.onClose();
        });

        this.ws.onClose((res) => {
            no.err(`websocket close:${this.url}`, res);
            if (this.isClosed) return;
            this.isClosed = true;
            this.onClose();
        });
        this.isWxWs = true;
    }

    private _onMessage(data: any) {
        if (data == null || data == '') return;
        if (typeof data == 'string') this.onMessage(data);
        else if (data instanceof ArrayBuffer) this.onMessage(data);
        else if (data instanceof Blob) {
            data.arrayBuffer().then(v => {
                this.onMessage(v);
            }).catch(e => { no.err('YJWebSocket _onMessage error', e); });
        } else this.onMessage(data);
    }

    private sendData(v: any) {
        if (this.isWxWs) {
            if (v instanceof Uint8Array)
                this.ws?.send({ data: no.Uint8Array2ArrayBuffer(v) });
            else
                this.ws?.send({ data: v });
        } else {
            this.ws?.send(v);
        }
    }

    public onMessage(v: any) {

    }

    public onClose() {

    }

    public async connect() {
        if (this.ws?.readyState != WebSocket.OPEN)
            this.initWebSocket();
        await no.waitFor(() => { return !this.isClosed; })
    }

    private reInit() {
        if (this.reIniting) return;
        if (this.url != null) {
            this.reIniting = true;
            this.connect();
        }
    }

    public async isOk(): Promise<boolean> {
        if (this.ws?.readyState == WebSocket.OPEN) return true;
        return new Promise<boolean>(resolve => {
            let n = 0;
            no.scheduleForever(() => {
                if (this.ws?.readyState == WebSocket.OPEN) {
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
            this.ws.onClose = () => { };
            this.ws.onError = () => { };
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
            let v: string | ArrayBuffer | Uint8Array = encode(data, encryptType);
            this.sendData(v);
            return true;
        }
        return false;
    }

    public isOpen(): boolean {
        return this.ws?.readyState == WebSocket.OPEN;
    }
}
