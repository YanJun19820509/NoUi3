
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJGoToConfigDelegate
 * DateTime = Fri Jun 24 2022 15:29:11 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJGoToConfigDelegate.ts
 * FileBasenameNoExtension = YJGoToConfigDelegate
 * URL = db://assets/NoUi3/base/goto/YJGoToConfigDelegate.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */


export type YJGoToInfo = {
    //'类型
    alias: string,
    //'目标功能名
    target: string,
    //'前置功能配置类型
    accompany: string,
    //'参数
    args: string,
    //'备注
    desc: string
};

@ccclass('YJGoToConfigDelegate')
export class YJGoToConfigDelegate extends Component {
    public getInfoByAlias(alias: string): YJGoToInfo {
        return null;
    }
}
