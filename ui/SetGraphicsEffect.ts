
import { ccclass, requireComponent, Graphics, Material } from '../yj';
import { no } from '../no';
import { SetEffect } from './SetEffect';

/**
 * Predefined variables
 * Name = SetGraphicsEffect
 * DateTime = Wed May 25 2022 09:28:48 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetGraphicsEffect.ts
 * FileBasenameNoExtension = SetGraphicsEffect
 * URL = db://assets/NoUi3/ui/SetGraphicsEffect.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
@ccclass('SetGraphicsEffect')
@requireComponent(Graphics)
/**
 * 图形效果设置组件，用于为Graphics组件动态设置材质效果
 * @example
 * // 使用示例：
 * // data配置格式：
 * // {
 * //   path: 'effects/glow', // effect资源路径
 * //   rect: [x, y, w, h],   // UV坐标区域
 * //   defines: { USE_COLOR: true }, // 着色器宏定义
 * //   properties: { color: [1,0,0,1] } // 材质属性
 * // }
 */
export class SetGraphicsEffect extends SetEffect {

    /**
     * 数据变更处理函数
     * @param data 效果配置数据 
     * @property {string} path - effect资源路径
     * @property {number[]} rect - UV坐标区域数组[x,y,width,height]
     * @property {Object} properties - 材质属性键值对
     * @property {Object} defines - 着色器宏定义
     */
    protected onDataChange(data: any) {
        // 确保获取Graphics组件
        if (!this._renderComp) {
            this._renderComp = this.getComponent(Graphics);
            if (!this._renderComp) return;
        }

        // 解构配置参数
        let { path, rect, properties, defines }: { path: string, rect: number[], properties: {}, defines: {} } = data;

        // 处理UV坐标转换
        if (rect) {
            properties = properties || {};
            // 将矩形坐标转换为世界坐标系的UV值
            properties[`i_min_max_uv`] = no.getGraphicUVInWorld(
                rect[0], // x
                rect[1], // y
                rect[2], // width
                rect[3], // height
                this.node
            );
        }

        this.setMaterial(path, defines, properties);
    }

    /**
     * 设置材质方法
     * @param path effect资源路径
     * @param defines 着色器宏定义
     * @param properties 材质属性
     */
    protected setMaterial(path: string, defines: any, properties: any) {
        // 情况1：已有材质且路径匹配（路径前添加../以匹配Cocos内部路径格式）
        if (this._renderComp.material && (!path || this._renderComp.material?.effectName == `../${path}`)) {
            this.setProperties(this._renderComp.material, defines, properties);
        } 
        // 情况2：需要加载新effect
        else if (path) {
            no.assetBundleManager.loadEffect(path, item => {
                // 创建新材质实例
                const material = new Material();
                material.initialize({
                    effectAsset: item
                });
                // 应用材质到Graphics组件
                this._renderComp.material = material;
                this.setProperties(this._renderComp.material, defines, properties);
            });
        } 
        // 情况3：无有效路径时重置材质
        else {
            this.reset();
        }
    }
}
