import { no } from "../no";
import { YJCharLabel } from "../widget/charLabel/YJCharLabel";
import { Component, Prefab, Sprite, _AssetInfo, assetManager, ccclass, instantiate, property } from "../yj";

/**
 * 检测预制体，包括：1. 检查是否存在错误；2. 检查未使用SetSpriteFrameInSampler2D；3. 检查使用SetSpriteFrameInSampler2D中是否为FILLED类型。
 */

const enum CheckType {
    Error = 0,
    SetSpriteFrameInSampler2D,
    FILLED
}

@ccclass('YJCheckSpriteFrame')
/**
 * SpriteFrame检测组件
 * @description 提供三种预制体检测功能：
 * 1. 异常预制体检测 - 检查资源加载错误
 * 2. 规范使用检测 - 检查未使用指定组件设置SpriteFrame
 * 3. 填充类型检测 - 检查FILLED类型Sprite的合规使用
 * 
 * @example
 * // 添加组件到场景节点后，在属性检查器中：
 * // 1. 勾选"检测预制体错误"开始异常检测
 * // 2. 勾选"检查未使用SetSpriteFrameInSampler2D"进行规范检查
 * // 3. 勾选"检查Sprite为FILLED类型"验证填充类型使用
 */
export class YJCheckSpriteFrame extends Component {
    /**
     * 预制体错误检测属性
     * @description 当在属性检查器中勾选时，触发预制体加载错误检测
     * @example
     * // 在控制台输出所有加载失败的预制体路径
     */
    @property({ displayName: '检测预制体错误' })
    public get checkErr(): boolean { return false; }
    public set checkErr(v: boolean) { this.lookupAllPrefabs(CheckType.Error); }

    /**
     * 组件使用规范检测属性
     * @description 检测未使用SetSpriteFrameInSampler2D组件的情况
     * @example
     * // 会检查所有非YJCharLabel的Sprite节点：
     * // - 如果使用spriteFrame且未挂载指定组件
     * // - 且spriteFrame不是默认资源
     * // 则在控制台输出警告
     */
    @property({ displayName: '检查未使用SetSpriteFrameInSampler2D' })
    public get checkSetSpriteFrameInSampler2D(): boolean { return false; }
    public set checkSetSpriteFrameInSampler2D(v: boolean) { this.lookupAllPrefabs(CheckType.SetSpriteFrameInSampler2D); }

    /**
     * 填充类型检测属性
     * @description 检测FILLED类型Sprite是否合规使用
     * @example
     * // 当检测到FILLED类型Sprite使用图集加载方式时：
     * // 在控制台输出错误信息
     */
    @property({ displayName: '检查Sprite为FILLED类型' })
    public get checkFILLED(): boolean { return false; }
    public set checkFILLED(v: boolean) { this.lookupAllPrefabs(CheckType.FILLED); }

    /**
     * 遍历所有预制体进行检测
     * @param checkType 检测类型 
     * @description 执行流程：
     * 1. 通过编辑器接口查询所有Prefab资源
     * 2. 过滤出res/resources目录下的预制体
     * 3. 根据检测类型分派不同检查逻辑
     */
    private lookupAllPrefabs(checkType: CheckType) {
        no.warn('开始检测', checkType);
        Editor.Message.request('asset-db', 'query-assets', { ccType: 'cc.Prefab' }).then((infos: any[]) => {
            const requests: any[] = []; // 预制体加载请求列表
            const pathMap: { [uuid: string]: string } = {}; // UUID到资源路径的映射

            // 过滤并准备需要检测的预制体
            for (const info of infos) {
                if (info.path.startsWith('db://assets/res') || info.path.startsWith('db://assets/resources')) {
                    requests.push({ uuid: info.uuid, type: Prefab });
                    pathMap[info.uuid] = info.url;
                }
            }

            if (checkType === CheckType.Error) {
                this.checkPrefabError(requests, pathMap);
            } else {
                // 批量加载预制体进行详细检测
                assetManager.loadAny(requests, null, (err, prefabs: Prefab[]) => {
                    if (!err) {
                        prefabs.forEach(prefab => 
                            this.checkSprite(prefab, pathMap[prefab.uuid], checkType)
                        );
                    } else {
                        no.err(err.message);
                    }
                    no.warn('检测完成');
                });
            }
        });
    }

    /**
     * 递归检测预制体加载错误
     * @param requests 待检测的预制体请求列表
     * @param pathMap 资源路径映射表
     * @param idx 当前检测索引
     */
    private checkPrefabError(requests: any[], pathMap: any, idx = 0) {
        const currentRequest = requests[idx];
        if (!currentRequest) return no.warn('检测完成');

        assetManager.loadAny(currentRequest, null, (err) => {
            if (err) {
                no.err('预制体异常：', pathMap[currentRequest.uuid]);
            } else {
                this.checkPrefabError(requests, pathMap, ++idx);
            }
        });
    }

    /**
     * 深度检测Sprite组件
     * @param prefab 预制体实例
     * @param url 预制体资源路径
     * @param checkType 检测类型
     * @example
     * // 当检测到SetSpriteFrameInSampler2D缺失时：
     * // 输出"预制体[路径] 节点[节点名]"
     * 
     * // 当检测到FILLED类型使用图集加载时：
     * // 输出"预制体[路径] 节点[节点名]"
     */
    private checkSprite(prefab: Prefab, url: string, checkType: CheckType) {
        const instance = instantiate(prefab);
        const sprites = instance.getComponentsInChildren(Sprite);

        for (const sprite of sprites) {
            if (sprite instanceof YJCharLabel) continue;

            if (checkType === CheckType.SetSpriteFrameInSampler2D) {
                // 检查规范使用组件的情况
                if (!sprite.getComponent('SetSpriteFrameInSampler2D') && 
                    sprite.spriteFrame && 
                    !sprite.spriteFrame.name.startsWith('default_') && 
                    !sprite.spriteFrame.uuid.endsWith('@f9941')) {
                    no.err(`预制体${url}     节点${sprite.name}`);
                }
            }

            if (checkType === CheckType.FILLED) {
                // 检查FILLED类型使用规范
                if (sprite.type === Sprite.Type.FILLED && 
                    sprite.getComponent('SetSpriteFrameInSampler2D')?.['loadFromAtlas']) {
                    no.err(`预制体${url}     节点${sprite.name}`);
                }
            }
        }
    }
}


