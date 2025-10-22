import { ccclass, property, menu, Component, Node, Sprite, Button, EDITOR, executeInEditMode, Label, SpriteFrame, } from '../yj';
import { no } from '../no';
import { TextureInfo } from '../types';
import { TextureInfoInGPU } from '../engine/TextureInfoInGPU';
import { YJSample2DMaterialManager } from '../engine/YJSample2DMaterialManager';
import { PopuPanelContent } from '../base/node/popu/PopuPanelContent';
import { YJPanel } from '../base/node/YJPanel';
import { SetSpriteFrame } from '../ui/SetSpriteFrame';
import { SetSpriteFrameInSampler2D } from '../ui/SetSpriteFrameInSampler2D';
import { YJBitmapFont } from '../widget/bmfont/YJBitmapFont';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';
import { SetText } from '../ui/SetText';
import YJLoadPrefab from '../base/node/YJLoadPrefab';

/**
 * Predefined variables
 * Name = YJLoadAssets
 * DateTime = Tue Mar 15 2022 18:48:04 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJLoadAssets.ts
 * FileBasenameNoExtension = YJLoadAssets
 * URL = db://assets/common/base/YJLoadAssets.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJLoadAssets')
@menu('NoUi/editor/YJLoadAssets(资源加载与释放)')
/**
 * 资源加载与释放组件
 * @description 负责管理界面相关资源的动态加载和释放，支持纹理集管理、材质共享、编辑器模式下的资源预览等功能
 * @example 
 * // 在编辑器中使用：
 * 1. 将组件挂载到需要管理资源的节点
 * 2. 配置需要加载的纹理信息
 * 3. 使用"搜索需要加载的纹理"按钮自动收集子节点使用的纹理
 * 4. 使用"加载图集"方法创建共享材质
 * 
 * // 运行时使用：
 * const loader = node.getComponent(YJLoadAssets);
 * await loader.load();  // 加载资源
 * loader.release();     // 释放资源
 */
export class YJLoadAssets extends Component {
    /** 是否共享材质（开启后相同纹理的节点会共享材质实例） */
    @property({ displayName: '共享材质' })
    share: boolean = true;

    /** 
     * 自动搜索子节点需要加载的纹理 
     * @property
     * @example
     * // 在属性检查器中勾选此属性，会自动扫描所有子节点中：
     * // - SetSpriteFrameInSampler2D 组件
     * // - 使用图集加载的纹理资源
     * // 并将找到的纹理添加到纹理信息列表
     */
    @property({ displayName: '搜索需要加载的纹理' })
    public get getAllAssets(): boolean {
        return false;
    }

    public set getAllAssets(v: boolean) {
        // 遍历所有子节点的SetSpriteFrameInSampler2D组件
        const list: any[] = this.getComponentsInChildren(SetSpriteFrameInSampler2D),
            textureUuid: string[] = [];
        let a: any;
        let sf: SpriteFrame;
        let uuid: string;
        for (let i = 0, n = list.length; i < n; i++) {
            a = list[i];
            if (a.loadFromAtlas) {
                sf = a.getComponent(Sprite).spriteFrame;
                if (sf) {
                    uuid = sf.texture._uuid;
                    no.addToArray(textureUuid, uuid);
                } else {
                    no.warn(`需要手动添加相关的纹理：节点${a.node.name},bindKeys${a.bind_keys}`);
                }
            }
        }
        console.log('textureUuid', textureUuid);
        // 根据收集到的纹理UUID创建TextureInfo
        this.textureInfos.length = 0;
        let info: TextureInfo;
        for (let i = 0, n = textureUuid.length; i < n; i++) {
            info = new TextureInfo();
            info.addTexture(textureUuid[i]);
            this.textureInfos[this.textureInfos.length] = info;
        }
    }

    /** 需要管理的纹理信息列表 */
    @property({ type: TextureInfo, displayName: '纹理信息' })
    textureInfos: TextureInfo[] = [];

    /** 
     * 更新纹理信息（重新获取所有纹理的UUID） 
     * @property
     * @example
     * // 当纹理资源路径发生变化时，点击此按钮可以：
     * // 1. 根据当前配置的纹理路径重新获取UUID
     * // 2. 更新textureInfos列表中的纹理引用
     */
    @property({ displayName: '更新纹理信息' })
    public get updateAllAssets(): boolean {
        return false;
    }

    public set updateAllAssets(v: boolean) {
        if (this.textureInfos.length == 0) {
            this.getAllAssets = true;
            return;
        }
        // 重新获取所有纹理的UUID
        const ps: Promise<string>[] = [];
        let a: TextureInfo;
        for (let i = 0, n = this.textureInfos.length; i < n; i++) {
            a = this.textureInfos[i];
            if (a.path.indexOf('db://assets/') == 0)
                ps.push(no.EditorMode.getAssetUuidByUrl(a.path.replace('/texture', '.png/texture')));
            else
                ps.push(no.EditorMode.getAssetUuidByUrl(a.base + a.bundleName + '/' + a.path.replace('/texture', '.png/texture')));
        }
        // 更新纹理信息列表
        Promise.all(ps).then(uuids => {
            this.textureInfos.length = 0;
            let info: TextureInfo;
            for (let i = 0, n = uuids.length; i < n; i++) {
                info = new TextureInfo();
                info.addTexture(uuids[i]).then(v => { if (v) this.textureInfos[this.textureInfos.length] = info });
            }
        });
    }

    /** 
     * 显示/隐藏SpriteFrame（编辑器模式下预览用） 
     * @example
     * // 在编辑器中使用：
     * // 勾选时显示实际spriteFrame，取消勾选时显示材质效果
     */
    @property({ displayName: '显示SpriteFrame' })
    public get showSpriteFrame(): boolean {
        return this._show;
    }
    private _show: boolean = false;

    public set showSpriteFrame(v: boolean) {
        this._show = v;
        this.showSubSpriteFrame(v);
    }

    private setMaterialKey() {
        if (this._materialKey) return;
        const name = no.getPrototype(this.node.getComponent(PopuPanelContent) || this.node.getComponent(YJPanel))?.name || this.node.name;
        this._materialKey = name;
    }

    /**
     * 控制子节点显示模式
     * @param v 是否显示原始SpriteFrame
     * @description 切换显示模式时：
     * - true: 显示原始spriteFrame，用于正常预览
     * - false: 显示材质效果，用于测试材质应用
     */
    private showSubSpriteFrame(v: boolean) {
        this.setMaterialKey();
        const name = this._materialKey;
        let a: any;
        // 处理各种类型的组件显示状态
        let list: any[] = this.getComponentsInChildren(SetSpriteFrameInSampler2D);
        for (let i = 0; i < list.length; i++) {
            a = list[i];
            if (v) a.resetSprite();
            else {
                a.removeSprite();
                a.materialInfoUuid = name;
                a.panelName = name;
            }
        }
        // 处理多语言图片组件
        // list = this.getComponentsInChildren(YJLanguageSprite);
        // for (let i = 0; i < list.length; i++) {
        //     if (v) list[i].resetSprite();
        //     else {
        //         list[i].removeSprite();
        //         list[i].materialInfoUuid = name;
        //     }
        // }
        // 处理位图字体组件
        list = this.getComponentsInChildren(YJBitmapFont);
        for (let i = 0; i < list.length; i++) {
            a = list[i];
            if (v) a.resetFont();
            else {
                a.removeFont();
                a.materialInfoUuid = name;
            }
        }
        // 处理多语言文本组件
        // list = this.getComponentsInChildren(YJLanguageLabel);
        // for (let i = 0; i < list.length; i++) {
        //     if (v) list[i].resetLabel();
        //     else {
        //         list[i].removeLabel();
        //     }
        // }
        // 处理字符标签组件
        list = this.getComponentsInChildren(YJCharLabel);
        for (let i = 0; i < list.length; i++) {
            a = list[i];
            if (v) a.resetLabel();
            else {
                a.removeLabel();
                a.materialInfoUuid = name;
                a.panelName = name;
            }
        }
        list = this.getComponentsInChildren(SetText);
        for (let i = 0; i < list.length; i++) {
            if (!v) list[i].getComponent(Label).string = '';
        }
        // 处理材质设置组件
        // list = this.getComponentsInChildren(SetMaterial);
        // for (let i = 0; i < list.length; i++) {
        //     if (v) list[i].resetMaterial();
        //     else {
        //         list[i].removeMaterial();
        //     }
        // }
        // 处理精灵帧设置组件
        list = this.getComponentsInChildren(SetSpriteFrame);
        for (let i = 0; i < list.length; i++) {
            a = list[i];
            if (v) a.resetSprite();
            else {
                a.removeSprite();
            }
        }
        // 处理按钮状态
        if (!v) {
            list = this.getComponentsInChildren(Button);
            for (let i = 0; i < list.length; i++) {
                a = list[i] as Button;
                if (a.getComponent(SetSpriteFrameInSampler2D) || a.getComponent(SetSpriteFrame)) {
                    a.normalSprite = null;
                    a.hoverSprite = null;
                    a.pressedSprite = null;
                    a.disabledSprite = null;
                }
            }
            // 处理预制件加载组件
            list = this.getComponentsInChildren(YJLoadPrefab);
            for (let i = 0; i < list.length; i++) {
                list[i].materialInfoUuid = name;
            }
        }
    }

    /** 材质信息唯一标识（自动生成） */
    @property({ visible() { return false; } })
    _materialKey: string = '';

    // onLoad() {
    //     if (EDITOR) {
    //         this.textureInfos.forEach(info => {
    //             info.resetInfo();
    //         });
    //     }
    // }

    onDestroy() {
        this.release();
    }

    /**
     * 加载纹理集并创建材质
     * @returns Promise<void>
     * @example
     * // 在面板显示时调用：
     * const loader = this.node.getComponent(YJLoadAssets);
     * await loader.load();
     */
    public load() {
        this.setMaterialKey();
        return YJSample2DMaterialManager.ins.createAtlasMaterial(this._materialKey, this.textureInfos, this.share);
    }

    /**
     * 释放材质资源
     * @example
     * // 在面板关闭时调用：
     * const loader = this.node.getComponent(YJLoadAssets);
     * loader.release();
     */
    public release() {
        YJSample2DMaterialManager.ins.getMaterialInfo(this._materialKey)?.destroy();
        if (TextureInfoInGPU.isWork) {
            const name = this.node.name;
            no.setTimeoutF(() => {
                TextureInfoInGPU.showTextureWhenPanelDestroy(name);
            }, 500);
        }
    }

    /**
     * 设置子节点的材质信息UUID
     * @static
     * @param node 目标节点
     * @param materialInfoUuid 材质UUID
     * @example
     * // 动态加载子节点时调用：
     * YJLoadAssets.setMaterialInfoUuidToSubNode(newNode, 'panel_material');
     */
    public static setMaterialInfoUuidToSubNode(node: Node, materialInfoUuid: string) {
        if (!node || !materialInfoUuid) return;
        const arr = [].concat(
            node.getComponentsInChildren(SetSpriteFrameInSampler2D),
            // node.getComponentsInChildren(YJLanguageSprite),
            node.getComponentsInChildren(YJCharLabel),
            node.getComponentsInChildren(YJBitmapFont),
            node.getComponentsInChildren(YJLoadPrefab)
        );
        for (let i = 0; i < arr.length; i++) {
            arr[i].materialInfoUuid = materialInfoUuid;
        }
    }
}
