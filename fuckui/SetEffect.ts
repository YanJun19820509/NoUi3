
import { EffectAsset, Material, RenderComponent, Vec4, _decorator } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetEffect
 * DateTime = Sat Mar 19 2022 14:44:45 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetEffect.ts
 * FileBasenameNoExtension = SetEffect
 * URL = db://assets/NoUi3/fuckui/SetEffect.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

/**
 * data:{
 * path:'filepath',
 * defines:{key:boolean},
 * properties:{key:any}
 * }
 */
@ccclass('SetEffect')
@menu('NoUi/ui/SetEffect(设置shader:object)')
export class SetEffect extends FuckUi {
    private _renderComp: RenderComponent;

    protected onDataChange(data: any) {
        if (!this._renderComp) {
            this._renderComp = this.getComponent(RenderComponent);
            if (!this._renderComp) return;
        }
        let { path, properties, defines }: { path: string, properties: {}, defines: {} } = data;
        if (path == null) this.reset();
        else this.setMaterial(path, defines, properties);
    }

    private setMaterial(path: string, defines: any, properties: any) {
        if (this._renderComp.material?.effectName == `../${path}`)
            this.setProperties(this._renderComp.material, defines, properties);
        else
            no.assetBundleManager.loadEffect(path, item => {
                const material = new Material();
                material.initialize({
                    effectAsset: item
                });
                this._renderComp.material = material;
                this.setProperties(this._renderComp.material, defines, properties);
            });
    }

    private setProperties(material: Material, defines?: any, properties?: any) {
        if (defines)
            material.recompileShaders(defines);
        if (properties)
            for (const key in properties) {
                if (this.hasProperty(material, key))
                    material.setProperty(key, properties[key]);
            }
        this.work();
    }

    //计算frame在合图中的实际rect
    private caculateFact(material: Material, f: any) {
        let texture = f._texture;

        if (this.hasProperty(material, 'factRect'))
            material.setProperty('factRect', new Vec4(f.uv[4], f.uv[5], f.uv[2] - f.uv[4], f.uv[3] - f.uv[5]));

        if (this.hasProperty(material, 'ratio'))
            material.setProperty('ratio', texture.width / texture.height);
    }

    private hasProperty(material: Material, key: string): boolean {
        for (let i = 0, n = material.effectAsset.techniques.length; i < n; i++) {
            for (let j = 0, m = material.effectAsset.techniques[i].passes.length; j < m; j++) {
                let properties = material.effectAsset.techniques[i].passes[j].properties || {};
                if (properties[key] !== undefined) return true;
            }
        }
        return false;
    }

    /**
     * work
     */
    public work() {
        if (!this._renderComp.renderData?.frame) {
            this.scheduleOnce(() => {
                this.work();
            }, 0);
            return;
        }
        this.caculateFact(this._renderComp.material, this._renderComp.renderData.frame);
    }

    public reset(): void {
        this._renderComp.customMaterial = null;
        this._renderComp.markForUpdateRenderData();
    }

}
