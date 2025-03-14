import { no } from "../no";
import { Component, Font, Label, RichText, ccclass, property, requireComponent } from "../yj";

//动态加载字体
@ccclass('YJDynamicLoadFont')
/**
 * 动态字体加载组件
 * @description 实现运行时动态加载字体资源并应用到文本组件
 * @example
 * // 编辑器配置示例：
 * // - fontUuid: 填写字体资源的UUID
 * // - 勾选bind属性：将自动提取当前字体信息并清空默认字体
 * 
 * @example
 * // 代码调用示例：
 * // 获取组件并手动加载字体
 * const fontLoader = this.getComponent(YJDynamicLoadFont);
 * await fontLoader.loadFont();
 */
@ccclass('YJDynamicLoadFont')
export class YJDynamicLoadFont extends Component {
    /** 字体资源名称（仅用于显示） */
    @property
    fontName: string = '';
    
    /** 字体资源UUID（用于实际加载） */
    @property
    fontUuid: string = '';

    /** 
     * 绑定标记属性
     * @property 当在编辑器勾选时，会提取当前字体信息并清空默认字体
     * @remarks 用于初始化配置，运行时无效
     */
    @property
    public get bind(): boolean {
        return false;
    }

    public set bind(v: boolean) {
        const label = this.getComponent(Label) || this.getComponent(RichText);
        if (label.font) {
            this.fontName = label.font.name;
            this.fontUuid = label.font.uuid;
            label.font = null;
        }
    }

    /** 缓存的字体资源引用 */
    private _font: Font;

    /**
     * 组件加载时自动执行字体加载
     */
    onLoad() {
        this.loadFont();
    }

    /**
     * 组件销毁时释放字体资源引用
     */
    onDestroy() {
        if (this._font) no.assetBundleManager.decRef(this._font);
        this._font = null;
    }

    /**
     * 异步加载字体资源并应用到组件
     * @returns Promise
     * @example
     * // 手动重新加载字体
     * await this.getComponent(YJDynamicLoadFont).loadFont();
     * 
     * // 处理加载失败情况
     * try {
     *     await fontLoader.loadFont();
     * } catch(e) {
     *     console.error('字体加载失败', e);
     * }
     */
    public async loadFont() {
        const label = this.getComponent(Label) || this.getComponent(RichText);
        if (label.font) return; //已经加载过字体了
        
        if (this.fontUuid) {
            try {
                const font = await new Promise<Font>((resolve) => {
                    no.assetBundleManager.loadByUuid<Font>(this.fontUuid, (file) => {
                        resolve(file);
                    });
                }).catch(e => {
                    console.error(e);
                    return null;
                });

                // 检查组件是否还有效
                if (!this.isValid || !label?.isValid) return;
                
                if (font) {
                    label.useSystemFont = false;
                    label.font = font;
                    this._font = font;
                }
            } catch (error) {
                console.error('[YJDynamicLoadFont] Failed to load font:', error);
            }
        }
    }
}


