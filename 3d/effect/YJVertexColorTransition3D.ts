
import { ccclass, disallowMultiple, Component, MeshRender, Vec4, AttributeName } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJVertexColorTransition3D
 * DateTime = Sat May 21 2022 10:26:59 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJVertexColorTransition3D.ts
 * FileBasenameNoExtension = YJVertexColorTransition3D
 * URL = db://assets/NoUi3/effect/YJVertexColorTransition3D.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJVertexColorTransition3D')
@disallowMultiple()
export class YJVertexColorTransition3D extends Component {

    private renderComp: MeshRender;
    /**
     * _data数据说明，
     * x用来存放宏定义的类型，为负值，非负则为正常状态，整数部分为 color相关，小数部分为uv 相关
     * yz用来存放与 一些扩展数据，当 x=0 时用来存放当前 color 的数据
     * w在Sprite.Type ！= SIMPLE 时会被引擎修改，通常，Sprite.Type == SIMPLE 可以使用
    */
    private _data: Vec4 = new Vec4(0, 0, 0, 0);
    private _defineIds: number[][] = [[], []];

    onLoad() {
        if (!this.renderComp)
            this.renderComp = this.getComponent(MeshRender);
        if (!this.renderComp) return;
    }

    public setEffect(defines: any, properties?: number[]) {
        if (!this.renderComp)
            this.renderComp = this.getComponent(MeshRender);
        if (!this.renderComp || !defines) return;

        this._setDefines(defines);
        this._setProperties(properties);
        this._updateMesh();
    }

    private _setProperties(properties: number[]) {
        if (!properties) return;
        this._data.y = properties[0] || this._data.y;
        this._data.z = properties[1] || this._data.z;
    }

    private _setDefines(defines: any) {
        for (let key in defines) {
            let v = defines[key];
            let keys = key.split('-');
            let offset = Number(keys[0]);
            let id = Number(keys[1]);
            let ids = this._defineIds[offset];
            if (v) {
                no.addToArray(ids, id);
            } else {
                no.removeFromArray(ids, id);
            }
        }

        let type: number[] = [];
        this._defineIds.forEach((ids, i) => {
            let sum = 0;
            ids.forEach(a => {
                sum += a;
            });
            type[i] = sum;
        });
        this._data.x = -Number(type.join('.'));
    }

    private _updateMesh() {
        const mesh = this.renderComp.mesh,
            pos = mesh.readAttribute(0, AttributeName.ATTR_POSITION),
            normal = mesh.readAttribute(0, AttributeName.ATTR_NORMAL),
            tangents = mesh.readAttribute(0, AttributeName.ATTR_TANGENT);

        let uvs = mesh.readAttribute(0, AttributeName.ATTR_TEX_COORD);
        mesh.updateSubMesh(0, {
            positions: new Float32Array(pos),
            normals: new Float32Array(normal),
            uvs: new Float32Array([this._data.y, this._data.z]),
            tangents: new Float32Array(tangents),
            colors: new Float32Array([this._data.x, this._data.y, this._data.z, 1]),
        });
        this.renderComp.onGeometryChanged();
    }

    lateUpdate() {
        if (!this.renderComp) return;
        this._updateMesh();
    }
}
