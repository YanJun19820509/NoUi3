import { IUV, Texture2D } from 'cc';
import { FuckUi } from './fuckui/FuckUi';
import { SetMoveAlongWithPath } from './fuckui/SetMoveAlongWithPath';

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