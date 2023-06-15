import * as _cc from 'cc';
import * as env from 'cc/env';
import { AssetInfo } from './@types/packages/asset-db/@types/public';

export const { ccclass, property, executeInEditMode, requireComponent } = _cc._decorator;
export const { DEBUG, WECHAT, EDITOR } = env;

export type _AssetInfo = AssetInfo;
export interface Component extends _cc.Component { };
export class Component extends _cc.Component { };
export class EventHandler extends _cc.EventHandler { };
export class Node extends _cc.Node { };
export class Color extends _cc.Color { };
export class Vec2 extends _cc.Vec2 { };

export let Asset = _cc.Asset;
export type Asset = _cc.Asset;
export let ImageAsset = _cc.ImageAsset;
export type ImageAsset = _cc.ImageAsset;
export let AudioClip = _cc.AudioClip;
export type AudioClip = _cc.AudioClip;
export let JsonAsset = _cc.JsonAsset;
export type JsonAsset = _cc.JsonAsset;
export let Material = _cc.Material;
export type Material = _cc.Material;
export let Prefab = _cc.Prefab;
export type Prefab = _cc.Prefab;
export let SpriteAtlas = _cc.SpriteAtlas;
export type SpriteAtlas = _cc.SpriteAtlas;
export let TextAsset = _cc.TextAsset;
export type TextAsset = _cc.TextAsset;
export let EffectAsset = _cc.EffectAsset;
export type EffectAsset = _cc.EffectAsset;
export let BufferAsset = _cc.BufferAsset;
export type BufferAsset = _cc.BufferAsset;
export let AnimationClip = _cc.AnimationClip;
export type AnimationClip = _cc.AnimationClip;
export let Texture2D = _cc.Texture2D;
export type Texture2D = _cc.Texture2D;
export let SkeletonData = _cc.sp.SkeletonData;
export type SkeletonData = _cc.sp.SkeletonData;
export let SpriteFrame = _cc.SpriteFrame;
export type SpriteFrame = _cc.SpriteFrame;
export let Font = _cc.Font;
export type Font = _cc.Font;

export class Rect extends _cc.Rect { };
export class Size extends _cc.Size { };
export class Vec3 extends _cc.Vec3 { };
export let UITransform = _cc.UITransform;
export let UIOpacity = _cc.UIOpacity;

export class Quat extends _cc.Quat { };
export class EventTarget extends _cc.EventTarget { };
export class Button extends _cc.Button { };
export class Tween extends _cc.Tween<unknown> { };
export class Bundle extends _cc.AssetManager.Bundle { };
export class AssetManager extends _cc.AssetManager { };
export class Scheduler extends _cc.Scheduler { };

export const macro = _cc.macro;
export const isValid = _cc.isValid;
export const random = _cc.random;
export const sys = _cc.sys;
export const view = _cc.view;
export const __private = _cc.__private;
export const js = _cc.js;
export const tween = _cc.tween;
export const v2 = _cc.v2;
export const v3 = _cc.v3;
export const director = _cc.director;
export const instantiate = _cc.instantiate;
export const assetManager = _cc.assetManager;
export const game = _cc.game;
export const color = _cc.color;