import { ccclass, Material, Component, Texture2D, sys, EffectAsset } from '../yj';
import { no } from '../no';

@ccclass('YJSetSample2DMaterial')
export class YJSetSample2DMaterial extends Component {
    private _material: Material;

    onDestroy() {
        this._material?.destroy();
    }

    public get material() {
        if (!this._material) {
            this._material = new Material();
            const effectAsset = EffectAsset.get('../NoUi3/effect/sample2d');
            if (effectAsset) {
                this._material.initialize({
                    effectAsset: effectAsset,
                    defines: { 'USE_TEXTURE': true, 'USE_ALPHA_TEST': true }
                });
            } else {
                no.err('../NoUi3/effect/sample2d 未加载')
            }
        }
        return this._material;
    }

    public setAtlases(textures: Texture2D[]) {
        const material = this.material;
        for (let i = 0, n = textures.length; i < n; i++) {
            const key = `atlas${i}`;
            if (no.materialHasProperty(material, 0, 0, key)) {
                material.setProperty(key, textures[i], 0);
            }
        }
    }
}


