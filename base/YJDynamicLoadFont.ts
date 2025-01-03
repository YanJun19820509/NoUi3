import { no } from "../no";
import { Component, Font, Label, RichText, ccclass, property, requireComponent } from "../yj";

//动态加载字体
@ccclass('YJDynamicLoadFont')
export class YJDynamicLoadFont extends Component {
    @property
    fontName: string = '';
    @property
    fontUuid: string = '';
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

    private _font: Font;

    onLoad() {
        this.loadFont();
    }

    onDestroy() {
        if (this._font) no.assetBundleManager.decRef(this._font);
        this._font = null;
    }

    public async loadFont() {
        const label = this.getComponent(Label) || this.getComponent(RichText);
        if (label.font) return; //已经加载过字体了
        if (this.fontUuid) {
            try {
                const font = await new Promise<Font>((resolve) => {
                    no.assetBundleManager.loadByUuid<Font>(this.fontUuid, (file) => {
                        resolve(file);
                    });
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


