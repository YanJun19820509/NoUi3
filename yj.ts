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
export class AnimationClip extends _cc.AnimationClip { };
export class Asset extends _cc.Asset { };
export class ImageAsset extends _cc.ImageAsset { };
export class Scheduler extends _cc.Scheduler { };
export class AudioClip extends _cc.AudioClip { };
export class JsonAsset extends _cc.JsonAsset { };
export class Material extends _cc.Material { };
export let Prefab = _cc.Prefab;
export type Prefab = _cc.Prefab;
export class Rect extends _cc.Rect { };
export class Size extends _cc.Size { };
export class SpriteAtlas extends _cc.SpriteAtlas { };
export class SpriteFrame extends _cc.SpriteFrame { };
export class TextAsset extends _cc.TextAsset { };
export class TiledMapAsset extends _cc.TiledMapAsset { };
export class Vec3 extends _cc.Vec3 { };
export let UITransform = _cc.UITransform;
export class UIOpacity extends _cc.UIOpacity { };
export class Quat extends _cc.Quat { };
export class EventTarget extends _cc.EventTarget { };
export let EffectAsset = _cc.EffectAsset;
export type EffectAsset = _cc.EffectAsset;
export class Font extends _cc.Font { };
export class Button extends _cc.Button { };
export class BufferAsset extends _cc.BufferAsset { };
export class Texture2D extends _cc.Texture2D { };
export class Tween extends _cc.Tween<unknown> { };
export class Bundle extends _cc.AssetManager.Bundle { };
export class SkeletonData extends _cc.sp.SkeletonData { };
export class AssetManager extends _cc.AssetManager { };

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