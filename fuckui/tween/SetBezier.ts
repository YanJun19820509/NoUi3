
// import { _decorator, Component, Node, Tween, tween, bezier, bezierByTime } from 'cc';
// import { SetNodeTweenAction } from '../fuckui/SetNodeTweenAction';
// const { ccclass, menu } = _decorator;

// /**
//  * Predefined variables
//  * Name = SetBezier
//  * DateTime = Fri Jan 14 2022 18:35:36 GMT+0800 (中国标准时间)
//  * Author = mqsy_yj
//  * FileBasename = SetBezier.ts
//  * FileBasenameNoExtension = SetBezier
//  * URL = db://assets/Script/NoUi3/tween/SetBezier.ts
//  * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
//  *
//  */

// /**
//  * 设置贝塞尔曲线动效
//  * @data {
//  * delay?: 1,
// *      duration: 1,
// *      to_by?: 'to',
// *      points: [Vec2,Vec2,Vec2],
// *      repeat?: 0
//  * }
//  */
// @ccclass('SetBezier')
// @menu('NoUi/tween/SetBezier(贝塞尔曲线动效:object)')
// export class SetBezier extends SetNodeTweenAction {
//     protected createAction(data: any): Tween<Node> {
//         let a = tween(this.node);
//         if (data.delay) {
//             a = a.delay(data.delay);
//         }
//         if (data.to_by == 'by') {
//             a = a.bezierBy(data.duration, data.points[0], data.points[1], data.points[2]);
//         } else {
//             a = a.bezierTo(data.duration, data.points[0], data.points[1], data.points[2]);
//         }
//         if (data.repeat != undefined) {
//             a = a.repeat(data.repeat || 999);
//         }
//         return a;
//     }
// }