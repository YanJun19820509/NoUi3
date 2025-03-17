
import { EDITOR, ccclass, property, disallowMultiple, executeInEditMode, Label, CacheMode, Sprite, RichText, BitmapFont, UIRenderer, Component, SpriteFrame, LabelOutline, UITransform, isValid, sys } from '../yj';
import { no } from '../no';
import { YJDynamicAtlas } from './YJDynamicAtlas';
import { YJJobManager } from '../base/YJJobManager';
import { YJSample2DMaterialManager } from './YJSample2DMaterialManager';

/**
 * Predefined variables
 * Name = DynamicTexture
 * DateTime = Tue Apr 19 2022 17:16:03 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = DynamicTexture.ts
 * FileBasenameNoExtension = DynamicTexture
 * URL = db://assets/NoUi3/engine/DynamicTexture.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 本组件同时处理了sprite和label进行合图的处理，这两者处理上有一些不同。
 * 1.sprite需要在设置纹理的同时进行合图，如果纹理设置完后过段时间再进行合图就会出现异常。
 * 2.sprite在设置纹理时不需要重置动态合图纹理。
 * 3.label需要在设置string流程走完后再进行合图。
 * 4.label在设置string前需要重置动态合图纹理。
 * 5.当节点disable时需要reset label，但不需要reset sprite，所以当再次enable时又需要对label进行合图处理
 */
@ccclass('YJDynamicTexture')
@disallowMultiple()
@executeInEditMode()
@ccclass('YJDynamicTexture')
@disallowMultiple()
@executeInEditMode()
export class YJDynamicTexture extends Component {
    /** 是否需要清除已有动态合图缓存（修改后需手动清除） */
    @property
    needClear: boolean = false;
    /** 是否允许旋转精灵帧以优化图集空间 */
    @property
    canRotate: boolean = true;
    /** 材质信息关联UUID（通过YJSample2DMaterialManager管理） */
    @property({ visible() { return false; } })
    materialInfoUuid: string;

    /** 动态图集管理实例 */
    private dynamicAtlas: YJDynamicAtlas;

    /**
     * 组件加载时初始化
     * @description 
     * - 编辑器模式下强制设置Label为BITMAP缓存模式
     * - 运行时获取动态图集实例
     */
    onLoad() {
        if (!this.enabled) return;
        if (EDITOR) {
            // 编辑器模式预处理文字组件
            let label = this.getComponent(Label) || this.getComponent(RichText);
            if (label && label.cacheMode != CacheMode.BITMAP) {
                label.cacheMode = CacheMode.BITMAP;
            }
        } else {
            // 运行时获取材质关联的动态图集
            this.dynamicAtlas = YJSample2DMaterialManager.ins.getMaterialInfo(this.materialInfoUuid).dynamicAtlas;
        }
    }

    /**
     * 延迟初始化（等待场景稳定）
     * @example
     * // 在修改spriteFrame后需要重新初始化:
     * this.scheduleOnce(() => this.init(), 0.2);
     */
    start() {
        if (EDITOR) return;
        this.scheduleOnce(() => {
            this.init();
        }, 0.2);
    }

    /** 初始化合图处理 */
    public init() {
        if (!this.enabledInHierarchy) return;
        this.packSpriteFrame();
    }

    /**
     * 打包精灵帧到动态图集
     * @param frame 要打包的精灵帧（可选，默认使用当前组件的spriteFrame）
     * @example
     * // 动态更换贴图时调用:
     * const newFrame = loadSpriteFrame('new_texture');
     * dynamicTexture.packSpriteFrame(newFrame);
     */
    public packSpriteFrame(frame?: SpriteFrame) {
        let sprite = this.getComponent(Sprite);
        if (!sprite) return;

        // 微信小游戏平台特殊处理
        if (sys.platform == sys.Platform.WECHAT_GAME) return;

        // 有效性检查
        if (!this.enabled || !this.dynamicAtlas?.isWork) {
            if (frame) {
                console.error('dynamicAtlas 为null，未做合图', frame);
                sprite.spriteFrame = frame;
            }
            return;
        }
        
        // 获取当前帧或传入帧
        frame = frame || sprite?.spriteFrame;
        if (!frame) return;
        
        // 执行合图操作
        this.dynamicAtlas?.packToDynamicAtlas(sprite, frame, this.canRotate, () => {
            // 合图失败回调
            sprite.spriteFrame = frame;
        });
    }

    /**
     * 更新文字内容并打包到动态图集
     * @param text 要显示的文字内容
     * @example
     * // 修改文字内容时调用:
     * dynamicTexture.packLabelFrame('New Score: 100');
     */
    public packLabelFrame(text: string) {
        let label = this.getComponent(Label);
        if (!label) return;
        if (!this.enabled || !this.dynamicAtlas?.isWork) {
            label.string = text;
            return;
        }
        // 重置文字帧信息
        if (label.ttfSpriteFrame) {
            label.ttfSpriteFrame?._resetDynamicAtlasFrame();
            label.ttfSpriteFrame._uuid = '';
        }
        label.string = text;
    }

    /**
     * 执行文字合图打包操作
     * @description 将生成的文字纹理打包到动态图集
     * @example
     * // 在文字内容稳定后调用:
     * inputField.on(EditBox.EventType.EDITING_DID_ENDED, () => {
     *     dynamicTexture.pack();
     * });
     */
    public pack(): void {
        if (!this.enabled) return;
        if (!this.dynamicAtlas?.isWork) return;
        let label = this.getComponent(Label);
        if (!label || label.string == '') return;

        // 排除位图字体情况
        if (label.font instanceof BitmapFont)
            return;

        let frame = label.ttfSpriteFrame;
        if (!frame || frame.original)
            return;

        // 生成唯一标识并安排合图任务
        frame._uuid = this.createLabelFrameUuid(label);
        frame.rotated = false;

        YJJobManager.ins.addTask(this._pack.bind(this));
    }

    /** @internal 实际执行合图操作 */
    private _pack() {
        const label = this.getComponent(Label),
            frame = label.ttfSpriteFrame;
        if (!isValid(this?.node) || !this?.node?.activeInHierarchy) return true;
        this.dynamicAtlas?.packToDynamicAtlas(label, frame, this.canRotate);
        return true;
    }

    /**
     * 生成文字帧唯一标识
     * @param label 文字组件
     * @param str 文字内容（可选，默认使用当前内容）
     * @returns 包含字体特征的综合标识字符串
     * @example
     * // 生成预览标识:
     * const previewID = createLabelFrameUuid(labelComp, "PreviewText");
     */
    public createLabelFrameUuid(label: Label, str?: string): string {
        // 组合字体特征参数
        let a = (str || label.string) + "_" + label.getComponent(UIRenderer).color + "_" + label.fontSize + "_" + (label.font?.name || label.fontFamily);
        let ol = label.getComponent(LabelOutline);
        if (ol) {
            a += "_" + ol.color + '_' + ol.width;
        }
        // 添加布局参数
        a += '_' + label.node.getComponent(UITransform).width + '_' + (label.isBold ? '1' : '0') + '_' + (label.isItalic ? '1' : '0');
        return a;
    }
}
