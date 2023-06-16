
import { ccclass, property, menu, Component, Node } from '../yj';
import { SetHint } from '../fuckui/SetHint';
import { no } from '../no';

/**
 * Predefined variables
 * Name = YJHintWatcher
 * DateTime = Fri Jan 14 2022 18:02:43 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJHintWatcher.ts
 * FileBasenameNoExtension = YJHintWatcher
 * URL = db://assets/Script/NoUi3/base/YJHintWatcher.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJHintWatcher')
@menu('NoUi/base/YJHintWatcher(红点监听)')
export class YJHintWatcher extends Component {
    @property({ type: SetHint })
    hint: SetHint = null;

    @property({ displayName: '红点key', tooltip: '多个key用逗号分隔' })
    types: string = '';

    private typeList: string[] = [];

    onEnable() {
        if (this.hint == null) return;
        this.bind();
    }

    onDisable() {
        no.hintCenter.offHint(this);
    }

    private bind() {
        if (this.types == '') return;
        let types = this.types.split(',');
        this.typeList = types;
        types.forEach(type => {
            this.bindHint(type);
        });
    }

    protected bindHint(type: string): void {
        no.hintCenter.onHint(type, this.setHint, this);
    }

    protected setHint(v: number): void {
        let n = 0;
        if (this.hint.isNumber) {
            this.typeList.forEach(type => {
                n += no.hintCenter.getHintValue(type);
            });
        } else if (v < 1) {
            let len = this.typeList?.length || 0;
            for (let i = 0; i < len; i++) {
                let type = this.typeList[i];
                if (no.hintCenter.getHintValue(type) > 0) {
                    n = 1;
                    break;
                }
            }
        } else n = 1;
        this.hint.setData(String(n));
    }
}
