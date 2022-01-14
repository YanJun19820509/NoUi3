
import { _decorator, Component, Node, EventTarget } from 'cc';
import { JSB } from 'cc/env';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = NativeBridge
 * DateTime = Fri Jan 14 2022 15:38:12 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = NativeBridge.ts
 * FileBasenameNoExtension = NativeBridge
 * URL = db://assets/Script/NoUi3/base/native/NativeBridge.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
 /**
 * 原生调用桥接类
 */
@ccclass('NativeBridge')
export class NativeBridge extends EventTarget {
    private className: string = "ClientBridge";
    private methodName: string = "onCall";

    /**登陆回调 */
    public static OnLoginCallback = 'OnLoginCallback';
    /**支付回调 */
    public static OnPayCallback = 'OnPayCallback';
    /**视频回调 */
    public static OnAdsCallback = 'OnAdsCallback';
    /**其他回调 */
    public static OnOtherCallback = 'OnOtherCallback';

    private static _ins: NativeBridge;

    public static get ins(): NativeBridge {
        if (!this._ins) this._ins = new NativeBridge();
        return this._ins;
    }

    /**
     * 初始化
     * @param nativeClassName 原生类名
     * @param unifiedMethodName 原生类统一调度方法名
     */
    public static init(nativeClassName: string, unifiedMethodName: string) {
        this.ins.className = nativeClassName;
        this.ins.methodName = unifiedMethodName;
    }

    /**
     * 原生回调
     * @param type 回调类型，如pay，ads
     * @param args 回调参数
     */
    public static onNativeCallback(type: string, args: string) {
        let a = JSON.parse(args);
        console.log('onNativeCallback', type, a);
        switch (type) {
            case 'login':
                this.ins.emit(this.OnLoginCallback, a);
                break;
            case 'pay':
                this.ins.emit(this.OnPayCallback, a);
                break;
            case 'ads':
                this.ins.emit(this.OnAdsCallback, a);
                break;
            default:
                this.ins.emit(this.OnOtherCallback, type, a);
                break;
        }
    }

    /**
     * 调原生方法
     * @param className 原生类名
     * @param methodName 原生静态方法名
     * @param args 参数
     */
    private callNativeMethod(className: string, methodName: string, ...args: any) {
        JSB && jsb.reflection.callStaticMethod(className, methodName, args);
    }

    /**
     * 登陆
     * 通常渠道sdk登陆应该在原生层onCreate方法时执行，游戏登陆时则需要先获取渠道用户数据
     */
    public login() {
        this.callOther('login');
    }

    /**
     * 调支付
     * @param args 支付接口所需要参数
     */
    public pay(args: any) {
        this.callOther('pay', args);
    }

    /**
     * 播放视频
     * @param args
     */
    public play(args: any) {
        this.callOther('play', args);
    }

    /**
     * 数据上报
     * @param args 上报的数据内容
     */
    public report(args: any) {
        this.callOther('report', args);
    }

    /**
     * 其他原生调用
     * @param type
     * @param args
     */
    public callOther(type: string, args?: any) {
        this.callNativeMethod(this.className, this.methodName, JSON.stringify({
            'type': type,
            'data': args
        }));
    }
}

window['onNativeCallback'] = NativeBridge.onNativeCallback;
