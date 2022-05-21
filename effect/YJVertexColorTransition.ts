
import { _decorator, Component, RenderComponent, Vec4, gfx, Sprite } from 'cc';
const { ccclass, property } = _decorator;

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

export enum YJEffectUniformType {
    IS_GRAY = 'IS_GRAY',
};

enum EffectTypeOffset {
    IS_GRAY = 0,
}

@ccclass('YJVertexColorTransition')
export class YJVertexColorTransition extends Component {
    @property
    test: boolean = false;

    private renderComp: RenderComponent;
    private _data: Vec4 = new Vec4(0, 111111111.11111111, 0, 0);
    private _needUpdate: boolean = false;

    onLoad() {
        this.renderComp = this.getComponent(RenderComponent);
        if (!this.renderComp) return;
        this._setNormalColor();
        this._setGray(this.test)
    }

    public setEffect(defines: any, properties: any) {
        for (const key in defines) {
            switch (key) {
                case YJEffectUniformType.IS_GRAY:
                    this._setGray(defines[key]);
                    break;
            }
        }
        this._setProperties(properties);
    }

    private _setNormalColor() {
        let c = this.renderComp.color;
        let rgba = c.r * 1000000000 + c.g * 1000000 + c.b * 1000 + c.a;
        this._data.x = (rgba + 0.222222) / 1000000000000;
        this._data.w = c.a / 255;
        this._needUpdate = true;
    }

    private _setProperties(properties: any) {

        this._needUpdate = true;
    }

    private _setGray(v: boolean) {
        let type = `${this._data.y}`.split('');
        type[EffectTypeOffset.IS_GRAY] = v ? '2' : '1';
        this._data.y = Number(type.join(''));
        this._needUpdate = true;
    }

    private _updateVB() {
        if (!this.renderComp)
            this.renderComp = this.getComponent(RenderComponent);
        if (!this.renderComp) return;
        if (this.renderComp instanceof Sprite) {
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
        } else {
            this._updateSimpleVB();
        }
    }

    lateUpdate() {
        if (!this._needUpdate) return;
        this._needUpdate = false;
        this._updateVB();
    }

    private _updateSimpleVB() {
        let renderData = this.renderComp.renderData;
        if (!renderData || !renderData.chunk) return;
        let vData = renderData.chunk.vb;
        let colorOffset = 5;
        let color = this._data;
        let colorR = color.x;
        let colorG = color.y;
        let colorB = color.z;
        let colorA = color.w;
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
        const colorA = this.renderComp.node._uiProps.opacity;
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
        const colorA = this.renderComp.node._uiProps.opacity;
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
        const vData = renderData.chunk.vb;
        const stride = renderData.floatStride;
        const vertexCount = renderData.vertexCount;

        let colorOffset = 5;
        const color = this._data;
        const colorR = color.x;
        const colorG = color.y;
        const colorB = color.z;
        const colorA = this.renderComp.node._uiProps.opacity;
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
        const vData = renderData.chunk.vb;
        const stride = renderData.floatStride;
        let colorOffset = 5;
        const color = this._data;
        const colorR = color.x;
        const colorG = color.y;
        const colorB = color.z;
        const colorA = this.renderComp.node._uiProps.opacity;
        for (let i = 0; i < 4; i++) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
            vData[colorOffset + 3] = colorA;

            colorOffset += stride;
        }
    }
}
