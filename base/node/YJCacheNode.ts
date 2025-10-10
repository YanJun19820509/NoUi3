import { ccclass, Component, property } from "../../yj";
import { no } from "../../no";
/**
 * 将节点放入缓存池的组件
 * Author mqsy_yj
 * DateTime Wed Jun 11 2025 14:27:31 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJCacheNode')
export class YJCacheNode extends Component {
    @property
    type: string = '';

    public a_cache() {
        if (!this.type) return;
        no.nodePool.put(this.type, this.node);
    }
}