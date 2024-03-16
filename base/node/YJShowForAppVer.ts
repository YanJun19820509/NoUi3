
import { no } from '../../no';
import { ccclass, Component, property, sys } from '../../yj';

/**
 * Predefined variables
 * Name = YJShowForAppVer
 * DateTime = Tue Aug 09 2022 11:51:04 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowForAppVer.ts
 * FileBasenameNoExtension = YJShowForAppVer
 * URL = db://assets/NoUi3/base/node/YJShowForAppVer.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 * 根据appver判断节点是否显示
 */

@ccclass('YJShowForAppVer')
export class YJShowForAppVer extends Component {
    @property
    minAppVer: string = '';
    onLoad() {
        if (!this.enabled || sys.platform == sys.Platform.DESKTOP_BROWSER) return;
        const min = this.minAppVer.split('.'),
            cur = no.appVer().split('.');
        for (let i = 0, n = Math.max(min.length, cur.length); i < n; i++) {
            const a = Number(min[i] || 0), b = Number(cur[i] || 0);
            if (a > b) {
                this.node.destroy();
                break;
            }
        }
    }
}
