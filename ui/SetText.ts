
import { ccclass, property, menu, Label, RichText, EDITOR, BitmapFont, isValid, Layout } from '../yj';
import { YJBitmapFont } from '../widget/bmfont/YJBitmapFont';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { no } from '../no';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';
import { HackUi } from './HackUi';
import { SetEffect } from './SetEffect';
import { YJDynamicLoadFont } from '../base/YJDynamicLoadFont';

/**
 * Predefined variables
 * Name = SetText
 * DateTime = Mon Jan 17 2022 14:36:43 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetText.ts
 * FileBasenameNoExtension = SetText
 * URL = db://assets/Script/NoUi3/ui/SetText.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetText')
@menu('NoUi/ui/SetText(设置文本内容:string)')
/**
 * 设置文本内容
 * data:string,为指定文本内容
 */
export class SetText extends HackUi {
    /**
     * 文本格式化模板（使用C#格式字符串语法）
     * @示例 
     * - 显示玩家信息：'名称:{0} 等级:{1}'
     * - 格式化浮点数：'进度:{0:.2f}%'
     */
    @property({ displayName: '格式化模板' })
    formatter: string = '{0}';

    /**
     * 是否打包到动态图集（优化文本渲染性能）
     * @规则：
     * - true时自动添加YJDynamicTexture组件
     * - false时移除动态纹理组件
     * @示例 
     * this.packToAtlas = true // 启用动态图集优化
     */
    @property
    public get packToAtlas(): boolean {
        return this._packToAtlas;
    }

    public set packToAtlas(v: boolean) {
        if (v == this._packToAtlas) return;
        this._packToAtlas = v;
        if (v) {
            // 获取有效的文本组件（排除YJBitmapFont类型的Label）
            let label = (this.node.getComponent(Label) && !this.node.getComponent(YJBitmapFont)) || this.node.getComponent(RichText);
            if (label && !this.getComponent(YJDynamicTexture)) this.addComponent(YJDynamicTexture);
        } else {
            this.getComponent(YJDynamicTexture)?.destroy();
        }
    }

    @property({ serializable: true })
    _packToAtlas: boolean = true;

    // 文本组件缓存（支持Label/RichText/YJCharLabel三种类型）
    protected label: Label | RichText | YJCharLabel;
    // 临时存储待设置的新数据
    private newData: any;

    /**
     * 节点加载回调
     * @功能：
     * - 确保节点在父级中的显示顺序（当父节点没有Layout组件时）
     */
    onLoad() {
        super.onLoad();
        if (!this.node.parent.getComponent(Layout)) {
            no.siblingIndex(this.node, this.node.parent.children.length - 1);
        }
    }

    /**
     * 数据驱动更新方法
     * @param data 支持的参数类型：
     * - string: 直接文本或竖线分割的多参数（如"Alice|30"）
     * - number: 单个数值参数
     * - object: 键值对参数（如{name:"Alice", age:30}）
     * @实现逻辑：
     * 1. 存储新数据
     * 2. 如果存在动态字体加载组件，等待字体加载完成
     * 3. 最终执行文本设置
     */
    protected onDataChange(data: any) {
        this.newData = data;
        if (this.getComponent(YJDynamicLoadFont))
            this.getComponent(YJDynamicLoadFont).loadFont().then(() => {
                this.lateSet();
            });
        else
            this.lateSet();
    }

    /**
     * 设置文本内容核心方法
     * @param data 要设置的原始数据
     * @实现步骤：
     * 1. 根据数据类型进行格式化处理
     * 2. 编辑器模式直接设置字符串
     * 3. 运行时区分Label类型处理：
     *    - BitmapFont直接设置
     *    - 动态纹理打包处理
     *    - 普通Label直接设置
     * 4. 触发shader效果检查
     * @示例 
     * this.setLabel("test|100") // 格式化多参数
     * this.setLabel(50)         // 格式化数值参数
     * this.setLabel({x:10,y:20})// 对象参数格式化
     */
    protected setLabel(data: any): void {
        if (this.label == null) return;
        let s = '';
        // 字符串类型处理（支持多参数分割）
        if (typeof data == 'string') {
            if (data != '')
                s = no.formatString(this.formatter, data.split('|'));
        } else if (typeof data == 'number') { // 数值类型处理
            s = no.formatString(this.formatter, { '0': data });
        } else { // 对象类型处理
            s = no.formatString(this.formatter, data);
        }
        
        // 编辑器模式直接更新
        if (EDITOR) {
            this.label.string = s;
            return;
        }

        // 运行时差异更新
        if (this.label.string != s) {
            if (this.label instanceof Label) {
                let dt = this.getComponent(YJDynamicTexture);
                if (this.label.font instanceof BitmapFont) {
                    this.label.string = s; // 位图字体直接设置
                } else if (dt) {
                    dt.packLabelFrame(s); // 动态纹理打包
                } else {
                    this.label.string = s; // 普通Label设置
                }
            } else {
                this.label.string = s; // RichText/YJCharLabel设置
            }
            this.checkShader();
        }
    }

    /**
     * 检查并应用shader效果
     * @实现逻辑：
     * 延迟一帧执行SetEffect组件的work方法
     * 确保文本渲染完成后再应用效果
     */
    private checkShader() {
        this.scheduleOnce(() => {
            this.getComponent(SetEffect)?.work();
        });
    }

    /**
     * 延迟设置文本内容
     * @安全校验：
     * - 检查节点有效性
     * - 验证对象参数完整性
     * - 自动获取文本组件
     */
    private lateSet(): void {
        if (!isValid(this.node)) return;
        let data = this.newData;
        // 对象参数完整性检查
        if (typeof data == 'object') {
            for (let k in data) {
                if (data[k] == null) return;
            }
        }
        // 获取文本组件（按优先级获取）
        if (!this.label) {
            this.label = this.node.getComponent(Label) || this.node.getComponent(RichText) || this.node.getComponent(YJCharLabel);
        }
        this.setLabel(data);
    }

    /**
     * 清空文本内容
     * @示例 
     * this.a_setEmpty(); // 清空当前显示的文本
     */
    public a_setEmpty(): void {
        this.setLabel('');
    }
}
