import { ccclass, Material, Component, Node, Texture2D } from '../yj';
import { no } from '../no';

@ccclass('YJSetSample2DMaterial')
export class YJSetSample2DMaterial extends Component {
    private _material: Material;
    public get material() {
        if (!this._material) {
            this._material = new Material();
            this._material.initialize({
                effectName: '../NoUi3/effect/sample2d',
                defines: { 'USE_TEXTURE': true, 'USE_ALPHA_TEST': true }
            });
        }
        return this._material;
    }

    public setAtlases(textures: Texture2D[]) {
        let material = this.material;
        for (let i = 0, n = textures.length; i < n; i++) {
            const key = `atlas${i}`;
            if (this.hasProperty(material, key)) {
                material.setProperty(key, textures[i], 0);
            }
        }
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
}


