import { AllowMultipleOpen, panelPrefabPath } from '../../../types';
import { ccclass } from '../../../yj';
import { LoadingPanel } from './LoadingPanel';
import { PopuPanel } from './PopuPanel';
import { LayerType } from '../../../base/node/LayerType';

@ccclass('PopupWindow')
@panelPrefabPath('db://assets/WJCY/scripts/common/base/node/popu/popu_panel1.prefab')
@AllowMultipleOpen()
export class PopupWindow extends PopuPanel {

    /**
     * 显示弹窗
     * @param compName 弹窗模块类名称
     * @param to 弹窗层级,默认LayerType.Popup
     * @param beforeLoad 加载前的回调函数,如果弹窗模块需要从服务器获取数据，则在这里调用数据模块的getData方法，如果getData返回true,则return {}，否则return null
     * @param data 传入弹窗的数据
     * @param cb 弹窗显示后的回调函数
     */
    public static show(compName: string, to = LayerType.Popup, beforeLoad?: () => Promise<any>, data?: any, cb?: () => void) {
        LoadingPanel.showTo(to, () => {
            if (beforeLoad) {
                beforeLoad().then(d => {
                    if (!d) LoadingPanel.hide();
                    else {
                        super.show(compName, to, data || d, cb);
                        LoadingPanel.done();
                    }
                });
            } else {
                super.show(compName, to, data, cb);
                LoadingPanel.done();
            }
        });
    }
}


