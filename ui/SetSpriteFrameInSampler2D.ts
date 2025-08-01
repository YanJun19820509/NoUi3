
import { ccclass, property, requireComponent, disallowMultiple, EDITOR, Material, Sprite, SpriteFrame, isValid } from '../yj';
import { YJVertexColorTransitionManager } from '../engine/YJVertexColorTransition';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { HackUi } from './HackUi';
import { YJUIAnimationEffect } from '../base/ani/YJUIAnimationEffect';
import { TextureInfoInGPU } from '../engine/TextureInfoInGPU';
import { YJSample2DMaterialInfo, YJSample2DMaterialManager } from '../engine/YJSample2DMaterialManager';
import { YJMacroConfig } from '../macro';
import { YJJobManager } from '../base/YJJobManager';
import { YJi18n } from '../base/YJi18n';

/**
 * Predefined variables
 * Name = SetSpriteFrameInSampler2D
 * DateTime = Tue Nov 15 2022 22:25:51 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpriteFrameInSampler2D.ts
 * FileBasenameNoExtension = SetSpriteFrameInSampler2D
 * URL = db://assets/Script/common/ui/SetSpriteFrameInSampler2D.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 用于设置材质中挂载的纹理采样的区域
 * data:string,为指定spriteFrame的名称
 */

@ccclass('SetSpriteFrameInSampler2D')
@requireComponent([Sprite])
@disallowMultiple()
/**
 * 用于设置材质中挂载的纹理采样的区域
 * data:string,为指定spriteFrame的名称
 */
export class SetSpriteFrameInSampler2D extends HackUi {
    // 默认精灵帧名称（用于编辑器显示和运行时查找）
    // @示例 this.defaultName = "icon_hero" // 设置默认显示英雄图标
    @property
    defaultName: string = '';

    // 编辑器专用属性：默认精灵帧资源UUID（用于保存资源引用）
    @property({ readonly: true })
    defaultSpriteFrameUuid: string = '';

    // 编辑器专用属性：资源路径（根据defaultSpriteFrameUuid自动生成）
    @property({ readonly: true })
    defaultUrl: string = '';

    // 资源所在AssetBundle名称（用于动态加载）
    // @示例 this.bundleName = "resources" // 指定资源在resources包中
    @property
    bundleName: string = '';

    // 是否从图集加载模式（编辑器专用标记）
    // @规则：
    // - true: 从图集加载精灵帧
    // - false: 使用单独纹理资源
    @property({ displayName: '从图集加载', readonly: true })
    loadFromAtlas: boolean = true;

    // 是否允许动态合图（仅在非图集模式有效）
    // @规则：
    // - true: 运行时将单独纹理合并到动态图集
    // - false: 保持独立纹理
    @property({ displayName: '可动态合图', visible() { return !this.loadFromAtlas; } })
    canPack: boolean = false;

    // UI动效组件（设置精灵帧时自动播放）
    // @示例 this.uiAnim = fadeInEffect // 绑定一个渐入动画效果
    @property({ displayName: '播放动效', type: YJUIAnimationEffect, tooltip: '没有指定则不播放动效' })
    uiAnim: YJUIAnimationEffect = null;

    // 所属面板名称（框架内部使用）
    @property({ visible() { return false; } })
    panelName: string = '';

    // 材质信息UUID（框架内部使用，关联YJSample2DMaterialManager配置）
    @property({ visible() { return false; } })
    materialInfoUuid: string = '';

    // 是否启用多语言支持
    // @规则：
    // - true: 根据当前语言自动切换精灵帧（需在defaultName后添加语言后缀）
    // @示例 this.multiLan = true // 自动加载"icon_zh"/"icon_en"等
    @property({ displayName: '多语言' })
    multiLan: boolean = false;

    // 最后使用的shader宏定义（用于材质变体管理）
    private lastDefine: string;

    // 当前shader变体索引（配合YJSample2DMaterialManager使用）
    private defineIndex: number = 0;

    // 单独加载的精灵帧缓存（非图集模式使用）
    private _singleSpriteFrame: SpriteFrame = null;

    // 动态图集实例引用（从YJSample2DMaterialManager获取）
    private dynamicAtlas: YJDynamicAtlas = null;

    // 材质配置信息（包含UV转换参数等）
    private materialInfo: YJSample2DMaterialInfo;

    private _sprite: Sprite = null;

    /**
     * 每帧更新逻辑（仅在编辑器模式生效）
     * @功能：
     * 1. 当检测到defaultName被清空时，自动重置相关UUID和加载模式
     * 2. 根据加载模式设置动态图集
     * 3. 初始化精灵帧信息
     * @示例
     * // 在编辑器中删除defaultName输入框内容时：
     * // - 自动清空defaultSpriteFrameUuid
     * // - 重置loadFromAtlas和canPack为false
     */
    update() {
        // 编辑器专用逻辑
        if (EDITOR) {
            // 当名称被清空但UUID仍存在时执行重置
            if (this.defaultName == '' && this.defaultSpriteFrameUuid != '') {
                this.defaultSpriteFrameUuid = '';
                this.defaultUrl = '';
                this.loadFromAtlas = false;
                this.canPack = false;
                return;
            }
        }
        // 设置动态图集（当启用图集加载或允许动态合图时）
        if ((this.loadFromAtlas || this.canPack)) {
            this.setDynamicAtlas();
        }
        // 初始化精灵帧信息（编辑器模式下更新显示）
        this.initSpriteFrameInfo();
    }

    /**
     * 组件启用时的初始化逻辑
     * @功能：
     * 1. 初始化材质配置信息（异步重试直到成功）
     * 2. 多语言支持初始化
     * 3. 默认资源加载（通过任务队列保证加载顺序）
     * @示例
     * // 多语言模式示例：
     * // 默认名称为"icon"，当前语言为英语时，实际加载"icon_en"
     * // 当切换语言时自动重新加载对应资源
     */
    onEnable() {
        if (!isValid(this)) return;
        if (!this._sprite) this._sprite = this.getComponent(Sprite);
        // 编辑器模式下不执行
        if (EDITOR) return;

        // 异步初始化材质信息（失败时下一帧重试）
        if (!this.initMaterialInfo()) {
            return requestAnimationFrame(this.onEnable.bind(this));
        };

        // 多语言支持处理
        if (this.multiLan && this.defaultName) {
            // 注册语言变更监听
            this.checkLanguageChange();
            YJi18n.ins.onLanguagechange(this.checkLanguageChange, this);
            return
        }

        // 非图集模式加载单独纹理
        if (!this.loadFromAtlas && this.defaultSpriteFrameUuid)
            YJJobManager.ins.addTask(() => {
                this.setDefaultSpriteFrame(); // 示例：加载UUID指定的独立纹理
                return true;
            });
        // 图集模式通过名称加载
        else if (this.defaultName)
            YJJobManager.ins.addTask(() => {
                this.setSpriteFrame(this.defaultName); // 示例：从图集加载"icon"帧
                return true;
            });
    }

    /**
     * 初始化材质信息
     * @功能：
     * 1. 检查加载条件（非图集模式且不允许动态合图时跳过）
     * 2. 通过UUID从材质管理器获取材质信息
     * 3. 设置动态图集引用
     * @返回 {boolean} 是否初始化成功
     * @示例
     * // 当materialInfoUuid为"123abc"时：
     * // 从YJSample2DMaterialManager获取对应材质配置
     * // 成功获取后设置dynamicAtlas引用
     */
    private initMaterialInfo() {
        // 不需要加载材质的情况：非图集模式且不允许动态合图
        if (!this.loadFromAtlas && !this.canPack) return true;
        // 缺少材质UUID时初始化失败
        if (!this.materialInfoUuid) return false;
        // 已初始化过材质信息时跳过
        if (this.materialInfo) return true;

        // 从材质管理器获取配置信息
        this.materialInfo = YJSample2DMaterialManager.ins.getMaterialInfo(this.materialInfoUuid);
        if (!this.materialInfo) return false;

        // 设置动态图集引用
        this.dynamicAtlas = this.materialInfo.dynamicAtlas;
        return true;
    }

    /**
     * 处理多语言变更逻辑
     * @功能：
     * 1. 将资源更新任务加入队列
     * 2. 使用默认名称重新设置精灵帧
     * @示例
     * // 当语言从中文切换为英文时：
     * // 将自动加载"icon_en"替代原来的"icon"
     */
    private checkLanguageChange() {
        YJJobManager.ins.addTask(() => {
            this.setSingleSpriteFrame(this.defaultName);
            return true;
        });
    }

    /**
     * 组件禁用时的处理（当前保留空实现）
     * @功能：
     * 1. 预留组件禁用时的清理逻辑
     * 2. 可在此处添加暂停动画/清空临时数据等操作
     */
    onDisable() {
        // this._lastName = null;
        // this.a_setEmpty();
    }

    /**
     * 组件销毁时的资源释放
     * @功能：
     * 1. 释放单独加载的精灵帧资源引用
     * 2. 清空精灵组件引用的精灵帧
     * @示例
     * // 当组件被销毁时：
     * // 减少_singleSpriteFrame的引用计数
     * // 将Sprite组件的spriteFrame设为null防止内存泄漏
     */
    onDestroy() {
        if (this._singleSpriteFrame) {
            // 减少引用计数（重要：防止资源泄漏）
            this._singleSpriteFrame.decRef();
            this._singleSpriteFrame = null;
        }
        if (this._sprite) {
            // 清空精灵组件引用
            this._sprite.spriteFrame = null;
        }
    }

    /**
     * 设置动态图集
     * @功能：
     * 1. 根据资源UUID判断是否使用图集加载
     * 2. 当需要打包且允许打包时，清空现有图集引用
     * @逻辑说明：
     * - 散图资源UUID以@f9941结尾时标记为非图集加载
     * - 当不需要图集加载且不允许打包时直接返回
     * - 清空精灵组件的图集引用以准备新图集
     * @示例
     * // 当资源是散图时：
     * // defaultSpriteFrameUuid = "123456@f9941"
     * // loadFromAtlas = false
     */
    public setDynamicAtlas() {
        // 判断是否为散图资源（特殊后缀标识）
        if (this.defaultSpriteFrameUuid)
            this.loadFromAtlas = !this.defaultSpriteFrameUuid.endsWith('@f9941');

        // 非图集模式且不允许打包时终止流程
        if (!this.loadFromAtlas && !this.canPack) return;

        // 清空现有图集引用（准备动态打包）
        if (this._sprite.spriteAtlas)
            this._sprite.spriteAtlas = null;
    }

    /**
     * 初始化精灵帧信息（仅在编辑器模式生效）
     * @功能：
     * 1. 获取并缓存精灵帧基础信息
     * 2. 处理多语言资源路径检测
     * 3. 获取资源包名称
     * 4. 检查散图压缩设置
     * @逻辑说明：
     * - 仅在编辑器环境执行初始化
     * - 当检测到资源名称变更时更新缓存信息
     * - 通过资源URL判断是否多语言资源
     * - 对散图资源检查压缩设置以决定打包能力
     * @示例
     * // 当资源路径包含/language/时：
     * // defaultUrl = "textures/language/en/icon"
     * // multiLan = true
     */
    public initSpriteFrameInfo() {
        if (!EDITOR) return;
        const spriteFrame = this.getComponent(Sprite).spriteFrame;
        if (!spriteFrame) return;

        // 检测到资源名称变更时更新缓存
        let name = spriteFrame.name;
        if (this.defaultName != name) {
            this.defaultName = name;
            this.defaultSpriteFrameUuid = spriteFrame._uuid;

            // 判断资源加载方式（图集/散图）
            if (this.defaultSpriteFrameUuid)
                this.loadFromAtlas = !this.defaultSpriteFrameUuid.endsWith('@f9941');

            // 异步获取资源元信息
            no.EditorMode.getAssetInfo(this.defaultSpriteFrameUuid).then(info => {
                // 处理基础资源路径
                this.defaultUrl = info.url.replace(/.png|.jpg/, '');
                // 检测多语言资源路径特征
                this.multiLan = this.defaultUrl.indexOf('/language/') > -1;

                // 获取资源包名称
                no.EditorMode.getBundleName(info.url).then(bundleName => {
                    this.bundleName = bundleName;
                });

                // 散图资源处理流程
                if (!this.loadFromAtlas) {
                    const metaUrl = info.url.replace('/spriteFrame', '');
                    // 检查散图压缩设置
                    no.EditorMode.getAssetMeta(metaUrl).then(info => {
                        // 存在压缩设置时禁用打包功能
                        if (info.userData.compressSettings?.useCompressTexture) {
                            this.canPack = false;
                        }
                    });
                } else {
                    // 执行动态图集设置
                    this.setDynamicAtlas();
                }
            });
        }
    }

    /**
     * 缓存原始数据（支持字符串或可转换为字符串的类型）
     * @示例 
     * this._data = "player_avatar" // 存储精灵帧名称
     * this._data = 1001 // 自动转换为字符串类型
     */
    private _data: any;

    /**
     * 数据变化处理入口
     * @param data 精灵帧标识参数，支持类型：
     * - 字符串: 直接使用精灵帧名称
     * - 其他类型: 自动转换为字符串类型
     * @处理流程：
     * 1. 转换并存储数据
     * 2. 根据动画组件状态决定立即更新或播放过渡动画
     * @示例
     * this.onDataChange("hero_icon") // 直接设置精灵帧
     * this.onDataChange(2001) // 转换为"2001"处理
     */
    onDataChange(data: string) {
        // 强制转换为字符串类型存储
        this._data = data + '';
        // 优先使用动画组件进行过渡
        if (this.uiAnim?.enabled) this.uiAnim.a_play();
        else this.changeData(); // 无动画时立即更新
    }

    /**
     * 动画效果回调接口（在动画播放完成后触发）
     * @功能：用于衔接动画播放和实际数据变更
     * @调用时机：当关联的UI动画播放完成时
     * @示例
     * // 在动画时间轴结尾处调用：
     * this.a_AnimationEffectCallback()
     */
    public a_AnimationEffectCallback() {
        this.changeData();
    }

    /**
     * 实际执行精灵帧变更的核心方法
     * @处理逻辑：
     * 1. 非图集模式直接设置单独精灵帧
     * 2. 图集模式等待材质信息就绪后设置
     * 3. 资源未加载完成时延迟到下一帧处理
     * @重试机制：当materialInfo未就绪时，通过requestAnimationFrame重试
     * @示例
     * // 普通设置：
     * this.changeData()
     * // 延迟重试场景：
     * requestAnimationFrame(this.changeData.bind(this))
     */
    private changeData() {
        const data = this._data;
        // 非图集资源处理路径
        if (!this.loadFromAtlas) {
            this.setSingleSpriteFrame(data);
            return;
        }

        // 等待材质信息加载完成
        if (!this.materialInfo) {
            // 延迟到下一帧继续尝试
            return requestAnimationFrame(this.changeData.bind(this));
        }
        // 正常设置精灵帧
        this.setSpriteFrame(data);
    }

    /**
     * 设置精灵帧核心方法
     * @param name 精灵帧名称或标识符
     * @规则：
     * - 当loadFromAtlas=true时从合图材质中获取
     * - 当name='null'时清空当前精灵帧
     * - 启用状态和有效名称检查优先于其他逻辑
     * @示例 
     * this.setSpriteFrame('hero_icon') // 设置合图中的英雄图标
     * this.setSpriteFrame('null')      // 清空当前显示的精灵帧
     */
    public setSpriteFrame(name: string) {
        // 基础有效性检查
        if (!this.enabled || !name) return;

        // 非合图模式处理
        if (!this.loadFromAtlas) {
            this.resetSprite();
            return;
        }

        // 特殊空值处理
        if (name == 'null') {
            this.a_setEmpty();
            return;
        }

        // 默认精灵帧处理（当不启用合图加载时）
        if (!this.loadFromAtlas) {
            if (name == this.defaultName)
                this.setDefaultSpriteFrame();
            return;
        }

        // 获取并配置Sprite组件
        if (!this._sprite) this._sprite = this.getComponent(Sprite);
        const sprite = this._sprite;
        // 动态设置材质（如果未设置）
        if (!sprite.customMaterial) {
            sprite.customMaterial = this.dynamicAtlas?.customMaterial;
        }

        // 从材质信息中获取精灵帧
        const [i, spriteFrame] = this.materialInfo.getSpriteFrameInAtlas(name);
        if (!spriteFrame) {
            no.err('这里需要检查下资源使用问题，设置的从合图加载，但未找到资源', this.node.name, name);
            this.resetSprite();
            return;
        }

        // 动态批渲染模式处理
        if (YJMacroConfig.ENABLE_DYNAMIC_BATCH_RENDER) {
            // 优先使用缓存设置，失败则直接设置
            if (!this.dynamicAtlas?.setCachedSpriteFrameInSample2D(sprite, name))
                this.dynamicAtlas?.setSpriteFrameInSample2D(sprite, spriteFrame, name);
            this.setEffect(i);
        } else {
            // 传统方式通过UUID设置
            this.setSpriteFrameByUuid(spriteFrame.uuid);
        }
    }

    /**
     * 设置材质特效
     * @param idx 在合图中的索引位置
     * @规则：
     * - 生成形如"1-200"的define标识（假设defineIndex=1, idx=1）
     * - 同时关闭之前的效果define
     * @示例
     * this.setEffect(0) // 生成define "1-100"并应用到材质
     */
    private setEffect(idx: number) {
        // 生成形如"1-100"的define字符串
        const t = `${this.defineIndex}-${(idx + 1) * 100}`;
        const defines: any = {};
        defines[t] = true;

        // 关闭之前的效果define
        if (this.lastDefine && this.lastDefine != t) {
            defines[this.lastDefine] = false;
        }

        // 更新并应用新define
        this.lastDefine = t;
        YJVertexColorTransitionManager.ins().add(this._sprite, defines);
    }

    /**
     * 清除材质特效
     * @规则：从顶点颜色过渡管理器移除当前精灵
     * @示例
     * this.clearEffect() // 移除所有关联的材质特效
     */
    private clearEffect() {
        YJVertexColorTransitionManager.ins().remove(this._sprite);
    }

    /**
     * 通过UUID设置精灵帧
     * @param uuid 精灵帧资源UUID
     * @规则：
     * - 异步加载指定UUID的精灵帧资源
     * - 加载成功后更新精灵组件并管理引用计数
     * - 非编辑器环境下跟踪GPU纹理使用情况
     * @示例 
     * this.setSpriteFrameByUuid('5f5v5a5b-5c5d-5e5f-5g5h-5i5j5k5l5m5n')
     */
    private setSpriteFrameByUuid(uuid: string) {
        no.assetBundleManager.loadByUuid<SpriteFrame>(uuid, (file) => {
            if (!file) {
                no.err('setSpriteFrameByUuid by uuid no file', this.node?.name, uuid);
            } else {
                // 设置精灵组件显示内容
                this._sprite.spriteFrame = file;

                // 非编辑器环境处理资源引用
                if (!EDITOR) {
                    // 释放之前持有的精灵帧引用
                    if (this._singleSpriteFrame) {
                        this._singleSpriteFrame.decRef();
                        this._singleSpriteFrame = null;
                    }
                    // 持有新精灵帧的引用
                    this._singleSpriteFrame = file;

                    // 记录纹理到GPU监控系统
                    if (TextureInfoInGPU.isWork) {
                        TextureInfoInGPU.addTextureUuidToPanel(file._uuid, this.panelName);
                    }
                }
            }
        });
    }

    /**
     * 设置默认精灵帧
     * @规则：
     * - 优先使用动态图集的自定义材质
     * - 尝试从缓存获取默认精灵帧
     * - 缓存未命中时回退到URL加载
     * - 管理资源引用计数和GPU纹理跟踪
     * @示例
     * this.setDefaultSpriteFrame() // 初始化时设置默认贴图
     */
    private setDefaultSpriteFrame() {
        if (!this._sprite) this._sprite = this.getComponent(Sprite);
        const sprite = this._sprite;
        // 初始化材质设置
        if (!sprite.customMaterial) {
            sprite.customMaterial = this.dynamicAtlas?.customMaterial;
        }

        if (this.defaultSpriteFrameUuid) {
            // 尝试从缓存获取精灵帧
            const s = no.assetBundleManager.createSpriteFrameFromCache(this.defaultSpriteFrameUuid);
            if (s) {
                // 更新精灵帧引用
                if (this._singleSpriteFrame) {
                    this._singleSpriteFrame.decRef();
                    this._singleSpriteFrame = null;
                }
                this._singleSpriteFrame = s;

                // 打包到动态图集
                this.packSpriteFrame(s);

                // GPU纹理跟踪
                if (TextureInfoInGPU.isWork) {
                    TextureInfoInGPU.addTextureUuidToPanel(s._uuid, this.panelName);
                }
            } else {
                // 缓存未命中时回退加载
                this.loadByUrl();
            }
        }
    }

    /**
     * 通过URL加载精灵帧资源
     * @流程说明：
     * 1. 检测是否为内部资源路径，是则转用UUID方式加载
     * 2. 非内部资源时通过URL异步加载精灵帧
     * 3. 加载失败时降级到UUID加载方式
     * 4. 加载成功时更新精灵帧引用并打包到动态图集
     * @示例
     * this.defaultUrl = 'textures/character'; // 需要加载的贴图路径
     * this.loadByUrl(); // 触发URL加载流程
     */
    private loadByUrl() {
        // 检测内部资源标识（db://internal/ 为引擎内置资源路径）
        if (this.defaultUrl.indexOf('db://internal/') == 0) {
            this.loadByUuid();
            return;
        }

        // 通过URL异步加载精灵帧资源
        no.assetBundleManager.loadSprite(this.defaultUrl, (file) => {
            if (!file) {
                // URL加载失败时记录错误并降级到UUID加载
                no.err('setDefaultSpriteFrame by url no file', this.node.name, this.defaultUrl);
                this.loadByUuid();
            } else {
                // 释放旧资源引用（防止内存泄漏）
                if (this._singleSpriteFrame) {
                    this._singleSpriteFrame.decRef();
                    this._singleSpriteFrame = null;
                }

                // 更新精灵帧引用
                this._singleSpriteFrame = file;
                // 打包到动态图集
                this.packSpriteFrame(file);

                // GPU纹理追踪（用于纹理内存管理）
                if (TextureInfoInGPU.isWork) {
                    TextureInfoInGPU.addTextureUuidToPanel(file._uuid, this.panelName);
                }
            }
        });
    }

    /**
     * 通过UUID加载精灵帧资源
     * @流程说明：
     * 1. 使用资源UUID进行精确加载
     * 2. 编辑器环境下直接设置精灵帧
     * 3. 运行时环境管理资源引用
     * 4. 打包到动态图集并跟踪GPU纹理
     * @示例
     * this.defaultSpriteFrameUuid = '00aabbcc'; // 资源管理器中的唯一标识
     * this.loadByUuid(); // 触发UUID加载流程
     */
    private loadByUuid() {
        no.assetBundleManager.loadByUuid<SpriteFrame>(this.defaultSpriteFrameUuid, (file) => {
            if (!file) {
                // UUID加载失败记录错误日志
                no.err('setDefaultSpriteFrame by uuid no file', this.node?.name, this.defaultSpriteFrameUuid)
            } else {
                // 编辑器环境直接设置（避免引用计数影响工作流程）
                if (EDITOR) {
                    this.getComponent(Sprite).spriteFrame = file;
                } else {
                    // 运行时环境资源管理
                    if (this._singleSpriteFrame) {
                        this._singleSpriteFrame.decRef();
                        this._singleSpriteFrame = null;
                    }
                    this._singleSpriteFrame = file;
                    // 打包到动态图集
                    this.packSpriteFrame(file);

                    // GPU纹理追踪（仅运行时需要）
                    if (TextureInfoInGPU.isWork) {
                        TextureInfoInGPU.addTextureUuidToPanel(file._uuid, this.panelName);
                    }
                }
            }
        });
    }

    /**
     * 设置单个精灵帧
     * @功能说明：
     * 1. 验证组件有效性
     * 2. 设置精灵材质
     * 3. 构建资源路径（支持多语言路径）
     * 4. 异步加载精灵帧资源
     * 5. 处理资源加载完成后的验证和设置
     * 
     * @参数说明：
     * @param name 资源名称（不包含路径和后缀）
     * @示例 
     * this.setSingleSpriteFrame('icon_attack') // 加载名为icon_attack的精灵帧
     * this.setSingleSpriteFrame('skill_01')   // 加载skill_01精灵帧
     */
    private setSingleSpriteFrame(name: string) {
        // 验证组件和节点有效性
        if (!isValid(this)) return;

        // 获取Sprite组件并设置自定义材质
        if (!this._sprite) this._sprite = this.getComponent(Sprite);
        const sprite = this._sprite;
        if (!sprite.customMaterial) {
            sprite.customMaterial = this.dynamicAtlas?.customMaterial;
        }

        // 构建资源路径（支持多语言路径）
        let path: string;
        if (this.multiLan) {
            // 多语言路径格式：语言代码/资源名称/spriteFrame
            path = `${YJi18n.ins.language}/${name}/spriteFrame`;
        } else {
            // 常规路径格式：包名/资源名称/spriteFrame
            path = `${this.bundleName}/${name}/spriteFrame`;
        }

        // 异步加载精灵帧资源
        no.assetBundleManager.loadSprite(path, spriteFrame => {
            if (!spriteFrame) {
                // 资源加载失败记录错误日志
                no.err('setSingleSpriteFrame no file', name);
                return;
            }

            // 二次验证组件有效性（防止异步加载期间组件被销毁）
            if (!this.isValid) return;

            // 数据过滤检查（当有_data限制时，只允许加载指定名称的资源）
            if (this._data && this._data.indexOf(spriteFrame.name) < 0) {
                return;
            }

            // 释放之前加载的精灵帧资源
            if (this._singleSpriteFrame) {
                this._singleSpriteFrame.decRef(); // 减少引用计数
                this._singleSpriteFrame = null;
            }

            // 缓存新加载的精灵帧
            this._singleSpriteFrame = spriteFrame;

            // 配置精灵组件属性
            if (sprite.sizeMode != Sprite.SizeMode.CUSTOM) {
                sprite.sizeMode = Sprite.SizeMode.RAW; // 保持原始纹理尺寸
            }
            sprite.trim = false; // 禁用自动裁剪

            // 清除可能存在的特效
            this.clearEffect();

            // 打包到动态图集
            this.packSpriteFrame(spriteFrame);

            // GPU纹理内存追踪（当功能启用时）
            if (TextureInfoInGPU.isWork && this.panelName) {
                TextureInfoInGPU.addTextureUuidToPanel(spriteFrame._uuid, this.panelName);
            }
        });
    }

    /**
     * 打包精灵帧到动态图集
     * @功能说明：
     * 1. 验证精灵帧有效性
     * 2. 根据设置决定是否使用动态图集
     * 3. 执行打包操作并最终设置精灵帧
     * 
     * @参数说明：
     * @param frame 要处理的精灵帧
     * @示例
     * this.packSpriteFrame(loadedFrame) // 将已加载的帧打包
     */
    private packSpriteFrame(frame: SpriteFrame) {
        if (!this._sprite) this._sprite = this.getComponent(Sprite);
        const sprite = this._sprite;
        if (!frame) return;

        // 直接设置模式（当禁用动态图集或不允许打包时）
        if (no.notUseDynamicAtlas || !this.canPack) {
            sprite.spriteFrame = frame;
            return;
        }

        // 动态图集打包模式
        this.dynamicAtlas?.packToDynamicAtlas(sprite, frame, true, () => {
            // 打包完成后的回调
            sprite.spriteFrame = frame;
        });
    }

    /**
     * 清空当前显示的精灵帧
     * @功能说明：
     * - 立即移除精灵组件上的spriteFrame引用
     * - 断开与图集资源的关联
     * @使用示例：
     * this.a_setEmpty(); // 清空当前显示的精灵
     * @注意事项：在编辑器模式下会同时清除默认数据
     */
    public a_setEmpty(): void {
        if (!this.isValid) return;
        this.removeSprite();
    }

    /**
     * 重置精灵到默认状态
     * @功能说明：
     * - 如果存在默认精灵帧UUID，重新加载默认资源
     * - 没有默认配置时执行清空操作
     * @使用示例：
     * this.resetSprite(); // 恢复到组件初始配置状态
     */
    public resetSprite() {
        if (this.defaultSpriteFrameUuid)
            this.loadByUuid();
        else this.removeSprite();
    }

    /**
     * 实际执行精灵帧移除操作
     * @内部逻辑：
     * 1. 清空精灵组件的spriteFrame和spriteAtlas
     * 2. 在编辑器模式下重置默认配置数据
     * 3. 维护资源引用关系
     */
    private removeSprite() {
        if (!this._sprite) this._sprite = this.getComponent(Sprite);
        this._sprite.spriteFrame = null;
        this._sprite.spriteAtlas = null;
        if (EDITOR && this.bind_keys) {
            this.defaultName = '';
            this.defaultSpriteFrameUuid = '';
            this.defaultUrl = '';
        }
    }

    /**
     * 设置精灵渲染组件的启用状态
     * @param v 是否启用（true: 显示精灵，false: 隐藏精灵）
     * @规则：
     * - 当组件自身未启用时，调用无效
     * @使用示例：
     * this.setSpriteEnable(false); // 隐藏精灵但保持组件激活
     */
    public setSpriteEnable(v: boolean) {
        if (!this.enabled) return;
        this._sprite.enabled = v;
    }

    /**
     * 设置自定义材质
     * @param material 要应用的材质实例
     * @功能说明：
     * - 用于实现特殊渲染效果（如灰度化、边缘光等）
     * @使用示例：
     * // 先加载材质资源，然后应用
     * const material = this.loadMaterial('materials/grayscale');
     * this.setSpriteMaterial(material);
     * @注意事项：频繁更换材质可能影响性能
     */
    public setSpriteMaterial(material: Material) {
        this._sprite.customMaterial = material;
    }
}