/**
 * 
 * Author mqsy_yj
 * DateTime Mon Oct 14 2024 16:53:48 GMT+0800 (中国标准时间)
 * 全局宏定义
 */

export const YJMacroConfig = {
    /**
     * 系统默认字体配置（需放置在resources目录下）
     * 支持常规/粗体/斜体等样式，文件命名需符合规范：
     * 例：MiSans-Regular.ttf / MiSans-Bold.ttf
     * 使用示例：LabelComponent.fontFamily = YJMacroConfig.TTF_FONT
     */
    TTF_FONT: 'MiSans-Semibold.ttf',
    
    /**
     * 动态批渲染开关配置
     * 开启后自动合并相同材质的UI元素绘制调用，提升渲染性能
     * 使用示例：复杂UI项目建议开启，调试时可临时关闭观察单个元素
     */
    ENABLE_DYNAMIC_BATCH_RENDER: true
}