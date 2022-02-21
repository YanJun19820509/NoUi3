// import { dynamicAtlasManager } from "cc";

// /**
//  * 临时动态合图管理器
//  */
// export class TmpAtlasManager {
//     private static _excludes = [];
//     private _duration = 3;
//     private _canCreate = true;

//     private static _ins: TmpAtlasManager;
//     public static get ins(): TmpAtlasManager {
//         if (!this._ins) {
//             this._ins = new TmpAtlasManager();
//         }
//         return this._ins;
//     }

//     /**
//      * 添加不需要创建合图的界面
//      * @param name
//      */
//     public static addExclude(name: string) {
//         this._excludes[this._excludes.length] = name;
//     }

//     /**
//      * 临时动态合图数量
//      */
//     public get tmpAtlasNum(): number {
//         if (!this._enable) { return 0; }
//         return dynamicAtlasManager['tmpAtlasNum'];
//     }
//     /**
//      * 创建临时动态合图
//      */
//     public create(type: string, bigger = 1) {
//         if (!this._cd()) { return; }
//         if (!this._enable || TmpAtlasManager._excludes.indexOf(type) != -1) { return; }
//         if (!dynamicAtlasManager['tmpAtlasByName'](type)) {
//             dynamicAtlasManager['setTmpAtlas'](type, bigger);
//             console.error(`setTmpAtlas${this.tmpAtlasNum}---${type}`);
//         }
//     }
//     /**
//      * 删除临时动态合图
//      */
//     public remove(type: string) {
//         this._remove(type);
//     }

//     private _remove(type: string) {
//         if (!type || !this._enable || TmpAtlasManager._excludes.indexOf(type) != -1) { return; }
//         console.error(`removeTmpAtlas${this.tmpAtlasNum}---${type}`);
//         dynamicAtlasManager['removeTmpAtlas'](type);
//         console.error(`currentAtlasName---${dynamicAtlasManager['currentAtlasName']}`);
//     }

//     private _cd(): boolean {
//         if (!this._canCreate) {
//             return false;
//         }
//         this._canCreate = false;
//         setTimeout(() => {
//             this._canCreate = true;
//         }, this._duration * 1000);
//         return true;
//     }

//     private get _enable(): boolean {
//         return dynamicAtlasManager['setTmpAtlas'] != undefined && dynamicAtlasManager.enabled;;
//     }
// }
