
import { _decorator, Component, Node, instantiate, Vec3 } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetPathWithNodePointByUrl
 * DateTime = Sat Apr 16 2022 00:56:57 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPathWithNodePointByUrl.ts
 * FileBasenameNoExtension = SetPathWithNodePointByUrl
 * URL = db://assets/Script/NoUi3/fuckui/SetPathWithNodePointByUrl.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 用节点来设计路径，当 路径prefab加载完成后，调用代理返回路径数据
 */
@ccclass('SetPathWithNodePointByUrl')
@menu('NoUi/ui/SetPathWithNodePointByUrl(设置prefab路径:string)')
export class SetPathWithNodePointByUrl extends FuckUi {
    @property(no.EventHandlerInfo)
    onParsed: no.EventHandlerInfo = new no.EventHandlerInfo();
    @property
    autoRelease: boolean = true;

    protected onDataChange(data: any) {
        no.assetBundleManager.loadPrefab(data, item => {
            let n = instantiate(item);
            let path: Vec3[] = [];
            n.children.forEach(child => {
                path[path.length] = child.position.clone();
            });
            this.onParsed.execute(path);
        });
    }
}
