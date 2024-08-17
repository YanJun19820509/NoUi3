
// import { ccclass, property, Component } from '../../yj';
// import { YJLoadAssets3D } from '../editor/YJLoadAssets3D';
// import { SetSpriteFrameInSampler3D } from '../fuckui/SetSpriteFrameInSampler3D';

// /**
//  * Predefined variables
//  * Name = YJShowSpriteFrameInSample3D
//  * DateTime = Mon Nov 28 2022 18:48:00 GMT+0800 (中国标准时间)
//  * Author = mqsy_yj
//  * FileBasename = YJShowSpriteFrameInSample3D.ts
//  * FileBasenameNoExtension = YJShowSpriteFrameInSample3D
//  * URL = db://assets/NoUi3/engine/YJShowSpriteFrameInSample3D.ts
//  * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
//  *
//  */
// //用来控制使用SetSpriteFrameInSample3D的Sprite显示/隐藏默认spriteFrame
// @ccclass('YJShowSpriteFrameInSample3D')
// export class YJShowSpriteFrameInSample3D extends Component {
//     @property
//     public get showSpriteFrame(): boolean {
//         return false;
//     }

//     public set showSpriteFrame(v: boolean) {
//         this.showSubSpriteFrame(true);
//     }
//     @property
//     public get hideSpriteFrame(): boolean {
//         return false;
//     }

//     public set hideSpriteFrame(v: boolean) {
//         this.showSubSpriteFrame(false);
//     }

//     private async showSubSpriteFrame(v: boolean) {
//         if (v) {
//             await this.getComponent(YJLoadAssets3D).load();
//         }
//         let list: SetSpriteFrameInSampler3D[] = this.getComponentsInChildren(SetSpriteFrameInSampler3D);
//         list.forEach(a => {
//             if (v) a.resetSprite();
//             else a.removeSprite();
//         });
//     }
// }
