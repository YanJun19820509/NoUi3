
import {
    ccclass, property, executeInEditMode, EDITOR, Node, Label, RichText, HtmlTextParser, IHtmlTextParserResultObj, IHtmlTextParserStack,
    LabelOutline, Layers, UITransform, math, UIOpacity, Vec2, isValid
} from '../yj';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetTypeWritting
 * DateTime = Wed Jul 13 2022 17:06:29 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetTypeWritting.ts
 * FileBasenameNoExtension = SetTypeWritting
 * URL = db://assets/NoUi3/ui/SetTypeWritting.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 打字机组件
 * data: {
 *  content: string,
 *  stop?: boolean
 * }
 */
@ccclass('SetTypeWritting')
@executeInEditMode()
/**
 * 打字机组件
 */
export class SetTypeWritting extends HackUi {
    /**
     * 打字速度控制（单位：字符/秒）
     * @示例 
     * speed = 5 时每秒显示5个字符
     */
    @property({ displayName: '每秒打字个数', min: 1, step: 1 })
    speed: number = 3;

    /**
     * 段落间停顿时间（单位：秒）
     * @规则：
     * - 当存在多个段落时，段落切换时会应用此间隔
     * @示例 
     * duration = 1 时段落切换会有1秒停顿
     */
    @property({ displayName: '段落间隔时长(s)', min: 0 })
    duration: number = .5;

    /**
     * 打字停止事件回调
     * @触发时机：
     * - 当收到停止指令或完成全部内容输出时
     * @示例 
     * 绑定方法：() => console.log('打字完成')
     */
    @property(no.EventHandlerInfo)
    onStop: no.EventHandlerInfo[] = [];

    /**
     * 跳过动画直接显示全文
     * @规则：
     * - true时立即显示所有内容
     * - false时正常播放打字动画
     * @示例 
     * noType = true 用于调试或立即显示结果
     */
    @property({ displayName: '直接输出' })
    noType: boolean = false;

    // 存储分割后的段落文本数组
    private _paragraphs: string[];
    // 富文本解析后的内容缓存
    private _content: any[];
    // 当前处理的段落索引（-1表示未开始）
    private _idx: number;
    // 文本显示组件（自动获取Label或RichText组件）
    private _label: Label | RichText;
    // 是否使用富文本模式标志
    private _isRichText: boolean = false;
    // 换行符（普通文本用\n，富文本用<br/>）
    private _br: string = '\n';

    /**
     * 编辑器模式更新回调
     * @功能说明：
     * - 在编辑器中禁用RichText组件预览
     * - 防止编辑器模式下富文本效果干扰布局
     */
    update() {
        if (!EDITOR) return;
        // 禁用富文本组件预览
        const richText = this.getComponent(RichText);
        if (richText?.enabled) richText.enabled = false;
    }

    /**
     * 组件禁用时清理资源
     * @执行操作：
     * 1. 移除所有生成的文本节点
     * 2. 重置布局坐标记录
     * @示例 
     * 切换场景时会自动调用进行清理
     */
    onDisable() {
        // 清理所有子节点
        this.node.removeAllChildren();
        // 重置布局参数
        this._x = null;
        this._maxY = 0;
    }

    /**
     * 数据变更处理回调
     * @param data 输入数据对象，支持以下属性：
     * - content: 要显示的内容（字符串数组或单个字符串）
     * - stop: 是否立即停止打字动画并显示全部内容
     * - next: 是否继续显示下一段落
     * 
     * @实现逻辑：
     * 1. 组件初始化：自动获取Label/RichText组件
     * 2. 根据数据指令处理不同场景：
     *   - 停止动画
     *   - 继续播放
     *   - 清空内容
     *   - 重新开始
     * 
     * @示例：
     * // 开始新内容
     * this.a_setData({ content: ['段落1', '段落2'] })
     * 
     * // 强制停止并显示全部内容
     * this.a_setData({ stop: true })
     * 
     * // 继续显示下一段落
     * this.a_setData({ next: true })
     * 
     * // 清空内容
     * this.a_setData({ content: '' })
     */
    protected onDataChange(data: any) {
        // 初始化文本组件（首次调用时执行）
        if (!this._label) {
            // 优先尝试获取Label组件
            this._label = this.getComponent(Label);
            if (!this._label) {
                // 没有Label组件时尝试获取RichText组件
                this._label = this.getComponent(RichText);
                this._isRichText = true;
                this._br = '<br/>'; // 富文本换行符
            }
        }
        if (!this._label) return; // 没有可用文本组件时直接返回

        // 更新段落内容（当传入content属性时）
        if (data.content) {
            // 将输入内容转换为数组（支持数组或单个字符串）
            this._paragraphs = [].concat(data.content);
        }
        this._label.enabled = true; // 确保文本组件处于启用状态

        // 处理停止指令
        if (data.stop) {
            if (this.noType) return; // 直接输出模式不处理动画
            this.unscheduleAllCallbacks(); // 取消所有调度任务
            // 拼接所有段落内容
            let str = this._paragraphs.join(this._br);
            if (!this._isRichText) {
                this._label.string = str; // 普通文本直接设置
            } else {
                this.createRichTextNode(str); // 富文本特殊处理
            }
            no.EventHandlerInfo.execute(this.onStop); // 执行停止回调
        }
        // 处理继续指令
        else if (data.next) {
            if (this.noType) return;
            this.unscheduleAllCallbacks();
            // 拼接已完成的段落（使用传统for循环）
            let str = '';
            const maxIndex = Math.min(this._idx, this._paragraphs.length - 1);
            for (let i = 0; i <= maxIndex; i++) {
                str += this._paragraphs[i] + this._br;
            }
            if (!this._isRichText) {
                this._label.string = str;
                this.setParagraph(); // 继续设置后续段落
            } else {
                this.createRichTextNode(str);
            }
        }
        // 处理清空指令
        else if (data.content == '') {
            // 重置所有状态
            this.node.removeAllChildren();
            this._x = null;
            this._maxY = 0;
            this._label.string = '';
            this._idx = -1;
        }
        // 处理新内容开始
        else {
            // 完全重置状态
            this.node.removeAllChildren();
            this._x = null;
            this._maxY = 0;
            this._label.string = '';
            this._idx = -1;
            this.setParagraph(); // 开始处理第一个段落
        }
    }

    /**
     * 设置并开始处理当前段落
     * @实现步骤：
     * 1. 递增段落索引
     * 2. 检查段落是否存在：
     *    - 不存在时触发停止回调
     * 3. 准备内容数据：
     *    - 富文本模式：解析HTML标签并分割字符
     *    - 普通文本：直接分割为字符数组
     * 4. 调度段落显示任务：
     *    - 首段立即执行
     *    - 后续段落等待指定间隔后执行
     * 
     * @示例：
     * 当处理第2个段落时（_idx=1），会在.duration秒后开始显示
     */
    private setParagraph() {
        this._idx++;
        // 检查段落是否存在
        if (this._paragraphs[this._idx] == null) {
            no.EventHandlerInfo.execute(this.onStop);
            return;
        }
        let s = String(this._paragraphs[this._idx]);
        // 根据文本类型准备内容数据
        this._content = this._isRichText ? this.splitHtmlString(s) : s.split('');

        // 调度段落显示任务（首段无延迟）
        this.scheduleOnce(() => {
            this.noType ? this.write() : this.writing();
        }, this._idx > 0 ? this.duration : 0);
    }

    /**
     * 立即完成当前段落的显示
     * @处理逻辑：
     * - 富文本模式：使用定时器逐个字符显示
     * - 普通文本：直接拼接全部字符
     * - 显示完成后自动换行并处理下一段落
     * 
     * @示例：
     * 当noType=true且内容为"Hello"时：
     * - 普通文本：直接显示"Hello"
     * - 富文本：逐个字符快速显示
     */
    private write() {
        if (this._isRichText) {
            const n = this._content.length;
            // 使用定时器逐个显示富文本字符
            no.schedule(() => {
                this.setStr();
            }, 0, n, 0, this, () => {
                this.setWrap();
                this.setParagraph();
            });
        } else {
            // 普通文本直接拼接显示
            this._label.string += this._content.join('');
            this.setWrap();
            this.setParagraph();
        }
    }

    /**
     * 逐字符显示动画效果
     * @实现原理：
     * 1. 显示当前字符
     * 2. 计算显示间隔（基于speed参数）
     * 3. 调度下一个字符显示：
     *    - 仍有内容：继续递归调用
     *    - 内容为空：换行并处理下一段落
     * 
     * @速度计算示例：
     * speed=3时，每个字符间隔0.33秒（1/3）
     * 最低帧率保证：30FPS（间隔不低于0.033秒）
     */
    private writing() {
        this.setStr();
        // 计算字符显示间隔（保证最低30FPS）
        let t = Math.max(1 / this.speed, 1 / 30);
        
        this.scheduleOnce(() => {
            if (this._content.length == 0) {
                this.setWrap();
                // 段落间停顿后继续下一段
                this.scheduleOnce(() => this.setParagraph(), this.duration);
            } else {
                this.writing();
            }
        }, t);
    }

    /**
     * 设置当前字符到显示组件
     * @功能说明：
     * - 从内容队列取出首个字符/富文本对象
     * - 普通模式：直接追加到文本字符串
     * - 富文本模式：创建带样式的独立Label节点
     * @示例 
     * 普通文本：_content = ['H','e'], 显示"H" → "He"
     * 富文本：_content = [字符对象], 创建新Label节点
     */
    private setStr() {
        if (this._content.length == 0) return;
        let a = this._content.shift();
        if (!this._isRichText)
            this._label.string += a;
        else {
            this.createLableNode(a);
        }
    }

    /**
     * 添加段落换行符
     * @规则：
     * - 当存在多个段落时，在段落结束后添加换行
     * - 单段落时不执行换行操作
     * @示例 
     * 原始内容："第一段\n第二段" → 添加<br/>或\n
     */
    private setWrap() {
        if (this._paragraphs.length == 1) return;
        this._label.string += this._br;
    }

    /**
     * 解析HTML字符串为带样式的字符数组
     * @param htmlStr 需要解析的富文本字符串
     * @returns 带样式信息的字符对象数组
     * @实现逻辑：
     * 1. 使用HTML解析器解析原始字符串
     * 2. 遍历解析结果，为每个文本块添加样式
     * 3. 将文本块拆分为单个字符并保留样式
     * @示例 
     * 输入："<color=#ff0000>AB</color>" 
     * 输出：[{text:'A',style:{color}}, {text:'B',style:{color}}]
     */
    private splitHtmlString(htmlStr: string): any[] {
        let a = new HtmlTextParser().parse(htmlStr);
        let b: any[] = [];
        for (let i = 0; i < a.length; i++) {
            b = b.concat(this.singleLetterWithStyle(a[i]));
        }
        return b;
    }

    /**
     * 将带样式的文本块拆分为单个字符
     * @param o 富文本解析结果对象
     * @returns 单个字符组成的样式数组
     * @特殊处理：
     * - 换行符作为独立元素保留
     * - 自动继承RichText组件的默认样式
     * @示例 
     * 输入：{text:"Hi",style:{bold:true}} 
     * 输出：[{text:'H',style}, {text:'i',style}]
     */
    private singleLetterWithStyle(o: IHtmlTextParserResultObj): any[] {
        if (!o.style) return o.text.split('');
        if (o.text == '' && o.style.isNewLine) return [o];
        let a = o.text.split(''), b: any[] = [];
        let richText = this.getComponent(RichText),
            fontSize = richText.fontSize,
            fontFamily = richText.fontFamily,
            lineHeight = richText.lineHeight;
        let style: IHtmlTextParserStack = o.style || {};
        if (!style.size) style.size = fontSize;
        for (let i = 0; i < a.length; i++) {
            b[b.length] = {
                text: a[i],
                style: o.style,
                fontFamily: fontFamily,
                lineHeight: lineHeight
            };
        }
        return b;
    }

    /**
     * 生成带BBCode的富文本字符数组
     * @param o 富文本解析结果对象
     * @returns BBCode格式的字符串数组
     * @样式处理：
     * - 支持粗体、斜体、下划线
     * - 处理颜色、字号、描边样式
     * - 自动转换换行符为<br/>
     * @示例 
     * 输入：{text:"A",style:{bold:true,color:#f00}} 
     * 输出：["[b][color=#f00]A[/color][/b]"]
     */
    private createHtmlStrings(o: IHtmlTextParserResultObj): string[] {
        if (!o.style) return o.text.split('');
        if (o.text == '' && o.style.isNewLine) return ['<br/>'];
        let a = o.text.split(''), b: string[] = [];
        for (let i = 0; i < a.length; i++) {
            let aa = a[i];
            if (o.style.bold) aa = no.addBBCode(aa, 'b');
            if (o.style.italic) aa = no.addBBCode(aa, 'i');
            if (o.style.underline) aa = no.addBBCode(aa, 'u');
            if (o.style.color) aa = no.addBBCode(aa, 'color', o.style.color);
            if (o.style.size) aa = no.addBBCode(aa, 'size', o.style.size);
            if (o.style.outline) aa = no.addBBCode(aa, 'outline', [
                { key: 'color', value: o.style.outline.color },
                { key: 'width', value: o.style.outline.width }
            ]);
            b[b.length] = aa;
        }
        return b;
    }

    /**
     * 创建普通文本节点
     * @param a 文本配置对象
     * @param a.text 要显示的单个字符
     * @param a.style 文本样式配置（字号、颜色、粗体等）
     * @param a.fontFamily 字体名称
     * @param a.lineHeight 行高配置
     * @实现说明：
     * - 动态创建Label节点并配置样式
     * - 处理文字描边效果
     * - 设置节点初始透明度和布局位置
     * @示例 
     * createLableNode({
     *   text: 'A',
     *   style: { size: 20, color: '#ff0000', bold: true },
     *   fontFamily: 'Arial',
     *   lineHeight: 24
     * }) // 创建红色20号加粗A字符节点
     */
    private createLableNode(a: { text: string, style: IHtmlTextParserStack, fontFamily: string, lineHeight: number }) {
        // 计算实际行高（取字号和配置行高的最大值）
        a.lineHeight = Math.max(a.style.size, a.lineHeight)
        // 更新最大行高用于换行计算
        if (a.lineHeight > this._maxY) this._maxY = a.lineHeight;
        // 处理换行标记
        if (a.style.isNewLine) {
            this.setNewLine();
            return;
        }

        // 创建文本节点
        let labelNode = new Node();
        labelNode.active = false; // 先隐藏防止闪烁
        labelNode.layer = Layers.Enum.UI_2D;

        // 设置节点基础属性
        let ut = labelNode.addComponent(UITransform);
        ut.setContentSize(a.style.size, a.lineHeight); // 设置内容区域
        ut.setAnchorPoint(0, 0); // 左下锚点

        // 添加透明组件并初始化透明度
        labelNode.addComponent(UIOpacity).opacity = 0;

        // 添加Label组件并配置样式
        let label = labelNode.addComponent(Label);
        label.string = ''; // 初始空内容
        label.color = no.str2Color(a.style.color); // 转换颜色格式
        label.fontFamily = a.fontFamily;
        label.fontSize = a.style.size;
        label.lineHeight = a.lineHeight;
        label.isItalic = a.style.italic;
        label.isBold = a.style.bold;
        label.isUnderline = a.style.underline;
        label.cacheMode = Label.CacheMode.NONE; // 禁用缓存保证动态更新
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;

        // 处理文字描边效果
        if (a.style.outline) {
            let outline = labelNode.addComponent(LabelOutline);
            outline.color = no.str2Color(a.style.outline.color);
            outline.width = a.style.outline.width;
        }

        // 设置动态纹理（用于特殊效果）
        let dynamicTexture = this.getComponent(YJDynamicTexture);

        // 设置最终文本内容
        label.string = a.text;
        labelNode.parent = this.node;
        labelNode.active = true;

        // 延迟一帧执行布局和渐显效果
        this.scheduleOnce(() => {
            this.setPos(labelNode);
            labelNode.getComponent(UIOpacity).opacity = 255;
        });
    }

    /**
     * 创建富文本节点
     * @param v 带BBCode格式的富文本字符串
     * @实现说明：
     * - 创建整段富文本节点
     * - 继承父级富文本样式配置
     * - 清理旧节点并重新布局
     * @示例 
     * createRichTextNode('[color=#00ff00]Hello[/color]') // 创建绿色Hello文本
     */
    private createRichTextNode(v: string) {
        let rt = this.getComponent(RichText);
        let labelNode = new Node();
        labelNode.active = false;
        labelNode.layer = Layers.Enum.UI_2D;

        // 配置富文本节点属性
        let ut = labelNode.addComponent(UITransform);
        ut.setContentSize(rt.fontSize, Math.max(rt.fontSize, rt.lineHeight));
        ut.setAnchorPoint(0, 1); // 左上锚点

        labelNode.addComponent(UIOpacity).opacity = 0;

        // 添加富文本组件
        let label = labelNode.addComponent(RichText);
        label.string = '';
        label.fontFamily = rt.fontFamily;
        label.fontSize = rt.fontSize;
        label.lineHeight = Math.max(rt.fontSize, rt.lineHeight);
        label.maxWidth = rt.maxWidth; // 继承父级最大宽度
        label.cacheMode = Label.CacheMode.NONE;
        label.string = v;

        labelNode.parent = this.node;
        labelNode.active = true;

        // 延迟执行布局和清理操作
        this.scheduleOnce(() => {
            this._x = null; // 重置排版坐标
            this._maxY = 0;
            this.setPos(labelNode);
            labelNode.getComponent(UIOpacity).opacity = 255;
            this.setNewLine();
            this.setParagraph();

            // 清理旧节点（保留当前节点）
            let cs = this.node.children;
            for (let i = cs.length - 1; i >= 0; i--) {
                let c = cs[i];
                if (c.uuid != labelNode.uuid)
                    c.removeFromParent();
            }
        });
    }

    // 排版坐标状态
    private _x: number; // 当前行X轴坐标
    private _y: number; // 当前行Y轴坐标
    private _maxY: number; // 当前行最大高度
    private _anc: Vec2; // 父节点锚点缓存
    private _width: number; // 父节点宽度缓存

    /**
     * 设置节点位置
     * @param node 要定位的节点
     * @实现说明：
     * - 根据当前排版状态计算位置
     * - 自动处理换行逻辑
     * - 调整Y轴位置考虑锚点偏移
     * @示例 
     * 当父节点宽度300时，第三个节点超出宽度后自动换行
     */
    private setPos(node: Node) {
        if (!isValid(this.node)) return;
        
        // 初始化排版坐标
        if (this._x == null) {
            this._anc = this.node.getComponent(UITransform).anchorPoint;
            this._width = this.node.getComponent(UITransform).width;
            this._x = (0 - this._anc.x) * this._width; // 计算起始X坐标
            this._y = 0; // 起始Y坐标
        }

        let ut = node.getComponent(UITransform);
        const size = ut.contentSize;
        this.checkNewLine(size.width); // 检查是否需要换行
        
        // 计算位置（Y轴考虑锚点偏移）
        node.setPosition(this._x, this._y - size.height * (1 - ut.anchorY) / 1.22);
        this._x += size.width; // 移动X坐标
    }

    /**
     * 检查是否需要换行
     * @param width 待添加节点的宽度
     * @规则：
     * - 当剩余空间不足时换行
     * - 换行后Y轴下移当前行最大高度
     * @示例 
     * 父节点宽度300，当前X=280，添加宽度30的节点时触发换行
     */
    private checkNewLine(width: number) {
        if (this._x + width > (1 - this._anc.x) * this._width) {
            this._y -= this._maxY; // Y轴下移
            this._x = (0 - this._anc.x) * this._width; // X轴复位
        }
    }

    /**
     * 执行换行操作
     * @实现说明：
     * - Y轴下移当前最大行高
     * - X轴复位到起始位置
     * @示例 
     * 当前_maxY=20时，换行后_y-=20，x回到起始位置
     */
    private setNewLine() {
        this._y -= this._maxY;
        this._x = (0 - this._anc.x) * this._width;
    }
}
