import { ccclass, Color, executeInEditMode, Node } from 'NoUi3/yj';
import { YJRenderBase } from './YJRenderBase';
import { no } from 'NoUi3/no';
/**
 * 纹理组件
 */
@ccclass('YJTexture')
@executeInEditMode()
/**
 * 纹理渲染组件
 * @desc 
 * - 继承自基础渲染组件，专门用于纹理渲染
 * - 自动处理节点尺寸变化时的顶点坐标更新
 * - 内置默认四边形顶点布局
 * 
 * @example
 * // 创建纹理组件并设置尺寸：
 * const textureComp = node.addComponent(YJTexture);
 * textureComp.node.setContentSize(200, 100);
 */
export class YJTexture extends YJRenderBase {

    /**
     * 组件加载回调
     * @desc 注册节点尺寸变化监听
     * @example
     * // 当节点尺寸变化时会触发onSizeChanged：
     * node.setContentSize(300, 150);
     */
    onLoad() {
        this.node.on(Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }

    /**
     * 组件销毁回调
     * @desc 移除事件监听，防止内存泄漏
     */
    onDestroy(): void {
        super.onDestroy();
        this.node.off(Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }

    /**
     * 组件启用回调
     * @desc 
     * - 初始化渲染数据（1个四边形，4个顶点）
     * - 设置默认顶点坐标数据
     * - 立即提交数据到GPU缓冲区
     * @example
     * // 启用组件时自动创建默认四边形：
     * textureComp.enabled = true;
     */
    onEnable(): void {
        super.onEnable();
        this.renderable = true;          // 启用渲染
        this.initRenderData(1, 4);       // 初始化1个四边形（需要4个顶点）
        this.setDefaultRenderData();     // 设置默认顶点坐标
        this._assembler.fillBuffers(this); // 立即填充缓冲区
    }

    /**
     * 节点尺寸变化处理
     * @desc 
     * - 当节点尺寸改变时自动调用
     * - 重新计算顶点坐标并标记需要更新渲染数据
     * @example
     * // 修改节点尺寸后自动更新纹理映射：
     * node.width = 250;
     * node.height = 120;
     */
    protected onSizeChanged() {
        console.log('onSizeChanged', no.size(this.node));
        this.setRenderData({ xy: this.getDefaultXY() }); // 根据新尺寸计算顶点坐标
        this.markForUpdateRenderData(); // 标记需要更新渲染数据
    }
}


