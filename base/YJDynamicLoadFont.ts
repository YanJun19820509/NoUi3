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

    onLoad() {
        this.loadFont();
    }

    public async loadFont() {
        if (this.fontUuid) {
            const label = this.getComponent(Label) || this.getComponent(RichText);
            if (label.font) return;
            let a = false;
            no.assetBundleManager.loadByUuid<Font>(this.fontUuid, Font, (file) => {
                label.useSystemFont = true;
                label.font = file;
                a = true;
            });
            await no.waitFor(() => { return a; });
        }
    }
}


