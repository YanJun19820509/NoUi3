import { ccclass, Material, Component, Texture2D } from '../yj';
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
            if (no.materialHasProperty(material, key)) {
                material.setProperty(key, textures[i], 0);
            }
        }
    }
}


