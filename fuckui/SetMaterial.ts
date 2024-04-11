import { EDITOR, Material, UIRenderer, ccclass, property } from '../../NoUi3/yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * 动态设置材质
 * Author mqsy_yj
 * DateTime Thu Apr 11 2024 16:52:44 GMT+0800 (中国标准时间)
 * data: string 材质的url
 */

@ccclass('SetMaterial')
export class SetMaterial extends FuckUi {

    @property
    defaultMaterialUrl: string = '';
    @property
    _defaultMateriaUuid: string = '';

    onLoad() {
        super.onLoad();
        if (!EDITOR)
            this.resetMaterial();
    }

    protected onDataChange(data: any) {
        this.loadMaterial(data);
    }

    private loadMaterial(url: string) {
        no.assetBundleManager.loadMaterial(url, material => {
            const render = this.getComponent(UIRenderer);
            if (render)
                render.customMaterial = material;
        });
    }

    update() {
        if (EDITOR) {
            const material = this.getComponent(UIRenderer)?.customMaterial;
            if (material && !this.defaultMaterialUrl) {
                this._defaultMateriaUuid = material.uuid;
                no.getAssetUrlInEditorMode(material.uuid, url => {
                    this.defaultMaterialUrl = url;
                });
            }
        }
    }

    public resetMaterial() {
        if (this.defaultMaterialUrl) {
            no.assetBundleManager.loadAny<Material>({ uuid: this._defaultMateriaUuid, type: Material }, material => {
                const render = this.getComponent(UIRenderer);
                if (render)
                    render.customMaterial = material;
            });
        }
    }

    public removeMaterial() {
        const render = this.getComponent(UIRenderer);
        if (render)
            render.customMaterial = null;
    }
}
