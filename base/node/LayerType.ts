/**
 * Predefined variables
 * Name = LayerType
 * DateTime = Wed Aug 10 2022 09:27:44 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = LayerType.ts
 * FileBasenameNoExtension = LayerType
 * URL = db://assets/resources/LayerType.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

/**
 * 游戏UI层级类型定义
 * 
 * 包含以下层级:
 * - Base: 地图层,用于显示游戏地图等基础内容
 * - Navigation: 导航层,用于显示导航相关UI
 * - Window: 全屏窗口层,用于显示全屏窗口界面
 * - Popup: 弹窗层,用于显示各类弹窗
 * - Guide: 引导层,用于显示新手引导等引导内容
 * - Message: 消息层,用于显示各类提示消息
 * 
 * 每个层级都有对应的字符串和数字类型的标识,以及中文描述
 */

export const LayerType = {
    Base: 'base',
    Navigation: 'navi',
    Window: 'wind',
    Popup: 'popu',
    Guide: 'guide',
    Message: 'mess',
    // Menu: 'menu',
    // Oper: 'oper',
    // Top: 'top',
    1: 'base',
    2: 'navi',
    3: 'wind',
    4: 'popu',
    5: 'guide',
    6: 'mess',
    // 7: 'menu',
    // 8: 'oper',
    // 9: 'top',
};

/**
 * 层级类型描述映射表
 * 提供字符串键和数字键两种访问方式，保持双向映射关系
 * 示例：
 * LayerTypeDesc.Base     // => "地图层"
 * LayerTypeDesc[1]       // => "地图层"
 */
export const LayerTypeDesc = {
    /** 基础地图层级，承载游戏主场景 */
    Base: '地图层',
    /** 导航功能层，包含主菜单、任务栏等 */
    Navigation: '导航层',
    /** 全屏界面层，用于设置、背包等全屏窗口 */
    Window: '全屏窗口层',
    /** 弹窗提示层，显示对话框和系统提示 */
    Popup: '弹窗层',
    /** 新手引导层，显示蒙版和指引箭头 */
    Guide: '引导层',
    /** 即时消息层，显示飘字提示和状态消息 */
    Message: '消息层',
    // Menu: '菜单层',
    // Oper: '操作层',
    // Top: '顶部层',
    
    /** 数字键映射 - 与LayerTypeEnum保持同步 */
    1: '地图层',
    2: '导航层',
    3: '全屏窗口层',
    4: '弹窗层',
    5: '引导层',
    6: '消息层',
    // 7: '菜单层',
    // 8: '操作层',
    // 9: '顶部层',
};

/**
 * 层级类型枚举定义
 * 使用数字枚举值便于进行层级比较和排序
 * 示例：
 * LayerTypeEnum.Window // => 3 对应窗口层级
 * 使用场景：
 * 1. 控制UI层级叠加顺序
 * 2. 管理场景切换时的层级清理
 */
export enum LayerTypeEnum {
    /** 基础场景层（zIndex: 1000） */
    Base = 1,
    /** 导航功能层（zIndex: 2000） */
    Navigation = 2,
    /** 全屏窗口层（zIndex: 3000） */
    Window = 3,
    /** 弹窗层（zIndex: 4000） */
    Popup = 4,
    /** 引导层（zIndex: 5000） */
    Guide = 5,
    /** 消息层（zIndex: 6000） */
    Message = 6,
    // Menu = 'menu',
    // Oper = 'oper',
    // Top = 'top',
}