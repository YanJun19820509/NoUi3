import { _decorator, ValueType, math } from 'cc';
import { Texture2D } from 'cc';
import { FuckUi } from './fuckui/FuckUi';
import { SetMoveAlongWithPath } from './fuckui/SetMoveAlongWithPath';
import { no } from './no';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = types
 * DateTime = Mon Jun 20 2022 15:06:43 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = types.ts
 * FileBasenameNoExtension = types
 * URL = db://assets/NoUi3/types.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

export interface IUV {
    u: number;
    v: number;
}

export enum AlignType {
    None = 0,
    Top,
    Middle,
    Bottom,
    Left,
    Center,
    Right
};

export enum SimpleValueType {
    String = 0,
    Number,
    Boolean,
    Array,
    Object
};

export type CreateSpritemFrameSFData = { url: string, x: number, y: number, atlas?: string };

export type CreateSpritemFrameLabelData = {
    string: string,
    x: number,
    y: number
    size?: number,
    font?: string,
    color?: string,
    letterSpacing?: number,
    italic?: boolean,
    bold?: boolean,
    outlineColor?: string,
    outlineWidth?: number,
    shadowColor?: string,
    shadowOffset?: number[],
    shadowBlur?: number
};

export type CreateSpritemFrameData = {
    width: number,
    height: number,
    spriteFrames: CreateSpritemFrameSFData[],
    labels: CreateSpritemFrameLabelData[]
};

export type PackedFrameData = { x: number, y: number, w: number, h: number, rotate: boolean, texture: Texture2D };

export type FuckUiComponent = FuckUi;
export type _SetMoveAlongWithPath = SetMoveAlongWithPath;
export type SpriteFrameDataType = { uuid: string, x: number, y: number, width: number, height: number, uv: number[], unbiasUV: number[], uvSliced: IUV[], capInsets: number[] };

@ccclass('Range')
export class Range {
    @property({ step: 1 })
    min: number = 0;
    @property({ step: 1 })
    max: number = 0;

    constructor(min = 0, max = 0) {
        this.min = min;
        this.max = max;
    }

    clone(): Range {
        return new Range(this.min, this.max);
    }

    equals(other: Range): boolean {
        return this.min == other.min && this.max == other.max;
    }

    set(other: Range): void;
    set(min?: number, max?: number): void;
    set(other: Range | number, max?: number) {
        if (typeof other == 'number') {
            this.min = other;
        } else {
            this.min = other.min;
            max = other.max;
        }
        if (max != null)
            this.max = max;
    }
    toString(): string {
        return `min=${this.min},max=${this.max}`;
    }

    get randomValue(): number {
        return no.randomBetween(this.min, this.max);
    }
}

@ccclass('UV')
export class UV {
    @property({ step: 1 })
    u: number = 0;
    @property({ step: 1 })
    v: number = 0;

    constructor(u = 0, v = 0) {
        this.u = u;
        this.v = v;
    }

    clone(): UV {
        return new UV(this.u, this.v);
    }

    equals(other: UV): boolean {
        return this.u == other.u && this.v == other.v;
    }

    set(other: UV): void;
    set(u?: number, v?: number): void;
    set(other: UV | number, v?: number) {
        if (typeof other == 'number') {
            this.u = other;
        } else {
            this.u = other.u;
            v = other.v;
        }
        if (v != null)
            this.v = v;
    }
    toString(): string {
        return `u=${this.u},max=${this.v}`;
    }
}