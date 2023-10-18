import { no } from '../../no';
import { ccclass, Material, Component, Texture2D, property, Vec2, v2, v4, EDITOR } from '../../yj';

@ccclass('YJSetSample3DMaterial')
export class YJSetSample3DMaterial extends Component {
    @property({ type: Material })
    public get material(): Material {
        if (EDITOR) return this._material;
        if (!this._material) {
            this._material = new Material();
            this._material.initialize({
                effectName: '../NoUi3/3d/effect/sample3d',
                defines: { 'USE_TEXTURE': true, 'USE_ALPHA_TEST': true, 'USE_VERTEX_COLOR': true, 'USE_INSTANCING': true }
            });
        }
        return this._material;
    }

    public set material(v: Material) {
        this._material = v;
    }

    @property({ serializable: true })
    private _material: Material;

    public setAtlases(textures: Texture2D[]) {
        let material = this.material;
        for (let i = 0, n = textures.length; i < n; i++) {
            const key = `mainTexture${i}`;
            if (no.materialHasProperty(material, key)) {
                material.setProperty(key, textures[i], 0);
            }
        }
    }
}


