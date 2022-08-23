
import { _decorator } from 'cc';
import { DEBUG } from 'cc/env';
// import * as socket from './socket.io.msgpack.min.js';
import * as socket from './socket.io.min.js';
import { no } from '../../no';
import { YJSocketInterface } from '../YJSocketInterface';
const { ccclass } = _decorator;

/**
 * Predefined variables
 * Name = YJSocketIO
 * DateTime = Thu Aug 18 2022 14:58:12 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSocketIO.ts
 * FileBasenameNoExtension = YJSocketIO
 * URL = db://assets/NoUi3/network/socketio/YJSocketIO.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

/**
 * 注意！！！
 * 使用socket.io.msgpack.min.js，需要在服务器opt 中加入默认 parser，parser: require("socket.io-msgpack-parser")，
 * 否则会出现 transport close
 * 使用socket.io.min.js则不需要
 * android中client不能使用socket.io.msgpack.min.js，否则报Unable to parse TLS packet header，所以在原生环境下只能用socket.io.min.js
 * 在android下也不能用wss，且需要在AndroidManifest.xml文件中在Application标签下添加android:usesCleartextTraffic="true"
 * 
 * 查看日志：localStorage.debug = '*';
 */

@ccclass('YJSocketIO')
export class YJSocketIO implements YJSocketInterface {

    private ws: any;
    private url: string;
    private receivedData: any = {};

    public static new(url: string, options?: any): YJSocketIO {
        let a = new YJSocketIO();
        a.initWebSocket(url, options);
        return a;
    }

    private initWebSocket(url: string, options: any) {
        this.url = url;
        this.ws = socket.default.io(url, options);

        this.ws.on('connect', () => {
            no.log(`socketio connect:${this.url}`);
        });

        this.ws.on('disconnect', (reason: string) => {
            no.log(`socketio disconnect:${reason}`);
            if (reason === "io server disconnect") {
                // the disconnection was initiated by the server, you need to reconnect manually
                this.ws.connect();
            }
            // else the socket will automatically try to reconnect
        });

        this.ws.on('connect_error', (err: any) => {
            no.log(`socketio connect_error:${err.type}`);
        });

        this.ws.onAny((code: string, args: any) => {
            no.log(`socketio receive:${code}`, args);
            this.receivedData[code] = args;
        });
    }

    /**
     * 向服务器发送数据
     * @param code 指令
     * @param args 参数，不要执行JSON.stringify
     */
    public sendDataToServer(code: string, args?: any): void {
        if (args) args = no.base64_encode(JSON.stringify(args));
        this.ws.volatile.emit(code, args);
    }

    /**
     * 向服务器请求数据
     * @param code 指令
     * @param args 参数，不要执行JSON.stringify
     */
    public getDataFromServer(code: string, args?: any): Promise<any> {
        this.sendDataToServer(code, args);
        if (this.ws.connected) {
            return new Promise<any>(resolve => {
                let a = setInterval(() => {
                    let d = this.receivedData[code];
                    if (d != null) {
                        clearInterval(a);
                        resolve(JSON.parse(no.base64_decode(d)));
                        this.receivedData[code] = null;
                    }
                }, 50 / 3);
            });
        } else return Promise.resolve(null);
    }
}
