
import { ccclass, disallowMultiple, Component, Vec4, Sprite, math, Color } from '../yj';
import { no } from '../no';

/**
 * Predefined variables
 * Name = YJVertexColorTransition
 * DateTime = Sat May 21 2022 10:26:59 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJVertexColorTransition.ts
 * FileBasenameNoExtension = YJVertexColorTransition
 * URL = db://assets/NoUi3/effect/YJVertexColorTransition.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJVertexColorTransition')
@disallowMultiple()
export class YJVertexColorTransition extends Component {

    private renderComp: Sprite;
    /**
     * _data数据说明，
     * x用来存放宏定义的类型，为负值，非负则为正常状态，整数部分为 color相关，小数部分为uv 相关
     * yz用来存放与 一些扩展数据，当 x=0 时用来存放当前 color 的数据
     * w在Sprite.Type ！= SIMPLE 时会被引擎修改，通常，Sprite.Type == SIMPLE 可以使用
    */
    private _data: Vec4 = new Vec4(0, 0, 0, 0);
    private _needUpdate: boolean = false;
    private _defineIds: number[][] = [[], []];
    private _dirtyVersion: number;

    onLoad() {
        if (!this.renderComp)
            this.renderComp = this.getComponent(Sprite);
        if (!this.renderComp) return;
    }

    public setEffect(defines: any, properties?: number[]) {
        if (!this.enabled) return;
        if (!this.renderComp)
            this.renderComp = this.getComponent(Sprite);
        if (!this.renderComp || !defines) return;
        this._needUpdate = true;
        this._setDefines(defines);
        this._setProperties(properties);
        this._updateVB();
    }

    private get opacity(): number {
        //不要用this.renderComp.renderEntity.localOpacity，在h5和原生下这个返回的值不一致
        return this.node._uiProps.localOpacity;
    }

    private _setColor() {
        let c = this.renderComp.color;
        if (this._data.x == 0) {
            this._data.x = c.r / 255;
            this._data.y = c.g / 255;
            this._data.z = c.b / 255;
        } else {
            let rg = c.r * 1000 + c.g, ba = c.b * 1000;
            this._data.y = rg;
            this._data.z = ba;
        }
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
        this._setColor();
    }

    private _updateVB() {
        if (!this.renderComp.renderData) {
            return;
        }
        this._dirtyVersion = this.renderComp._dirtyVersion;
        switch (this.renderComp.type) {
            case Sprite.Type.SIMPLE:
                this._updateSimpleVB();
                break;
            case Sprite.Type.TILED:
                this._updateTiledVB();
                break;
            case Sprite.Type.SLICED:
                this._updateSlicedVB();
                break;
            case Sprite.Type.FILLED:
                if (this.renderComp.fillType === Sprite.FillType.RADIAL) {
                    this._updateRadiaFilledVB();
                } else {
                    this._updateBarFilledVB();
                }
                break;
        }
    }

    lateUpdate() {
        if (!this.renderComp || !this._needUpdate) return;
        if (this.renderComp._dirtyVersion !== this._dirtyVersion) {
            this._updateVB();
        }
    }

    private _updateSimpleVB() {
        const renderData = this.renderComp.renderData;
        if (!renderData || !renderData.chunk) return;
        const vData = renderData.chunk.vb;
        let colorOffset = 5;
        const color = this._data;
        const colorR = color.x;
        const colorG = color.y;
        const colorB = color.z;
        const colorA = this.opacity;
        for (let i = 0; i < 4; i++, colorOffset += renderData.floatStride) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
            vData[colorOffset + 3] = colorA;
        }
    }

    private _updateSlicedVB() {
        const renderData = this.renderComp.renderData!;
        const vData = renderData.chunk.vb;
        const stride = renderData.floatStride;

        let colorOffset = 5;
        const color = this._data;
        const colorR = color.x;
        const colorG = color.y;
        const colorB = color.z;
        const colorA = this.opacity;
        for (let i = 0; i < 16; i++) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
            vData[colorOffset + 3] = colorA;
            colorOffset += stride;
        }
    }

    private _updateTiledVB() {
        const renderData = this.renderComp.renderData!;
        const vData = renderData.chunk.vb;
        const stride = renderData.floatStride;
        const vertexCount = renderData.vertexCount;

        let colorOffset = 5;
        const color = this._data;
        const colorR = color.x;
        const colorG = color.y;
        const colorB = color.z;
        const colorA = this.opacity;
        for (let i = 0; i < vertexCount; i++) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
            vData[colorOffset + 3] = colorA;
            colorOffset += stride;
        }
    }

    private _updateRadiaFilledVB() {
        const renderData = this.renderComp.renderData!;
        const vData = renderData.chunk?.vb || [];
        const stride = renderData.floatStride;
        const vertexCount = renderData.vertexCount;

        let colorOffset = 5;
        const color = this._data;
        const colorR = color.x;
        const colorG = color.y;
        const colorB = color.z;
        const colorA = this.opacity;
        for (let i = 0; i < vertexCount; i++) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
            vData[colorOffset + 3] = colorA;
            colorOffset += stride;
        }
    }

    private _updateBarFilledVB() {
        const renderData = this.renderComp.renderData!;
        const vData = renderData.chunk?.vb || [];
        const stride = renderData.floatStride;
        let colorOffset = 5;
        const color = this._data;
        const colorR = color.x;
        const colorG = color.y;
        const colorB = color.z;
        const colorA = this.opacity;
        for (let i = 0; i < 4; i++) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
            vData[colorOffset + 3] = colorA;
            colorOffset += stride;
        }
    }
}
