
import { ccclass, disallowMultiple, Component, Vec4, Sprite, math, Color, JSB } from '../yj';
import { no } from '../no';
import { singleObject } from 'NoUi3/types';

/**
 * Predefined variables
 * Name = YJVertexColorTransitionManager
 * DateTime = Sat May 21 2022 10:26:59 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJVertexColorTransitionManager.ts
 * FileBasenameNoExtension = YJVertexColorTransitionManager
 * URL = db://assets/NoUi3/effect/YJVertexColorTransitionManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

class YJVertexColorTransitionData {
    public renderComp: Sprite;

    /**
     * _data数据说明，
     * x用来存放宏定义的类型，为负值，非负则为正常状态，整数部分为 color相关，小数部分为uv 相关
     * yz用来存放与 一些扩展数据，当 x=0 时用来存放当前 color 的数据
     * w在Sprite.Type ！= SIMPLE 时会被引擎修改，通常，Sprite.Type == SIMPLE 可以使用
    */
    private _data: Vec4 = new Vec4(0, 0, 0, 0);
    private _needUpdate: boolean = false;
    private _defineIds: number[][] = [[], []];
    private _dirtyVersion: number = 0;
    private _updateColorLate: Function;
    private _uuid: string = '';

    constructor(renderComp: Sprite) {
        this.renderComp = renderComp;
        this._uuid = renderComp.uuid;
        //hack tiled 的updateColorLate方法
        this._updateColorLate = this.renderComp['_assembler'].updateColorLate;
        this.renderComp['_assembler'].updateColorLate = function () { };
    }

    public setEffect(defines: any, properties?: number[]) {
        if (!this.renderComp || !defines) return;
        this._needUpdate = true;
        this._setDefines(defines);
        this._setProperties(properties);
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

    public lateUpdate() {
        if (!this.renderComp?.node?.isValid) {
            YJVertexColorTransitionManager.ins().remove(this._uuid);
            return;
        }
        if (!this._needUpdate) return;
        if (this.renderComp._dirtyVersion !== this._dirtyVersion || JSB) {
            this._updateVB();
        }
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
                    this._updateRadialFilledVB();
                } else {
                    this._updateBarFilledVB();
                }
                break;
        }
    }

    private _updateSimpleVB() {
        const renderData = this.renderComp.renderData;
        if (!renderData || !renderData.chunk) return;
        const vData = renderData.chunk?.vb || [];
        let colorOffset = 5;
        const color = this._data;
        const colorR = color.x;
        const colorG = color.y;
        const colorB = color.z;
        // const colorA = this.opacity;
        for (let i = 0; i < 4; i++, colorOffset += renderData.floatStride) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
            // vData[colorOffset + 3] = colorA;
        }
    }

    private _updateSlicedVB() {
        const renderData = this.renderComp.renderData!;
        const vData = renderData.chunk?.vb || [];
        const stride = renderData.floatStride;

        let colorOffset = 5;
        const color = this._data;
        const colorR = color.x;
        const colorG = color.y;
        const colorB = color.z;
        // const colorA = this.opacity;
        for (let i = 0; i < 16; i++) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
            // vData[colorOffset + 3] = colorA;
            colorOffset += stride;
        }
    }

    private _updateTiledVB() {
        const renderData = this.renderComp.renderData!;
        if (!renderData.chunk) {
            return;
        }
        this._updateColorLate?.call(renderData['_assembler'], this.renderComp);
        const vData = renderData.chunk.vb;
        const stride = renderData.floatStride;
        const vertexCount = renderData.vertexCount;

        let colorOffset = 5;
        const color = this._data;
        const colorR = color.x;
        const colorG = color.y;
        const colorB = color.z;
        // const colorA = this.opacity;
        for (let i = 0; i < vertexCount; i++) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
            // vData[colorOffset + 3] = colorA;
            colorOffset += stride;
        }
    }

    private _updateRadialFilledVB() {
        const renderData = this.renderComp.renderData!;
        const vData = renderData.chunk?.vb || [];
        const stride = renderData.floatStride;
        const vertexCount = renderData.vertexCount;

        let colorOffset = 5;
        const color = this._data;
        const colorR = color.x;
        const colorG = color.y;
        const colorB = color.z;
        // const colorA = this.opacity;
        for (let i = 0; i < vertexCount; i++) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
            // vData[colorOffset + 3] = colorA;
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
        // const colorA = this.opacity;
        for (let i = 0; i < 4; i++) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
            // vData[colorOffset + 3] = colorA;
            colorOffset += stride;
        }
    }
}

@ccclass('YJVertexColorTransitionManager')
@singleObject()
export class YJVertexColorTransitionManager extends no.SingleObject {
    private list: YJVertexColorTransitionData[] = [];
    private removeList: string[] = [];

    public static ins(): YJVertexColorTransitionManager {
        return super.instance() as YJVertexColorTransitionManager;
    }

    public add(renderComp: Sprite, defines: any, properties?: number[]) {
        let data = no.itemOfArray<YJVertexColorTransitionData>(this.list, renderComp.uuid, 'uuid');
        if (data) {
            data.setEffect(defines, properties);
        } else {
            data = new YJVertexColorTransitionData(renderComp);
            data.setEffect(defines, properties);
            this.list.push(data);
        }
    }

    public remove(uuid: string);
    public remove(renderComp: Sprite);
    public remove(a: string | Sprite) {
        const uuid = typeof a === 'string' ? a : a.uuid;
        this.removeList.push(uuid);
    }

    public clear(): void {
        this.list.length = 0;
        this.removeList.length = 0;
    }

    public lateUpdate() {
        if (this.removeList.length > 0) {
            for (let i = this.list.length - 1; i >= 0; i--) {
                if (this.removeList.includes(this.list[i].renderComp.uuid)) {
                    this.list.splice(i, 1);
                } else {
                    this.list[i].lateUpdate();
                }
            }
            this.removeList.length = 0;
        } else {
            this.list.forEach(item => {
                item.lateUpdate();
            });
        }
    }
}