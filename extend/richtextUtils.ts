/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 12:07:36 GMT+0800 (中国标准时间)
 *
 */

import { stringUtils } from "./stringUtils";

export namespace richtextUtils {
    /**
    * 给富文本添加BBCode标签
    * @param text 原始富文本内容
    * @param tags BBCode标签配置数组（当使用重载1时）
    * @param tag 单个标签名（当使用重载2时）
    * @param value 标签属性值，支持多种格式：
    * - 数字/字符串：直接作为属性值（如 size=24）
    * - 对象：单个键值对（如 {key:'color',value:'#ff0000'}）
    * - 对象数组：多个键值对（如 [{key:'size',value:24}, {key:'color',value:'blue'}]）
    * @returns 添加BBCode后的富文本字符串
    * @example
    * // 添加多个标签
    * addBBCode('Hello', [
    *   { tag: 'b' }, // 加粗
    *   { tag: 'color', value: '#ff0000' } // 红色
    * ]); // 返回 '<b><color=#ff0000>Hello</color></b>'
    * 
    * // 添加单个带数值属性的标签
    * addBBCode('Text', 'size', 24); // 返回 '<size=24>Text</size>'
    * 
    * // 添加复杂属性配置
    * addBBCode('World', 'style', [
    *   { key: 'font', value: 'Arial' },
    *   { key: 'outline', value: 2 }
    * ]); // 返回 '<style font=Arial outline=2>World</style>'
    * 
    * // 添加换行标签
    * addBBCode('Line1\nLine2', 'br'); // 返回 'Line1<br/>Line2'
    */
    export function addBBCode(text: string, tags: { tag: string, value?: number | string | { key: string, value: any } | { key: string, value: any }[] }[]): string;
    /**
     * 给富文本添加单个BBCode标签
     * @param text 原始富文本内容
     * @param tag 要添加的标签名称
     * @param value 标签属性值（可选）
     * @returns 添加BBCode后的富文本字符串
     */
    export function addBBCode(text: string, tag: string, value?: number | string | { key: string, value: any } | { key: string, value: any }[]): string;
    export function addBBCode(text: string, tags: string | { tag: string, value?: number | string | { key: string, value: any } | { key: string, value: any }[] }[], props?: number | string | { key: string, value: any } | { key: string, value: any }[]): string {
        if (tags == 'br') return `${text}<br/>`;
        if (tags instanceof Array) {
            let a = text;
            for (let i = 0; i < tags.length; i++) {
                let t = tags[i];
                a = addBBCode(a, t.tag, t.value);
            }
            return a;
        } else {
            const tagFormat = '<{tag}{props}>{content}</{tag}>';
            const propFormat = '{key}={value}';

            if (props) {
                if (typeof props == 'number' || typeof props == 'string') {
                    return stringUtils.formatString(tagFormat, { tag: tags, props: `=${props}`, content: text });
                }

                let ps: string[] = [''];
                props = [].concat(props);
                for (let i = 0; i < props.length; i++) {
                    ps[ps.length] = stringUtils.formatString(propFormat, props[i]);
                }

                return stringUtils.formatString(tagFormat, { tag: tags, props: ps.join(' '), content: text });
            } else
                return stringUtils.formatString(tagFormat, { tag: tags, props: '', content: text });
        }
    }
}