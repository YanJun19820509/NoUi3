
import { ccclass, property, menu, executeInEditMode, Sprite, EDITOR, SpriteFrame } from '../yj';
import { YJJobManager } from '../base/YJJobManager';
import { no } from '../no';
import { HackUi } from './HackUi';
import { SetEffect } from './SetEffect';

/**
 * Predefined variables
 * Name = SetSpriteFrame
 * DateTime = Mon Jan 17 2022 14:34:00 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpriteFrame.ts
 * FileBasenameNoExtension = SetSpriteFrame
 * URL = db://assets/Script/NoUi3/ui/SetSpriteFrame.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetSpriteFrame')
@menu('NoUi/ui/SetSpriteFrame(设置精灵:string|{atlas:string,frame:string})')
@executeInEditMode()
export class SetSpriteFrame extends HackUi {
    /**
     * 目标Sprite组件（未指定时自动获取当前节点组件）
     * @示例
     * // 手动指定其他节点的Sprite组件
     * this.sprite = otherNode.getComponent(Sprite);
     */
    @property(Sprite)
    sprite: Sprite = null;
    
    /**
     * 资源路径前缀（用于自动拼接资源路径）
     * @规则：
     * - 当data参数不包含路径时自动拼接
     * - 格式示例："ui/icon" 会与data参数拼接为"ui/icon/xxx"
     */
    @property
    path: string = '';
    
    /**
     * 默认精灵帧UUID（编辑器模式下使用）
     * @功能：在编辑器模式保存默认精灵帧引用
     */
    @property
    defaultSpriteFrameUuid: string = '';
    
    /**
     * 默认精灵帧名称（用于编辑器显示）
     */
    @property
    defaultName: string = '';

    /**
     * 禁用时是否清除精灵帧
     * @示例
     * this.clearOnDisable = true // 节点禁用时自动清空spriteFrame
     */
    @property({ tooltip: 'disable时清除' })
    clearOnDisable: boolean = false;

    /**
     * 组件启用时初始化默认精灵帧
     * @规则：仅在运行时执行，编辑器模式跳过
     */
    onEnable() {
        if (EDITOR) return;
        this.setSpriteFrameByDefaultSpriteFrameUuid();
    }

    /**
     * 组件禁用时处理
     * @规则：当clearOnDisable=true时清空精灵帧
     */
    onDisable() {
        this.clearOnDisable && this.a_setEmpty();
    }

    /**
     * 组件销毁时资源释放
     * @安全：确保销毁时释放资源引用
     */
    onDestroy() {
        this.a_setEmpty();
    }

    /**
     * 数据驱动更新方法
     * @param data 支持格式：
     * - 字符串：资源路径/精灵名称（自动拼接path前缀）
     * - 对象：{ atlas: '图集路径', frame: '精灵名称' }
     * @示例
     * // 加载"ui/icon/attack"精灵
     * this.path = 'ui/icon';
     * this.onDataChange('attack');
     * 
     * // 直接加载完整路径精灵
     * this.onDataChange('ui/icon/attack');
     * 
     * // 加载指定图集精灵
     * this.onDataChange({ atlas: 'ui/atlas', frame: 'skill_icon' });
     */
    protected onDataChange(data: any) {
        this.lateSet(data);
    }

    /**
     * 延迟设置精灵帧核心方法
     * @流程：
     * 1. 自动获取Sprite组件
     * 2. 根据有无图集选择加载方式
     * 3. 处理资源路径拼接
     * 4. 执行异步加载并设置精灵帧
     */
    private lateSet(data: any): void {
        // 确保Sprite组件存在
        this.sprite = this.sprite || this.getComponent(Sprite);
        if (this.sprite == null) return;

        // 无图集模式：直接加载单个精灵帧
        if (!this.sprite.spriteAtlas && !data.atlas) {
            // 路径拼接处理
            if (this.path != '' && data.indexOf(this.path) == -1) {
                data = this.path + '/' + data;
            }
            
            const path = `${data}/spriteFrame`;
            const uuid = no.assetBundleManager.getUuidFromPath(path);
            
            // 避免重复加载相同资源
            if (this.sprite.spriteFrame?._uuid == uuid) return;

            if (!uuid) {
                // 异步加载精灵帧资源
                no.assetBundleManager.loadSprite(path, spriteFrame => {
                    if (this.sprite?.isValid) {
                        this.sprite.spriteFrame = spriteFrame;
                    }
                });
            }
        } else { // 图集模式
            if (data.atlas) {
                // 加载完整图集并设置精灵帧
                no.assetBundleManager.loadAtlas(data.atlas, item => {
                    this.sprite.spriteAtlas = item;
                    this.sprite.spriteFrame = this.sprite.spriteAtlas.getSpriteFrame(data.frame);
                });
            } else if (this.sprite.spriteAtlas?.spriteFrames) {
                // 从现有图集获取精灵帧
                const name = String(data).split('/').pop();
                this.sprite.spriteFrame = this.sprite.spriteAtlas.getSpriteFrame(name);
            }
        }
    }

    /**
     * 通过UUID设置默认精灵帧（主要用于编辑器模式）
     * @安全：加载失败时输出错误信息
     */
    private setSpriteFrameByDefaultSpriteFrameUuid() {
        if (this.defaultSpriteFrameUuid) {
            no.log('setSpriteFrameByDefaultSpriteFrameUuid', this.defaultSpriteFrameUuid, this.defaultName);
            const sprite = this.getComponent(Sprite);
            no.assetBundleManager.loadByUuid<SpriteFrame>(this.defaultSpriteFrameUuid, (file) => {
                if (!file) {
                    no.err('setSpriteFrameByDefaultSpriteFrameUuid no file', this.defaultSpriteFrameUuid)
                } else {
                    sprite.spriteFrame = file;
                }
            });
        }
    }

    /**
     * 清空精灵帧并释放资源
     * @示例
     * this.a_setEmpty(); // 清空当前显示的精灵帧
     */
    public a_setEmpty(): void {
        if (this.sprite) {
            no.assetBundleManager.release(this.sprite.spriteFrame);
        }
    }

    /**
     * 重置为默认精灵帧
     * @功能：用于编辑器模式下的重置操作
     */
    public resetSprite() {
        this.setSpriteFrameByDefaultSpriteFrameUuid();
    }

    /**
     * 移除精灵帧引用
     * @注意：会同时清空图集引用
     */
    public removeSprite() {
        const sprite = this.getComponent(Sprite);
        if (!sprite) return;
        sprite.spriteFrame = null;
        sprite.spriteAtlas = null;
        // 编辑器模式下重置默认值
        if (EDITOR && this.bind_keys) {
            this.defaultName = '';
            this.defaultSpriteFrameUuid = '';
        }
    }

    /////// 编辑器专用方法 ///////
    
    /**
     * 组件加载时初始化编辑器引用
     */
    onLoad() {
        super.onLoad();
        if (EDITOR) {
            this.sprite = this.getComponent(Sprite);
        }
    }

    /**
     * 编辑器持续更新
     * @功能：维护资源路径格式
     */
    update() {
        if (!EDITOR) return;
        this.initSpriteFrameInfo();
        // 规范化资源路径显示
        if (this.path == '' || this.path.indexOf('db://assets/') == -1) return;
        this.path = this.path.replace('db://assets/', '');
    }

    /**
     * 初始化精灵帧信息
     * @编辑器：用于同步显示名称和UUID
     */
    private initSpriteFrameInfo() {
        const spriteFrame = this.getComponent(Sprite).spriteFrame;
        const name = spriteFrame?.name;
        // 更新默认名称
        if (!!name && this.defaultName != name) {
            this.defaultName = name;
        }
        // 更新UUID引用
        if (spriteFrame && (!this.defaultSpriteFrameUuid || spriteFrame.uuid != this.defaultSpriteFrameUuid)) {
            this.defaultSpriteFrameUuid = spriteFrame.uuid;
        }
    }
}
