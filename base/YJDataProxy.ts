
import { ccclass, menu, Component, Node } from '../yj';
import { YJDataWork } from './YJDataWork';

/**
 * Predefined variables
 * Name = YJDataProxy
 * DateTime = Fri Jan 14 2022 17:55:10 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJDataProxy.ts
 * FileBasenameNoExtension = YJDataProxy
 * URL = db://assets/Script/NoUi3/base/YJDataProxy.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJDataProxy')
@menu('NoUi/base/YJDataProxy(数据代理基类)')
export class YJDataProxy extends YJDataWork {
    private _proxyMap: any = {};

    public get proxyData(): any {
        if (!this._data) return null;
        if (!this._proxyMap['__root']) {
            this.setProxy(this._data.data, '__root');
        }
        return this._proxyMap['__root'];
    }

    private setProxy(d: any, key: string) {
        if (d instanceof Array) return;
        if (d instanceof Object) {
            let me = this;
            d['__path'] = key;
            this._proxyMap[key] = new Proxy(d, {
                get: function (target: any, property: string) {
                    let a = target[property];
                    if (a && a['__path']) {
                        return me._proxyMap[a['__path']] || a;
                    }
                    return a;
                },
                set: function (target: any, property: string, value: any): boolean {
                    if (target[property] == undefined && value) {
                        target[property] = value;
                        me.setProxy(target, target['__path']);
                    } else {
                        if (value instanceof Object && !(value instanceof Array))
                            me.setProxy(value, target[property]['__path']);
                        target[property] = value;
                    }

                    me.setValue(`${target['__path']}.${property}`, value);
                    return true;
                }
            });
            for (const k in d) {
                if (k == '__path') continue;
                this.setProxy(d[k], key != '__root' ? `${key}.${k}` : k);
            }
        } else return;
    }
}