
import { ccclass, property, menu, instantiate, Vec3 } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetPathWithNodePointByUrl
 * DateTime = Sat Apr 16 2022 00:56:57 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPathWithNodePointByUrl.ts
 * FileBasenameNoExtension = SetPathWithNodePointByUrl
 * URL = db://assets/Script/NoUi3/ui/SetPathWithNodePointByUrl.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 用节点来设计路径，当 路径prefab加载完成后，调用代理返回路径数据
 */
@ccclass('SetPathWithNodePointByUrl')
@menu('NoUi/ui/SetPathWithNodePointByUrl(设置prefab路径:string)')
export class SetPathWithNodePointByUrl extends HackUi {
    @property(no.EventHandlerInfo)
    onParsed: no.EventHandlerInfo = new no.EventHandlerInfo();
    @property
    autoRelease: boolean = true;

    protected onDataChange(data: any) {
        no.assetBundleManager.loadPrefab(data, item => {
            let n = instantiate(item);
            let path: Vec3[] = [];
            for (let i = 0; i < n.children.length; i++) {
                path[path.length] = n.children[i].position.clone();
            }
            this.onParsed.execute(path);
            this.autoRelease && no.assetBundleManager.release(item);
        });
    }
}
