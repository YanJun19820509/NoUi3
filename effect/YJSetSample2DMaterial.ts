import { Material } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { SetSpriteFrameInSampler2D } from '../fuckui/SetSpriteFrameInSampler2D';
import { Texture2D } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('YJSetSample2DMaterial')
export class YJSetSample2DMaterial extends Component {
    private _material: Material;
    public get material() {
        return this._material;
    }
    public createMaterial() {
        this._material = new Material();
        this._material.initialize({
            effectName: 'sample2d',
            defines: [{ 'USE_TEXTURE': true }, { 'USE_ALPHA_TEST': true }]
        });
    }

    public setAtlases(textures: Texture2D[]) {
        const properties = this._material.effectAsset.techniques[0].passes[0].properties || {};
        for (let i = 0, n = textures.length; i < n; i++) {
            const k = `atlas${i}`;
            if (properties[k]) {
                this._material.setProperty(k, textures[i]);
            }
        }
    }

    public syncMaterialToSample2DRenderComponent() {
        const comps = this.getComponentsInChildren(SetSpriteFrameInSampler2D);
        comps.forEach(c => {
            c.setSpriteMaterial(this._material);
        });
    }
}


