/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 11:50:27 GMT+0800 (中国标准时间)
 *
 */

import { macro } from "../yj";

export namespace canvasPool {
    /**
    * 共享标签数据接口，存储canvas及其上下文
    */
    interface ISharedLabelData {
        canvas: HTMLCanvasElement;
        context: CanvasRenderingContext2D | null;
    }

    /**
     * Canvas缓存池管理类（单例模式）
     * 用于复用canvas对象，减少内存分配开销
     */
    class CanvasPool {
        private static _instance: CanvasPool;
        static getInstance(): CanvasPool {
            if (!this._instance) {
                this._instance = new CanvasPool();
            }
            return this._instance;
        }

        /** 缓存对象池 */
        public pool: ISharedLabelData[] = [];

        /**
         * 从缓存池获取canvas对象
         * @returns 可用的canvas数据对象（新建或复用）
         * @example
         * const data = canvasPool.get();
         * const ctx = data.context;
         * ctx.fillText("Hello", 10, 10);
         */
        public get() {
            let data = this.pool.pop();

            if (!data) {
                const canvas = window.document.createElement('canvas');
                const context = canvas.getContext('2d');
                data = {
                    canvas,
                    context,
                };
            }
            else {
                // 复用前清空画布内容
                data.context.clearRect(0, 0, data.canvas.width, data.canvas.height);
            }
            return data;
        }

        /**
         * 归还canvas对象到缓存池
         * @param canvas 要回收的canvas数据对象
         * @example
         * // 使用完成后归还
         * canvasPool.put(usedData);
         * 
         * // 当缓存池已满时直接丢弃
         * if (canvasPool.pool.length < MAX_SIZE) {
         *     canvasPool.put(data);
         * }
         */
        public put(canvas: ISharedLabelData) {
            if (this.pool.length >= macro.MAX_LABEL_CANVAS_POOL_SIZE) {
                return;
            }
            this.pool.push(canvas);
        }
    }

    /**
     * 导出的canvas缓存池单例实例
     * @example
     * // 直接使用实例
     * const pool = canvasPool;
     * const tempCanvas = pool.get();
     */
    export const canvasPool: CanvasPool = CanvasPool.getInstance();
}