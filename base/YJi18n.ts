
import { ccclass } from '../yj';
import { no } from '../no';

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
    private _defLan: string;

    public static get ins(): YJi18n {
        if (!this._ins)
            this._ins = new YJi18n();
        return this._ins;
    }

    /**
     * 加载本地化配置json文件
     * @param fileUrl json文件url
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
     * 默认语言
     */
    public set defaultLanguage(v: string) {
        this._defLan = v;
    }

    public get defaultLanguage(): string {
        return this._defLan;
    }


    /**
     * 获取指定语言文本
     * @param key 
     * @param args 格式化参数
     * @param lan 指定语言
     * @returns 
     */
    public to(key: string, args?: any, lan?: string): string {
        let s = this.get(`${key}.${lan || this._lan}`) || this.get(`${key}.${this._defLan}`);
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
