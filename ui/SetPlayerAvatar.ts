import Comm_Platform from "../../myCommon/Comm_Platform";
import userInfo from "../../scripts/newScripts/SRXYX_Userinfo";
import { no } from "../no";
import { ccclass, EDITOR, Layers, requireComponent, Sprite, UITransform, Node } from "../yj";
import { HackUi } from "./HackUi";
import { SetSpriteFrameInSampler2D } from "./SetSpriteFrameInSampler2D";

//设置wx用户头像data{uid,url}
@ccclass('SetPlayerAvatar')
@requireComponent([SetSpriteFrameInSampler2D])
export class SetPlayerAvatar extends HackUi {
    private _head: string;
    private _tempAvatar: Node;

    onLoad() {
        super.onLoad();
        if (EDITOR) {
            let s = this.getComponent(Sprite);
            if (s && s.sizeMode != 0) {
                s.sizeMode = 0
            }
        }
    }

    protected onDataChange(data: string) {
        if (typeof data == 'string') {
            this._head = data;
            this.setHead(data);
        }
    }

    private setHead(data: string) {
        if (/^https?:\/\//i.test(data)) {
            this.getComponent(SetSpriteFrameInSampler2D).a_setEmpty();
            this.loadAvatar(data, sf => {
                if (this.isValid && sf && data == this._head) {
                    if (this._tempAvatar) {
                        this._tempAvatar.active = true;
                        this._tempAvatar.getComponent(Sprite).spriteFrame = sf;
                    } else {
                        this._tempAvatar = new Node('_temp_avatar');
                        this._tempAvatar.layer = Layers.Enum.UI_2D;
                        this._tempAvatar.addComponent(UITransform).setContentSize(this.node.getComponent(UITransform).contentSize)
                        let sprite = this._tempAvatar.addComponent(Sprite);
                        sprite.sizeMode = this.getComponent(Sprite).sizeMode;
                        sprite.spriteFrame = sf;
                        this.node.addChild(this._tempAvatar);
                    }
                }
            });
        } else {
            if (this._tempAvatar) {
                this._tempAvatar.active = false;
            }
            this.getComponent(SetSpriteFrameInSampler2D).a_setData(data);
        }
    }

    private loadAvatar(url: string, cb: (sf) => void) {
        // no.assetBundleManager.loadRemoteImage(url, '.jpg', sf => {
        //     cb?.(sf);
        // });
        if(!userInfo.headImg) {
            Comm_Platform.createSpriteFrameByUrl(url, (sp) => {
                if (sp) {
                    cb?.(sp);
                    userInfo.headImg = sp;
                }
            });
        }else {
            cb?.(userInfo.headImg);
        }
    }
}


