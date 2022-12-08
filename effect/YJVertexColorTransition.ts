
import { _decorator, Component, RenderComponent, Vec4, Sprite, Label, math, BitmapFont, UIOpacity } from 'cc';
import { no } from '../no';
const { ccclass, property, disallowMultiple } = _decorator;

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

    private renderComp: RenderComponent;
    /**
     * _data数据说明，
     * x用来存放宏定义的类型，为负值，非负则为正常状态，整数部分为 color相关，小数部分为uv 相关
     * yz用来存放与 一些扩展数据，当 x=0 时用来存放当前 color 的数据
     * w在Sprite.Type ！= SIMPLE 时会被引擎修改，通常，Sprite.Type == SIMPLE 可以使用
    */
    private _data: Vec4 = new Vec4(0, 0, 0, 0);
    private _needUpdate: boolean = false;
    private _originColor: math.Color;
    private _defineIds: number[][] = [[], []];

    onLoad() {
        if (!this.renderComp)
            this.renderComp = this.getComponent(RenderComponent);
        if (!this.renderComp) return;
    }

    public setEffect(defines: any, properties?: number[]) {
        if (!this.renderComp)
            this.renderComp = this.getComponent(RenderComponent);
        if (!this.renderComp || !defines) return;

        this._setDefines(defines);
        this._setProperties(properties);
        this._updateVB();
    }

    private _setColor() {
        let c = this.renderComp.color;
        let opacity = no.getComponentInParents<UIOpacity>(this.node, UIOpacity)?.opacity;
        if (opacity == null) opacity = 255;
        if (this._data.x == 0) {
            this._data.x = c.r / 255;
            this._data.y = c.g / 255;
            this._data.z = c.b / 255;
            this._data.w = opacity / 255;
        } else {
            let rg = c.r * 1000 + c.g, ba = c.b * 1000 + opacity;
            this._data.y = rg;
            this._data.z = ba;
            this._data.w = opacity / 255;
        }
    }

    private _setProperties(properties: number[]) {
        if (!properties) return;
        this._data.y = properties[0] || this._data.y;
        this._data.z = properties[1] || this._data.z;
    }

    private _setBMFontGray(v: boolean) {
        //bmfont的顶点数据无法修改，通过改变color来实现bmfont置灰效果
        if (!this._originColor) this._originColor = this.renderComp.color.clone();
        let opacity = this.getComponent(UIOpacity)?.opacity;
        if (opacity == null) opacity = 255;
        this._originColor.a = opacity;
        if (v) {
            let gray = 0.3 * this._originColor.r + 0.29 * this._originColor.g + 0.07 * this._originColor.b;
            this.renderComp.color = math.color(gray, gray, gray, this._originColor.a);
        } else this.renderComp.color = this._originColor;
    }

    private _setDefines(defines: any) {
        for (let key in defines) {
            let v = defines[key];
            if (key == 'IS_GRAY') key = '0-2';
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
        // if (this.renderComp instanceof Label && this.renderComp.font instanceof BitmapFont && offset == 0 && id == 2) {
        //     this._setBMFontGray(v);
        //     return;
        // }
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
            this._needUpdate = true;
            return;
        }
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
