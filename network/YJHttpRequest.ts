
import { ccclass, native, JSB, sys } from '../yj';
import { no } from '../no';
import { YJSocketInterface } from './YJSocketInterface';

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
/**
 * HTTP请求工具类，封装XMLHttpRequest和平台特定实现
 * 支持GET/POST请求、文件下载、自定义请求头等功能
 * 实现统一的网络接口规范
 */
export class YJHttpRequest implements YJSocketInterface {
    private url: string; // 基础请求地址
    private headers: { name: string, value: string }[] = []; // 自定义请求头存储

    /**
     * 初始化HTTP请求实例
     * @param url 基础请求地址 
     * @example 
     * const request = new YJHttpRequest('http://api.example.com');
     */
    constructor(url: string) {
        this.url = url;
    }

    /**
     * 发送数据到服务器（POST请求）
     * @param code 接口路径代码 
     * @param args 请求参数
     * @example
     * request.sendDataToServer('user', {name: 'John', age: 25});
     */
    sendDataToServer(code: string, args?: any): void {
        this.httpRequest('POST', this.url + '/' + code, args);
    }

    /**
     * 从服务器获取数据（POST请求）
     * @param code 接口路径代码
     * @param args 请求参数
     * @param contentType 请求内容类型，默认application/json
     * @returns Promise解析后的数据或null
     * @example
     * request.getDataFromServer('user-info', {id: 123})
     *   .then(data => console.log(data));
     */
    getDataFromServer(code: string, args?: any, contentType?: string): Promise<any | null> {
        return new Promise<any>(resolve => {
            this.httpRequest('POST', this.url + '/' + code, args, contentType, v => {
                resolve(this.parseData(v));
            }, v => {
                no.err('getDataFromServer', v);
                resolve(null);
            });
        }).catch(e => {
            console.error(e);
            return null;
        });
    }

    /**
     * 从服务器获取JSON数据（GET请求）
     * @param code 接口路径代码 
     * @returns Promise解析后的JSON对象或null
     * @example
     * request.getJsonFromServer('config')
     *   .then(config => loadConfig(config));
     */
    getJsonFromServer(code: string): Promise<any | null> {
        return new Promise<any>(resolve => {
            this.httpRequest('GET', this.url + '/' + code, null, 'application/json', v => {
                resolve(this.parseData(v));
            }, v => {
                resolve(null);
            });
        }).catch(e => {
            console.error(e);
            return null;
        });
    }

    /**
     * 数据解析器
     * @param v 原始响应数据
     * @returns 解析后的JSON对象或原始数据
     * @private
     */
    private parseData(v: any) {
        if (v instanceof Object) {
            return v;
        } else {
            try {
                return no.parse2Json(v)
            } catch (e) {
                no.err('no.parse2Json1', 'YJHttpRequest.getJsonFromServer', v);
                try {
                    // 尝试添加引号后再次解析
                    return no.parse2Json(`'${v}'`);
                } catch (ee) {
                    no.err('no.parse2Json2', 'YJHttpRequest.getJsonFromServer', v);
                    return v; // 最终返回原始数据
                }
            }
        }
    }

    /**
     * 文件下载方法（静态方法）
     * @param url 文件下载地址
     * @param onProgress 下载进度回调 (已下载量, 总量)
     * @param onComplete 下载完成回调 (存储路径, 文件数据)
     * @param responseType 响应类型，默认arraybuffer
     * @example
     * YJHttpRequest.downloadFile(
     *   'http://example.com/file.zip',
     *   (loaded, total) => updateProgress(loaded/total),
     *   (path, data) => handleDownloadComplete(data)
     * );
     */
    static downloadFile(url: string, onProgress: (loaded: number, total: number) => void, onComplete: (storageFilePath?: string, fileData?: any) => void, responseType?: XMLHttpRequestResponseType) {
        no.log('开始下载 downloader', url);
        // 原生平台实现
        if (JSB) {
            const fileUtils = native.fileUtils, fileName = no.getFileName(url);
            const storagePath = no.pathjoin(fileUtils.getWritablePath(), 'yj_download', fileName);
            no.log('downloadFile storagepath', storagePath);
            const downloader = new native.Downloader();
            // 进度监听
            downloader.setOnTaskProgress((task, received, totalReceived, totalExpected) => {
                if (task.identifier == fileName) {
                    onProgress(Number(totalReceived), Number(totalExpected));
                }
            });
            // 成功回调
            downloader.setOnFileTaskSuccess(task => {
                if (task.identifier == fileName) {
                    onComplete(storagePath, fileUtils['getDataFromFile'](storagePath));
                    window['_downloader'] = null;
                }
            });
            // 错误处理（自动重试）
            downloader.setOnTaskError((task, errCode, errCodeInterval, errStr) => {
                if (task.identifier == fileName) {
                    downloader.createDownloadFileTask(url, storagePath, fileName);
                }
            });
            downloader.createDownloadFileTask(url, storagePath, fileName);
            window['_downloader'] = downloader;
        } else {
            // Web平台实现
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = responseType || 'arraybuffer';
            xhr.onprogress = function (ev) {
                no.log('downloadFile', ev.lengthComputable);
                if (ev.lengthComputable) {
                    onProgress(Number(ev.loaded), Number(ev.total));
                }
            };
            xhr.onload = function (ev) {
                if (this.readyState == 4 && this.status == 200) {
                    no.log('downloadFile complete')
                    onComplete(null, this.response);
                } else {
                    no.log('downloadFile fail')
                    onComplete();
                }
            };
            xhr.send();
        }
    }

    /**
     * 添加自定义请求头
     * @param name 头名称
     * @param value 头值
     * @example
     * request.setHeader('Authorization', 'Bearer token123');
     */
    setHeader?(name: string, value: string): void {
        this.headers.push({ name: name, value: value });
    }

    /**
     * 基础HTTP请求方法
     * @private
     * @param type 请求类型 GET/POST
     * @param url 完整请求地址
     * @param data 请求数据
     * @param contentType 内容类型，默认application/json
     * @param okCall 成功回调
     * @param errorCall 错误回调
     */
    private httpRequest(type: string, url: string, data: any, contentType = 'application/json', okCall?: (v: any) => void, errorCall?: (v: any) => void): void {
        let xhr = new XMLHttpRequest();
        xhr.open(type, url, true);
        // POST请求设置头信息
        if (type == 'POST') {
            xhr.setRequestHeader('Accept', contentType);
            xhr.setRequestHeader('Content-Type', contentType);
        }

        // 添加自定义头
        if (this.headers.length > 0) {
            for (let i = 0, n = this.headers.length; i < n; i++) {
                let header = this.headers[i];
                xhr.setRequestHeader(header.name, header.value);
            }
        }

        // 状态变更监听
        xhr.onreadystatechange = function () {
            no.log('http ready state change:', xhr.readyState);
        };

        // 请求成功处理
        xhr.onload = function () {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                no.log('http data onload', xhr.response);
                okCall?.(xhr.response);
            }
        };

        // 错误处理
        xhr.onerror = function () {
            no.err('无法连接服务器：', url);
            errorCall?.('no_server');
        };

        // 超时处理
        xhr.ontimeout = function () {
            no.err('连接超时：', url);
            errorCall?.('timeout');
        };

        data ? xhr.send(data) : xhr.send();
    }

    /**
     * 微信小游戏平台请求适配
     * @private
     */
    private wxRequest(type: string, url: string, data: any, contentType: string, okCall: (v: any) => void, errorCall: (v: any) => void) {
        if (sys.platform != sys.Platform.WECHAT_GAME) return false;
        no.log('wxRequest')
        let h = { 'content-type': contentType };
        // 合并自定义头
        this.headers.forEach(header => h[header.name] = header.value);
        
        window['wx'].request({
            url: url,
            data: data,
            method: type,
            header: h,
            success: (res) => okCall?.(res.data instanceof Object ? res.data : `'${res.data}'`),
            fail: (err) => {
                no.err('无法连接服务器：', url, err);
                errorCall?.('no_server');
            }
        });
        return true;
    }
}
