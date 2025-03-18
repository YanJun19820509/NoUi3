
import { ccclass, property, menu, requireComponent, executeInEditMode, EDITOR, SpriteAtlas, SpriteFrame } from '../yj';
import { YJCreateSpriteFrame } from '../engine/YJCreateSpriteFrame';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetSpriteFrameLabel
 * DateTime = Sat Feb 05 2022 23:11:52 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpriteFrameLabel.ts
 * FileBasenameNoExtension = SetSpriteFrameLabel
 * URL = db://assets/NoUi3/ui/SetSpriteFrameLabel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetSpriteFrameLabel')
@menu('NoUi/ui/SetSpriteFrameLabel(设置精灵文本:string)')
@requireComponent(YJCreateSpriteFrame)
@executeInEditMode()
/**
 * 用于设置精灵文本的精灵帧序列
 * data:string,为指定spriteFrame的名称
 */
export class SetSpriteFrameLabel extends HackUi {
    /**
     * 精灵图集资源（必须包含数字/字母的精灵帧）
     * @示例 this.atlas = load('ui/atlas/num') // 加载数字图集
     */
    @property(SpriteAtlas)
    atlas: SpriteAtlas = null;

    /**
     * 默认显示文本（编辑器预览用）
     * @规则：仅编辑器模式下生效，运行时通过a_setData更新
     */
    @property
    text: string = '';

    /**
     * 文本格式化模板（使用C#格式字符串语法）
     * @示例 
     * - 显示等级：'Lv.{0}' 
     * - 多参数：'HP:{0}/MP:{1}'
     */
    @property({ displayName: '格式化模板' })
    formatter: string = '{0}';

    onLoad() {
        super.onLoad();
        // 非编辑器模式初始化默认文本
        if (EDITOR) return;
        !this.dataSetted && this.a_setData(this.text);
    }

    update() {
        // 编辑器模式实时预览文本效果
        if (!EDITOR) return;
        this.a_setData(this.text);
    }

    /**
     * 数据驱动更新方法
     * @param data 支持的参数类型：
     * - string: 直接文本或竖线分割的多参数（如"100|200"）
     * - number: 单个数值参数
     * - object: 键值对参数（如{name:"player", score:100}）
     * @示例 
     * this.a_setData("100|200") // 多参数
     * this.a_setData(50)        // 单数值
     * this.a_setData({name: "test"}) // 对象参数
     */
    protected onDataChange(data: any) {
        if (!this.atlas) return;
        let s = '';
        
        // 根据数据类型进行格式化处理
        if (typeof data == 'string') {
            // 处理竖线分割的多参数（如"100|200"转成数组[100,200]）
            if (data != '')
                s = no.formatString(this.formatter, data.split('|'));
        } else if (typeof data == 'number') {
            // 数值类型转成{0:xxx}格式对象
            s = no.formatString(this.formatter, { '0': data });
        } else {
            // 直接使用对象参数
            s = no.formatString(this.formatter, data);
        }
        
        this.createSpriteFrame(s);
    }

    /**
     * 创建组合精灵帧
     * @param s 要显示的文本字符串
     * @实现逻辑：
     * 1. 遍历每个字符，获取ASCII码作为帧名称
     * 2. 从图集中查找对应精灵帧
     * 3. 组合生成新的精灵帧序列
     * @示例 createSpriteFrame("100") 生成包含1,0,0三个数字的精灵序列
     */
    private createSpriteFrame(s: string) {
        let sfs: SpriteFrame[] = [];
        // 使用传统for循环遍历字符串（避免for of）
        for (let i = 0, n = s.length; i < n; i++) {
            // 获取字符的ASCII码作为精灵帧名称
            let charCode = String(s[i].charCodeAt(0));
            // 从图集获取对应精灵帧
            let frame = this.atlas.getSpriteFrame(charCode);
            // 使用索引赋值避免push（保持严格模式兼容）
            sfs[sfs.length] = frame;
        }
        // 调用YJCreateSpriteFrame组件组合精灵帧
        this.getComponent(YJCreateSpriteFrame)?.useSpriteFrames(
            sfs, 
            `${this.atlas.name}_${s}` // 生成唯一缓存名称
        );
    }
}