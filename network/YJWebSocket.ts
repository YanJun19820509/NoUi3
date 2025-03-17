
import { ccclass, native, JSB, sys } from '../yj';
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
/**
 * WebSocket 连接实现类
 * @implements YJSocketInterface
 * @example
 * // 创建WebSocket连接
 * const ws = YJWebSocket.new('wss://echo.websocket.org');
 * ws.onMessage = (data) => console.log('收到消息:', data);
 * ws.connect();
 * 
 * // 发送消息
 * ws.sendDataToServer(JSON.stringify({type: 'ping'}));
 */
export class YJWebSocket implements YJSocketInterface {
    protected ws: any; // WebSocket实例
    private url: string; // 服务器地址
    private reIniting: boolean = false; // 是否正在重新初始化
    private isClosed: boolean = false; // 连接是否已关闭
    private isConnected: boolean = false; // 是否已成功连接
    private isWxWs: boolean = false; // 是否是微信平台WebSocket

    /**
     * 创建WebSocket实例的工厂方法
     * @param url WebSocket服务器地址
     * @returns 新的YJWebSocket实例
     * @example
     * const ws = YJWebSocket.new('wss://game-server.example.com');
     */
    public static new(url: string): YJWebSocket {
        let a = new YJWebSocket();
        a.url = url;
        return a;
    }

    constructor() {
        this['uuid'] = no.uuid(); // 生成唯一标识
    }

    /**
     * 初始化WebSocket连接
     * @description 根据运行平台选择不同的初始化方式：
     * - 原生平台使用带CA证书的适配器
     * - 微信小游戏使用wx.connectSocket
     * - 其他平台使用标准WebSocket
     */
    protected initWebSocket() {
        no.log('YJWebSocket initWebSocket');
        if (JSB && native.fileUtils) { // 原生平台处理
            let AdapterWebSocket: any = WebSocket;
            let realPath = "cacert.pem";
            let fileUtils = native.fileUtils;
            
            // 兼容不同引擎版本的证书路径
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
            this._initWs();
        }
        else if (sys.platform == sys.Platform.WECHAT_GAME) { // 微信小游戏平台
            this._createWXws();
        }
        else { // 标准WebSocket实现
            this.ws = new WebSocket(this.url);
            this._initWs();
        }
    }

    /**
     * 初始化WebSocket事件监听
     * @private
     */
    private _initWs() {
        this.ws['_uuid'] = no.uuid();
        this.isClosed = false;
        this.isConnected = false;

        // 连接建立事件
        this.ws.onopen = (event) => {
            no.log(`websocket open:${this.url}`);
            this.isClosed = false;
            this.isConnected = true;
            this.onConnect?.();
        };

        // 消息接收事件
        this.ws.onmessage = (event) => {
            this._onMessage(event.data);
        };

        // 错误处理事件
        this.ws.onerror = (event) => {
            no.err(`websocket error:${this.url}`, this.isClosed, JSON.stringify(event));
            if (this.isClosed) return;
            this.isClosed = true;
            this.onClose();
        };

        // 连接关闭事件
        this.ws.onclose = (event) => {
            no.err(`websocket close:${this.url}`, this.isClosed, JSON.stringify(event));
            if (this.isClosed) return;
            this.isClosed = true;
            this.onClose();
        };
    }

    /**
     * 创建微信平台WebSocket连接
     * @private
     */
    private _createWXws() {
        no.log('_createWXws');
        const wx = window['wx'];
        this.ws = wx.connectSocket({
            url: this.url
        });

        this.ws['_uuid'] = no.uuid();
        this.isClosed = false;
        this.isConnected = false;

        this.ws.onOpen((res) => {
            no.log(`websocket open:${this.url}`);
            this.isClosed = false;
            this.isConnected = true;
            this.onConnect?.();
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

    /**
     * 处理接收到的消息
     * @private
     * @param data 接收到的原始数据
     * @description 支持处理多种数据格式：
     * - 字符串
     * - ArrayBuffer
     * - Blob（自动转换为ArrayBuffer）
     */
    private _onMessage(data: any) {
        if (!data) return;
        if (typeof data == 'string') this.onMessage(data);
        else if (data instanceof ArrayBuffer) this.onMessage(data);
        else if (data instanceof Blob) {
            data.arrayBuffer().then(v => {
                this.onMessage(v);
            }).catch(e => { no.err('YJWebSocket _onMessage error', e); });
        } else this.onMessage(data);
    }

    /**
     * 发送数据到服务器
     * @private
     * @param v 要发送的数据
     * @description 处理微信平台的特殊发送格式
     */
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

    /**
     * 消息接收回调（需重写实现）
     * @param v 接收到的消息内容
     * @example
     * ws.onMessage = (data) => {
     *   console.log('收到服务器消息:', data);
     * };
     */
    public onMessage(v: any) {}

    /**
     * 连接关闭回调（需重写实现）
     * @example
     * ws.onClose = () => {
     *   console.log('连接已断开');
     * };
     */
    public onClose() {}

    /**
     * 建立WebSocket连接
     * @async
     * @description 如果当前未连接或连接已关闭，则重新初始化连接
     */
    public async connect() {
        if (this.ws?.readyState != WebSocket.OPEN)
            this.initWebSocket();
    }

    /**
     * 重新初始化连接
     * @private
     */
    private reInit() {
        if (this.reIniting) return;
        if (this.url != null) {
            this.reIniting = true;
            this.connect();
        }
    }

    /**
     * 主动关闭连接
     * @example
     * ws.close(); // 主动断开WebSocket连接
     */
    public close() {
        if (this.ws && this.ws.readyState == WebSocket.OPEN) {
            // 清空事件监听防止重复触发
            this.ws.onclose = () => { };
            this.ws.onerror = () => { };
            this.ws.onClose = () => { };
            this.ws.onError = () => { };
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * 发送数据到服务器
     * @param data 要发送的数据（支持字符串/ArrayBuffer/Uint8Array）
     * @returns 是否发送成功
     * @example
     * // 发送文本消息
     * ws.sendDataToServer('ping');
     * 
     * // 发送二进制数据
     * const buffer = new Uint8Array([1,2,3]);
     * ws.sendDataToServer(buffer);
     */
    public sendDataToServer(data: any) {
        if (this.isConnected) {
            this.sendData(data);
            return true;
        }
        return false;
    }

    /**
     * 检查连接是否处于打开状态
     * @returns 是否已建立连接
     */
    public isOpen(): boolean {
        return this.ws?.readyState == WebSocket.OPEN;
    }

    /**
     * 连接成功回调（需重写实现）
     * @example
     * ws.onConnect = () => {
     *   console.log('成功连接到服务器');
     * };
     */
    public onConnect() {}
}
