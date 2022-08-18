
import { _decorator } from 'cc';
// import { io } from './socket.io.msgpack.min.js';
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
        this.ws = window['io'](url, options);

        this.ws.on('connect', () => {
            no.log(`socketio connect:${this.url}`);
        });

        this.ws.on('disconnect', (reason: string) => {
            no.log(`socketio disconnect:${this.url}`);
            if (reason === "io server disconnect") {
                // the disconnection was initiated by the server, you need to reconnect manually
                this.ws.connect();
            }
            // else the socket will automatically try to reconnect
        });

        this.ws.on('connect_error', () => {
            no.log(`socketio connect_error:${this.url}`);
        });

        this.ws.onAny((code: string, args: any) => {
            no.log(`socketio receive:${code}`, args);
            this.receivedData[code] = args;
        });
    }

    /**
     * 向服务器发送数据
     * @param code 指令
     * @param args 参数
     */
    public sendDataToServer(code: string, args?: any): void {
        this.ws.volatile.emit(code, args);
    }

    /**
     * 向服务器请求数据
     * @param code 指令
     * @param args 参数
     */
    public getDataFromServer(code: string, args?: any): Promise<any> {
        this.ws.volatile.emit(code, args);
        if (this.ws.connected) {
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
