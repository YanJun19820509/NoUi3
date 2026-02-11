/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 11:52:01 GMT+0800 (中国标准时间)
 *
 */

import { FixedSizeArray } from "./FixedSizeArray";

export namespace dataObjectPool {
    export class DataObjectPool {
        private cacheMap: Map<string, FixedSizeArray<any>>;
        private static _ins: DataObjectPool = null;

        public static ins(): DataObjectPool {
            if (!this._ins) this._ins = new DataObjectPool();
            return this._ins;
        }

        constructor() {
            this.cacheMap = new Map<string, FixedSizeArray<any>>();
        }

        public get(type: string): any {
            if (this.cacheMap.has(type)) {
                return this.cacheMap.get(type).shift();
            }
            return null;
        }

        public put(type: string, data: any) {
            if (!this.cacheMap.has(type)) {
                this.cacheMap.set(type, new FixedSizeArray<any>(100));
            }
            this.cacheMap.get(type).push(data);
        }

        public clearByType(type: string) {
            if (this.cacheMap.has(type)) {
                this.cacheMap.get(type).clear();
                this.cacheMap.delete(type);
            }
        }

        public clear() {
            this.cacheMap.forEach((v, k) => {
                this.clearByType(k);
            });
            this.cacheMap.clear();
        }

    }
}