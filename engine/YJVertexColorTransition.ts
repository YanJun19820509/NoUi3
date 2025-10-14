
import { ccclass, disallowMultiple, Component, Vec4, Sprite, math, Color, JSB, executeInEditMode } from '../yj';
import { no } from '../no';
import { singleObject } from '../types';

/**
 * Predefined variables
 * Name = YJVertexColorTransitionManager
 * DateTime = Sat May 21 2022 10:26:59 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJVertexColorTransitionManager.ts
 * FileBasenameNoExtension = YJVertexColorTransitionManager
 * URL = db://assets/common/effect/YJVertexColorTransitionManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

class YJVertexColorTransitionData {
    public renderComp: Sprite;

    /**
     * _data数据说明，
     * x用来存放宏定义的类型，为负值，非负则为正常状态，整数部分为 color相关，小数部分为uv 相关
     * yz用来存放与 一些扩展数据，当 x=0 时用来存放当前 color 的数据
     * w在Sprite.Type ！= SIMPLE 时会被引擎修改，通常，Sprite.Type == SIMPLE 可以使用
    */
    private _data: Vec4 = new Vec4(0, 0, 0, 0);
    private _needUpdate: boolean = false;
    private _defineIds: number[][] = [[], []];
    private _dirtyVersion: number = 0;
    private _updateColorLate: Function;
    private _uuid: string = '';

    constructor(renderComp: Sprite) {
        this.renderComp = renderComp;
        this._uuid = renderComp.uuid;
        if (this.renderComp['_assembler']) {
            //hack tiled 的updateColorLate方法
            this._updateColorLate = this.renderComp['_assembler'].updateColorLate;
            this.renderComp['_assembler'].updateColorLate = function () { };
        }
    }

    /**
     * 设置顶点颜色过渡效果
     * @param defines 宏定义配置对象（格式：{ '宏分组-宏ID': 启用状态 }）
     * @param properties 扩展属性数组（可选，用于传递自定义参数）
     * @example
     * // 设置溶解效果：
     * setEffect({ '0-1': true }, [500, 300]);
     * // 启用颜色渐变+UV动画：
     * setEffect({ 
     *   '0-2': true,  // 颜色渐变宏
     *   '1-3': true   // UV动画宏
     * });
     */
    public setEffect(defines: any, properties?: number[]) {
        if (!this.renderComp || !defines) return;
        this._needUpdate = true;  // 标记需要更新顶点缓冲区
        this._dirtyVersion = 0;   // 重置脏数据版本
        this._setDefines(defines); // 处理着色器宏定义
        this._setProperties(properties); // 设置扩展属性
    }

    /**
     * 更新颜色数据到顶点缓冲区
     * @description
     * - 当_data.x为0时存储原始RGB颜色值（归一化到0-1）
     * - 非0时使用压缩存储格式（R通道存类型，G通道存RG组合，B通道存B值）
     * @example
     * // 原始颜色模式：
     * color = new Color(255, 128, 64) → _data = [0, 1.0, 0.5, 0.25]
     * // 压缩颜色模式：
     * color = new Color(200, 100, 50) → _data = [-1.2, 200100, 50000]
     */
    private _setColor() {
        let c = this.renderComp.color;
        if (this._data.x == 0) {
            // 初始状态直接存储归一化颜色值
            this._data.x = c.r / 255;
            this._data.y = c.g / 255;
            this._data.z = c.b / 255;
        } else {
            // 压缩存储格式：R通道存类型，G通道存(r*1000 + g)，B通道存(b*1000)
            let rg = c.r + c.g / 1000, ba = c.b;
            this._data.y = rg;
            this._data.z = ba;
        }
    }

    /**
     * 设置扩展效果参数
     * @param properties 参数数组 [参数1, 参数2]
     * @description 
     * - properties[0] 通常用于控制效果强度（如溶解阈值）
     * - properties[1] 通常用于控制动画速度（如UV滚动速度）
     * @example
     * // 设置溶解阈值为0.7，滚动速度为2.5：
     * _setProperties([700, 2500]);
     */
    private _setProperties(properties: number[]) {
        if (!properties) return;
        this._data.y = properties[0] || this._data.y; // 保留原有值如果未传入新参数
        this._data.z = properties[1] || this._data.z;
    }

    /**
     * 配置着色器宏定义
     * @param defines 宏定义对象（格式：{ '分组索引-宏ID': 启用状态 }）
     * @description
     * - 键名格式：'分组索引-宏ID'（如'0-1'表示第0组第1个宏）
     * - 分组索引对应着浮点数的整数部分与小数部分（0: 整数部分，1: 小数部分）
     * - 宏ID是具体的数值
     * - 最终会合并为_data.x的浮点数形式（如0-1 → -1.0，1-2 → -0.2，两个定义合起来 → -1.2）
     * @example
     * // 启用第0组第1个宏和第1组第3个宏：
     * _setDefines({ 
     *   '0-1': true, 
     *   '1-3': true 
     * });
     */
    private _setDefines(defines: any) {
        // 处理每个宏定义
        for (let key in defines) {
            let v = defines[key];
            let keys = key.split('-');
            let offset = Number(keys[0]); // 分组索引
            let id = Number(keys[1]);     // 宏ID
            let ids = this._defineIds[offset];

            // 更新宏定义状态
            if (v) {
                no.addToArray(ids, id);
            } else {
                no.removeFromArray(ids, id);
            }
        }

        // 计算各分组的宏值总和
        let type: number[] = [];
        for (let i = 0; i < this._defineIds.length; i++) {
            let sum = 0;
            let ids = this._defineIds[i];
            for (let j = 0; j < ids.length; j++) {
                sum += ids[j]; // 累加当前分组所有激活的宏ID
            }
            type[i] = sum;
        }

        // 将分组宏值合并为浮点数（如分组0=1，分组1=2 → -1.2）
        this._data.x = -Number(type.join('.'));
        this._setColor(); // 同步更新颜色数据
    }

    /**
     * 每帧更新顶点颜色数据
     * @description
     * - 检查渲染组件有效性，失效时自动从管理器移除
     * - 根据脏标记决定是否更新顶点缓冲区
     * @example
     * // 当精灵节点销毁时自动触发移除逻辑：
     * node.destroy();
     * // 当颜色参数变化后触发更新：
     * this._needUpdate = true;
     */
    public lateUpdate() {
        // 有效性检查：节点无效时从管理器移除
        if (!this.renderComp?.node?.isValid) {
            YJVertexColorTransitionManager.ins().remove(this._uuid);
            return;
        }
        if (!this.renderComp?.node?.activeInHierarchy) return;
        // 脏检查：无更新需求时提前返回
        if (this.renderComp?.renderData.vertDirty) {
            this._setColor();
            this._needUpdate = true;
        }
        if (this._needUpdate) {
            // console.log('YJVertexColorTransition vertDirty', this.renderComp?.renderData.vertDirty);
            this._needUpdate = false;
            this._updateVB(); // 执行顶点缓冲区更新
        }
    }

    /**
     * 根据精灵类型分发顶点缓冲区更新
     * @description
     * - 支持4种精灵类型（简单、九宫格、平铺、填充）
     * - 填充类型进一步分为径向填充和条形填充
     * @example
     * // 处理普通按钮精灵：
     * this.renderComp.type = Sprite.Type.SIMPLE;
     * // 处理血条填充精灵：
     * this.renderComp.type = Sprite.Type.FILLED;
     */
    private _updateVB() {
        if (!this.renderComp.renderData) return;

        // 根据精灵类型选择更新策略
        switch (this.renderComp.type) {
            case Sprite.Type.SIMPLE:   // 普通精灵（4顶点）
                this._updateSimpleVB();
                break;
            case Sprite.Type.TILED:    // 平铺精灵（动态顶点数）
                this._updateTiledVB();
                break;
            case Sprite.Type.SLICED:   // 九宫格精灵（16顶点）
                this._updateSlicedVB();
                break;
            case Sprite.Type.FILLED:   // 填充精灵
                this.renderComp.fillType === Sprite.FillType.RADIAL
                    ? this._updateRadialFilledVB()  // 径向填充（圆形进度）
                    : this._updateBarFilledVB();    // 条形填充（直线进度）
                break;
        }
    }

    /**
     * 更新普通精灵顶点颜色数据
     * @description
     * - 处理4个顶点的颜色通道（RGB）
     * - 颜色数据存储在顶点缓冲区的5-7位置（floatStride步长）
     * @example
     * // 顶点数据结构：
     * // [x, y, z, u, v, r, g, b, a, ...]
     */
    private _updateSimpleVB() {
        const renderData = this.renderComp.renderData;
        if (!renderData?.chunk) return;
        const vData = renderData.chunk.vb;
        let colorOffset = 5; // 颜色数据起始偏移量

        // 解构颜色数据（vec3格式）
        const { x: colorR, y: colorG, z: colorB } = this._data;

        // 遍历4个顶点更新颜色
        for (let i = 0; i < 4; i++, colorOffset += renderData.floatStride) {
            vData[colorOffset] = colorR;     // R通道
            vData[colorOffset + 1] = colorG; // G通道
            vData[colorOffset + 2] = colorB; // B通道
        }
    }

    /**
     * 更新九宫格精灵顶点颜色数据
     * @description
     * - 处理16个顶点的颜色数据
     * - 每个顶点间隔floatStride个浮点数
     * @example
     * // 用于复杂UI元素的颜色过渡：
     * // 如可拉伸对话框背景、动态边框等
     */
    private _updateSlicedVB() {
        const renderData = this.renderComp.renderData!;
        const vData = renderData.chunk?.vb || [];
        const stride = renderData.floatStride;
        const { x: colorR, y: colorG, z: colorB } = this._data;

        // 遍历16个顶点（九宫格9个切片*每个切片4顶点）
        for (let i = 0, colorOffset = 5; i < 16; i++, colorOffset += stride) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
        }
    }

    /**
     * 更新平铺精灵顶点颜色数据
     * @description
     * - 处理动态顶点数量的平铺精灵
     * - 先调用颜色更新回调（如果有）
     * @example
     * // 用于无限滚动背景：
     * // 如跑酷游戏的地面平铺、横向滚动云层等
     */
    private _updateTiledVB() {
        const renderData = this.renderComp.renderData!;
        if (!renderData.chunk) return;

        // 执行自定义颜色更新回调（如果有）
        this._updateColorLate?.call(renderData['_assembler'], this.renderComp);

        const vData = renderData.chunk.vb;
        const stride = renderData.floatStride;
        const { x: colorR, y: colorG, z: colorB } = this._data;

        // 根据实际顶点数更新颜色
        for (let i = 0, colorOffset = 5; i < renderData.vertexCount; i++, colorOffset += stride) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
        }
    }

    /**
     * 更新径向填充精灵顶点颜色数据
     * @description
     * - 处理圆形进度条等径向填充效果
     * - 根据顶点数量动态更新颜色
     */
    private _updateRadialFilledVB() {
        const renderData = this.renderComp.renderData!;
        const vData = renderData.chunk?.vb || [];
        const stride = renderData.floatStride;
        const { x: colorR, y: colorG, z: colorB } = this._data;

        // 遍历所有顶点（径向填充通常有较多顶点）
        for (let i = 0, colorOffset = 5; i < renderData.vertexCount; i++, colorOffset += stride) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
        }
    }

    /**
     * 更新条形填充精灵顶点颜色数据
     * @description
     * - 处理普通进度条等线性填充效果
     * - 固定更新4个顶点的颜色数据
     * @example
     * // 用于血条、能量条等UI元素：
     * // 根据百分比改变fillStart值实现填充效果
     */
    private _updateBarFilledVB() {
        const renderData = this.renderComp.renderData!;
        const vData = renderData.chunk?.vb || [];
        const stride = renderData.floatStride;
        const { x: colorR, y: colorG, z: colorB } = this._data;

        // 更新4个顶点（进度条的基础四边形）
        for (let i = 0, colorOffset = 5; i < 4; i++, colorOffset += stride) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
        }
    }
}

@ccclass('YJVertexColorTransitionManager')
@singleObject('YJVertexColorTransitionManager')
/**
 * 顶点颜色过渡效果管理器（单例模式）
 * @classdesc 
 * - 集中管理所有顶点颜色过渡效果实例
 * - 采用延迟删除机制避免遍历时修改集合
 * - 支持批量更新顶点缓冲区数据
 * 
 * @property {Map<string, YJVertexColorTransitionData>} list 效果数据映射表（key: 渲染组件UUID）
 * @property {string[]} removeSet 待删除组件UUID集合（用于延迟删除）
 * 
 * @example
 * // 获取管理器实例：
 * const manager = YJVertexColorTransitionManager.ins();
 */
export class YJVertexColorTransitionManager extends no.SingleObject {
    private list: Map<string, YJVertexColorTransitionData> = new Map();
    private removeSet: string[] = [];

    /**
     * 获取单例实例
     * @returns 管理器单例对象
     * @example
     * // 在组件中获取管理器：
     * const mgr = YJVertexColorTransitionManager.ins();
     */
    public static ins(): YJVertexColorTransitionManager {
        return super.instance() as YJVertexColorTransitionManager;
    }

    /**
     * 添加/更新顶点颜色效果
     * @param renderComp 目标渲染组件（需包含uuid属性）
     * @param defines 着色器宏定义配置
     * @param properties 扩展属性数组（可选）
     * @example
     * // 为按钮添加溶解效果：
     * mgr.add(buttonSprite, { '0-1': true }, [500, 300]);
     */
    public add(renderComp: Sprite, defines: any, properties?: number[]) {
        let data = this.list.get(renderComp.uuid);
        if (data) {
            // 已存在时更新效果参数
            data.setEffect(defines, properties);
        } else {
            // 新建效果实例并注册
            data = new YJVertexColorTransitionData(renderComp);
            data.setEffect(defines, properties);
            this.list.set(renderComp.uuid, data);
        }
    }

    /**
     * 标记移除效果实例（重载方法）
     * @param uuid 目标组件UUID 或 渲染组件实例
     * @description 实际删除操作延迟到lateUpdate执行
     * @example
     * // 通过组件实例移除：
     * mgr.remove(expiredSprite);
     * // 通过UUID移除：
     * mgr.remove('3e2ab5d0-12f3-4dde-b6ab-2a0e1c7a8c1d');
     */
    public remove(uuid: string);
    public remove(renderComp: Sprite);
    public remove(a: string | Sprite) {
        const uuid = typeof a === 'string' ? a : a.uuid;
        this.removeSet.push(uuid);
    }

    /**
     * 清空所有效果数据
     * @example
     * // 场景切换时重置管理器：
     * mgr.clear();
     */
    public clear(): void {
        this.list.clear();
        this.removeSet.length = 0;
    }

    /**
     * 每帧更新顶点数据
     * @description 
     * - 先处理待删除组件
     * - 批量更新顶点缓冲区
     * - 采用双缓冲机制避免迭代时修改集合
     * @example
     * // 在游戏主循环中调用：
     * update() {
     *   mgr.lateUpdate();
     * }
     */
    public lateUpdate() {
        // 处理延迟删除
        if (this.removeSet.length > 0) {
            for (const [uuid, item] of this.list) {
                if (this.removeSet.indexOf(uuid) > -1) {
                    this.list.delete(uuid);  // 删除标记的组件
                } else {
                    item.lateUpdate();  // 更新未删除的组件
                }
            }
            this.removeSet.length = 0;  // 清空删除标记
        } else {
            // 常规更新所有组件
            for (const [key, item] of this.list) {
                item.lateUpdate();
            }
        }
    }
}
