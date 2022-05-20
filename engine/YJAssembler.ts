
import { gfx, UI } from 'cc';
const { Attribute, Format, AttributeName } = gfx;
const { spriteAssembler} = UI;

/**
 * Predefined variables
 * Name = YJ
 * DateTime = Sat May 21 2022 00:01:16 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJ.ts
 * FileBasenameNoExtension = YJ
 * URL = db://assets/Script/NoUi3/engine/YJ.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

export const vfmtPosUvExt = [
    new Attribute(AttributeName.ATTR_POSITION, Format.RGB32F),
    new Attribute(AttributeName.ATTR_TEX_COORD, Format.RG32F),
    new Attribute('a_ext', Format.RGBA32F),
];

export const YJAssembler: spriteAssembler = {

};