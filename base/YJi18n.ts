
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
/**
 * 国际化多语言支持类
 * @description 提供多语言资源配置和文本获取能力，支持动态切换语言和文本格式化
 * @example
 * // JSON格式示例：
 * [{
 *   "id": "welcome",
 *   "zh": "欢迎",
 *   "en": "Welcome",
 *   "jp": "ようこそ"
 * }]
 * 
 * @example
 * // 基础使用流程：
 * 1. 加载语言包：YJi18n.ins.loadProperties('i18n/language');
 * 2. 设置默认语言：YJi18n.ins.defaultLanguage = 'zh';
 * 3. 获取文本：YJi18n.ins.to('welcome');
 */
export class YJi18n extends no.Data {
    private static _ins: YJi18n;
    private _lan: string;
    private _defLan: string;
    /** 语言变更事件系统 */
    private _event = no.evn.new();
    
    /**
     * 获取单例实例
     * @example
     * // 获取实例
     * const i18n = YJi18n.ins;
     */
    public static get ins(): YJi18n {
        if (!this._ins)
            this._ins = new YJi18n();
        return this._ins;
    }

    /**
     * 加载本地化配置json文件
     * @param fileUrl json文件路径（相对于resources目录）
     * @param cb 加载完成回调
     * @example
     * // 加载语言资源文件
     * YJi18n.ins.loadProperties('i18n/language', () => {
     *     console.log('语言包加载完成');
     * });
     */
    public loadProperties(fileUrl: string, cb?: () => void) {
        no.assetBundleManager.loadJSON(fileUrl, item => {
            this.data = item.json;
            item.decRef();
            cb?.();
        });
    }

    /**
     * 当前使用语言（优先使用此值）
     */
    public set language(v: string) {
        this._lan = v;
    }

    public get language(): string {
        return this._lan || this._defLan;
    }

    /**
     * 默认语言（当前语言未设置时使用）
     * @example
     * // 设置默认语言为中文
     * YJi18n.ins.defaultLanguage = 'zh';
     */
    public set defaultLanguage(v: string) {
        this._defLan = v;
    }

    public get defaultLanguage(): string {
        return this._defLan;
    }

    /**
     * 获取本地化文本
     * @param key 文本ID 
     * @param args 格式化参数（可选）
     * @param lan 指定语言（可选，默认使用当前语言）
     * @returns 格式化后的文本
     * @example
     * // 获取简单文本
     * YJi18n.ins.to('welcome'); 
     * 
     * // 带参数的格式化文本
     * YJi18n.ins.to('greeting', {name: 'John'}); 
     * 
     * // 指定语言获取
     * YJi18n.ins.to('welcome', null, 'en');
     */
    public to(key: string, args?: any, lan?: string): string {
        let s = this.get(`${key}.${lan || this._lan}`) || this.get(`${key}.${this._defLan}`);
        if (s == null) {
            return s;
        }
        if (args) {
            return no.formatString(s, args);
        }
        return s;
    }

    /**
     * 注册语言变更监听
     * @example
     * // 监听语言变更
     * YJi18n.ins.onLanguagechange(() => {
     *     this.updateUI();
     * }, this);
     */
    public onLanguagechange(handler: Function, target?: any) {
        this._event.on('Languagechange', handler, target);
    }

    /**
     * 移除语言变更监听
     * @example
     * // 移除指定监听
     * YJi18n.ins.offLanguagechange(this.updateUI, this);
     */
    public offLanguagechange(handler: Function, target?: any) {
        this._event.off('Languagechange', handler, target);
    }
}
