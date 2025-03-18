
import { ccclass, requireComponent, menu } from '../yj';
import { YJi18n } from '../base/YJi18n';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { SetText } from './SetText';

/**
 * Predefined variables
 * Name = Seti18n
 * DateTime = Thu Apr 14 2022 14:28:05 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = Seti18n.ts
 * FileBasenameNoExtension = Seti18n
 * URL = db://assets/NoUi3/ui/Seti18n.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('Seti18n')
@menu('NoUi/ui/Seti18n(本地化:any)')
@requireComponent(YJDynamicTexture)
/**
 * 国际化文本设置组件
 * @example
 * // 数据格式支持：
 * // 1. 简单模式："KEY"
 * // 2. 带参数模式："KEY|param1,param2"
 * // 3. 对象模式：{ field1: "KEY1", field2: "KEY2|param" }
 */
export class Seti18n extends SetText {

    /**
     * 数据变更处理
     * @param data 支持字符串或对象格式的国际化配置
     * @description
     * - 当data为对象时，会遍历所有属性进行国际化转换
     * - 参数通过YJi18n系统进行动态替换
     */
    protected onDataChange(data: any) {
        // 处理对象类型数据（多字段国际化）
        if (typeof data === 'object') {
            // 使用标准for循环遍历对象属性
            const keys = Object.keys(data);
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                // 解析国际化配置项
                const d = this.parse(data[k]);
                // 执行实际国际化转换
                data[k] = YJi18n.ins.to(d.key, d.args);
            }
        }
        // 调用父类文本设置逻辑
        super.onDataChange(data);
    }

    /**
     * 解析国际化配置字符串
     * @param v 格式为"KEY" 或 "KEY|arg1,arg2"
     * @returns 包含翻译键和参数的配置对象
     * @example
     * parse("ITEM_NAME") => { key: "ITEM_NAME" }
     * parse("WELCOME_MSG|user") => { key: "WELCOME_MSG", args: ["user"] }
     */
    private parse(v: string): { key: string, args?: string[] } {
        // 拆分键和参数部分
        const parts = v.split('|');
        // 无参数情况
        if (parts[1] === undefined) return { key: parts[0] };
        // 带参数情况，拆分参数数组
        return { 
            key: parts[0], 
            args: parts[1].split(',') 
        };
    }
}
