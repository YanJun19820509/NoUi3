
import { _decorator, Component, isValid, math, Node, Sprite, UITransform } from 'cc';
import { YJDataWork } from '../../base/YJDataWork';
import { no } from '../../no';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJFold
 * DateTime = Tue May 16 2023 09:58:45 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJFold.ts
 * FileBasenameNoExtension = YJFold
 * URL = db://assets/NoUi3/widget/fold/YJFold.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//折叠组件
@ccclass('YJFold')
export class YJFold extends Component {
    @property({ displayName: '是否水平折叠', tooltip: '默认为垂直折叠，勾选后为水平' })
    isHorizontal: boolean = false;
    @property({ type: Node })
    content: Node = null;
    @property({ tooltip: '当content宽或高大于maxSize时显示折叠按钮和底图' })
    maxSize: number = 100;
    @property({ type: YJDataWork })
    dataWork: YJDataWork = null;

    private targetSize: math.Size;

    public a_foldOrUnfold() {
        if (!this.enabled) return;
        if (!isValid(this?.content)) return;
        if (this.isHorizontal) this.foldOrUnfoldHorizontal();
        else this.foldOrUnfoldVertical();
    }

    public a_unfold() {
        if (!this.enabled) return;
        let size = no.size(this.content);
        if (this.isHorizontal && size.width == 0) this.foldOrUnfoldHorizontal();
        else if (size.height == 0) this.foldOrUnfoldVertical();
    }

    public a_setTargetSize() {
        if (!this.enabled) return;
        this.targetSize = no.size(this.content);
        let show = false;
        if (this.isHorizontal && this.targetSize.width >= this.maxSize) show = true;
        else if (this.targetSize.height >= this.maxSize) show = true;
        this.dataWork.data = {
            show: show
        };
    }

    private foldOrUnfoldVertical() {
        let size = no.size(this.content);
        this.dataWork.data = {
            ani: {
                duration: 0.2,
                to: 1,
                props: {
                    size: [size.width, size.height == 0 ? this.targetSize.height : 0]
                }
            }
        };
    }

    private foldOrUnfoldHorizontal() {
        let size = no.size(this.content);
        this.dataWork.data = {
            ani: {
                duration: 0.2,
                to: 1,
                props: {
                    size: [size.width == 0 ? this.targetSize.width : 0, size.height]
                }
            }
        };
    }
}
