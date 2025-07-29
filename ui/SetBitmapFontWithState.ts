import { BitmapFont, ccclass, property, requireComponent } from 'hackUi/yj';
import { no } from '../no';
import { LoadAssetsInfo } from '../types';
import { YJBitmapFont } from '../widget/bmfont/YJBitmapFont';
import { HackUi } from './HackUi';

/**
 * 根据状态设置不同的bitmapfont
 * Author mqsy_yj
 * DateTime Mon Aug 21 2023 09:33:19 GMT+0800 (中国标准时间)
 * data:string|number
 */

@ccclass('SetBitmapFontWithStateInfo')
export class SetBitmapFontWithStateInfo extends LoadAssetsInfo {
    @property
    state: string = '';
    @property({ type: BitmapFont })
    public get bmFont(): BitmapFont {
        return null;
    }

    public set bmFont(v: BitmapFont) {
        if (v) {
            this.setPathAndName(v._uuid);
        }
    }
}

@ccclass('SetBitmapFontWithState')
@requireComponent(YJBitmapFont)
/**
 * 状态位图字体设置组件
 * 
 * @功能说明
 * - 根据输入状态值动态切换位图字体
 * - 支持多状态配置，每个状态对应不同字体资源
 * - 自动处理字体资源加载和切换逻辑
 *
 * 
 * // 切换状态：
 * a_setData("normal");  // 切换为普通状态字体
 * a_setData(1);         // 数字会自动转换为字符串匹配状态
 */
export class SetBitmapFontWithState extends HackUi {
    /**
     * 状态配置数组
     * @配置说明
     * - 每个元素包含状态标识和对应字体资源路径
     * - 支持在编辑器中直接拖拽配置
     * - 状态匹配采用字符串严格匹配方式
     */
    @property({ type: SetBitmapFontWithStateInfo })
    states: SetBitmapFontWithStateInfo[] = [];

    /**
     * 数据驱动更新核心方法
     * @param data 输入的状态值，支持类型：
     * - string: 直接匹配state字段
     * - number: 自动转换为字符串进行匹配
     * - 其他类型: 会尝试转换为字符串
     * 
     * @实现流程
     * 1. 将输入数据统一转换为字符串类型
     * 2. 在states数组中查找匹配的配置项
     * 3. 找到匹配项时通过YJBitmapFont组件设置新字体
     * 4. 自动处理字体资源的加载和切换
     */
    protected onDataChange(data: any) {
        // 将输入数据统一转换为字符串进行匹配
        const stateKey = String(data);
        // 在状态配置数组中查找匹配项
        const info = no.itemOfArray<SetBitmapFontWithStateInfo>(
            this.states, 
            stateKey,
            'state'
        );
        
        // 找到有效配置时更新字体
        if (info) {
            // 通过YJBitmapFont组件设置新字体
            // 参数说明：第一个null表示不指定字体对象，直接使用资源路径加载
            this.getComponent(YJBitmapFont).setBitmapFont(null, info.path);
        }
    }

    /**如果没需求可以不实现 */
    // onLoad() {
    //     super.onLoad();
    // }

    /**如果没需求可以不实现 */
    // public a_setEmpty(): void {
    // }
}
