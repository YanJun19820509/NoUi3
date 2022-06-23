
import { Material, RenderComponent, v2, v3, v4, Vec2, Vec3, Vec4, _decorator } from 'cc';
import { YJVertexColorTransition } from '../effect/YJVertexColorTransition';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
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
 * },
 * 
 * 如果对graphics设置效果，请使用SetGraphicsEffect
 */
@ccclass('SetEffect')
@menu('NoUi/ui/SetEffect(设置shader:object)')
export class SetEffect extends FuckUi {
    protected _renderComp: RenderComponent;

    protected onDataChange(data: any) {
        if (!this._renderComp) {
            this._renderComp = this.getComponent(RenderComponent);
            if (!this._renderComp) return;
        }
        let { path, properties, defines }: { path: string, properties: {}, defines: {} } = data;
        this.setMaterial(path, defines, properties);
    }

    protected setMaterial(path: string, defines: any, properties: any) {
        if (YJDynamicTexture.hasCommonMaterial()) {
            YJDynamicTexture.setCommonMaterial(this._renderComp);
            this.setVertex(defines, properties);
            this.work();
        }
        else if (this._renderComp.material && (!path || this._renderComp.material.effectName == `../${path}`)) {
            this.setProperties(this._renderComp.material, defines, properties);
            this.work();
        } else if (path)
            no.assetBundleManager.loadEffect(path, item => {
                const material = new Material();
                material.initialize({
                    effectAsset: item
                });
                this._renderComp.material = material;
                this.setProperties(this._renderComp.material, defines, properties);
                this.work();
            });
        else this.reset();
    }

    private setVertex(defines: any, properties: any) {
        this.getComponent(YJVertexColorTransition).setEffect(defines, properties);
    }

    protected setProperties(material?: Material, defines?: any, properties?: any) {
        if (!material) return;
        if (defines)
            material.recompileShaders(defines);
        if (properties)
            for (const key in properties) {
                if (this.hasProperty(material, key)) {
                    let v: number | Vec2 | Vec3 | Vec4,
                        p = [].concat(properties[key]);
                    switch (p.length) {
                        case 1:
                            v = p[0];
                            break;
                        case 2:
                            v = v2(p[0], p[1]);
                            break;
                        case 3:
                            v = v3(p[0], p[1], p[2]);
                            break;
                        case 4:
                            v = v4(p[0], p[1], p[2], p[3]);
                            break;
                    }
                    material.setProperty(key, v);
                }
            }
    }

    //计算frame在合图中的实际rect
    private caculateFact(material: Material, f: any) {
        let texture = f._texture;

        if (this.hasProperty(material, 'factRect'))
            material.setProperty('factRect', new Vec4(f.uv[4], f.uv[5], f.uv[2] - f.uv[4], f.uv[3] - f.uv[5]));

        if (this.hasProperty(material, 'ratio'))
            material.setProperty('ratio', texture.width / texture.height);
    }

    protected hasProperty(material: Material, key: string): boolean {
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
        if (!this._renderComp) {
            this._renderComp = this.getComponent(RenderComponent);
            if (!this._renderComp) return;
        }
        if (!this._renderComp.renderData?.frame) {
            this.scheduleOnce(() => {
                this.work();
            }, 0);
            return;
        }
        this.caculateFact(this._renderComp.material, this._renderComp.renderData.frame);
    }

    public reset(): void {
        this._renderComp.material = null;
        this._renderComp.customMaterial = null;
        this._renderComp.markForUpdateRenderData();
    }
}
