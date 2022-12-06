
import { _decorator } from 'cc';
import { no } from '../no';
const { ccclass } = _decorator;

/**
 * Predefined variables
 * Name = YJi18n
 * DateTime = Thu Apr 14 2022 14:24:10 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJi18n.ts
 * FileBasenameNoExtension = YJi18n
 * URL = db://assets/NoUi3/base/YJi18n.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * json格式: {id:'1', zh:'嘿', en:'hi'}
 */
@ccclass('YJi18n')
export class YJi18n extends no.Data {
    private static _ins: YJi18n;
    private _lan: string;

    public static get ins(): YJi18n {
        if (!this._ins)
            this._ins = new YJi18n();
        return this._ins;
    }

    /**
     * 加载本地化配置json文件
     * @param fileUrl json文件url
     * @param language 语言标识
     */
    public loadProperties(fileUrl: string, cb?: () => void) {
        no.assetBundleManager.loadJSON(fileUrl, item => {
            this.data = item.json;
            cb?.();
        });
    }

    /**
     * 设置语言
     */
    public set language(v: string) {
        this._lan = v;
    }

    public get language(): string {
        return this._lan;
    }


    /**
     * 获取指定语言文本
     * @param key 
     * @param args 格式化参数
     * @returns 
     */
    public to(key: string, args?: any): string {
        let s = this.get(`${key}.${this._lan}`);
        if (s == null) {
            // console.error(`指定的多语言无效，id：${key}`);
            return s;
        }
        if (args) {
            return no.formatString(s, args);
        }
        return s;
    }

}
