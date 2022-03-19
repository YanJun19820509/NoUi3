// import { _decorator, Label, Material, RenderComponent, Sprite, Vec4 } from 'cc';
// import { no } from '../no';
// import { FuckUi } from './FuckUi';
// const { ccclass, menu } = _decorator;

// /**
//  * Predefined variables
//  * Name = NewComponent
//  * DateTime = Fri Jan 14 2022 16:39:07 GMT+0800 (中国标准时间)
//  * Author = mqsy_yj
//  * FileBasename = NewComponent.ts
//  * FileBasenameNoExtension = NewComponent
//  * URL = db://assets/Script/NoUi3/fuckui/NewComponent.ts
//  * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
//  *
//  */

// @ccclass('SetShader')
// @menu('NoUi/ui/SetShader(设置shader:{path:string,properties:{}})')
// export class SetShader extends FuckUi {
//     private _renderComp: RenderComponent;
//     private _loaded: boolean = false;

//     protected onDataChange(data: any) {
//         if (!this._renderComp) {
//             this._renderComp = this.getComponent(RenderComponent);
//             if (!this._renderComp) return;
//         }
//         let { path, properties, defines, states }: { path: string, properties: {}, defines: {}, states: {} } = data;
//         this.setMaterial(path, properties, defines, states);
//     }

//     public work() {
//         if (!this._loaded) {
//             this.scheduleOnce(() => {
//                 this.work();
//             }, 0);
//             return;
//         }
//         this.setOriginalSize(this._renderComp.material);
//     }

//     private setMaterial(path: string, properties: any, defines: any, states: any) {
//         if (path) {
//             no.assetBundleManager.loadMaterial(path, (item: Material) => {
//                 this._renderComp.material = item;
//                 this.setProperties(this._renderComp.material, properties, defines, states);
//             });
//         } else {
//             let m = this._renderComp.getMaterial(0);
//             this.setProperties(m, properties, defines, states);
//         }
//     }

//     private setProperties(material: Material, properties = {}, defines: any, states: any) {
//         for (const key in properties) {
//             if (material.getProperty(key, 0) !== undefined)
//                 material.setProperty(key, properties[key]);
//         }
//         if (defines) {
//             material.recompileShaders(defines);
//         }
//         if (states) {
//             material.overridePipelineStates(states);
//         }
//         this._loaded = true;
//     }

//     //对于合图内的纹理，需要重新计算纹理在合图内的宽高并传给材质中的shader
//     private setOriginalSize(material: Material) {
//         let a: Sprite = this.getComponent(Sprite);
//         if (a) {
//             let sf = a.spriteFrame;
//             if (!sf['_original']) {
//                 return;
//             }
//             this.caculateFact(material, sf);
//         } else {
//             let b: Label = this.getComponent(Label);
//             if (b) {
//                 let f = b['_frame'];
//                 if (!f['_original']) {
//                     return;
//                 }
//                 this.caculateFact(material, f);
//             }
//         }
//     }

//     private caculateFact(material: Material, f: any) {
//         let rect = f._rect;
//         let texture = f._texture;
//         let w = f.isRotated() ? rect.height : rect.width;
//         let h = f.isRotated() ? rect.width : rect.height;
//         material.setProperty('factRect', new Vec4(rect.x / texture.width, rect.y / texture.height, w / texture.width, h / texture.height));
//         material.setProperty('ratio', texture.width / texture.height);
//     }
// }
