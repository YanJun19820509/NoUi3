
import { JSB, ccclass, property, disallowMultiple, Component, Node } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJReleasePrefab
 * DateTime = Sat May 07 2022 11:58:55 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJReleasePrefab.ts
 * FileBasenameNoExtension = YJReleasePrefab
 * URL = db://assets/NoUi3/base/node/YJReleasePrefab.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJReleasePrefab')
@disallowMultiple()
export class YJReleasePrefab extends Component {
    @property({ displayName: '强制释放' })
    force: boolean = true;
    private prefabUuid: string;
    private aa: boolean = false;
    onLoad() {
        this.prefabUuid = this.node['_prefab']?.asset._uuid;
        this.aa = this.enabled;
    }
    onDestroy() {
        if (this.aa && !JSB)
            no.assetBundleManager.release(this.prefabUuid, this.force);
    }
}
