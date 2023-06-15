
import { _decorator, Component, Node, Camera, math } from './yj';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = YJRegisterCamera
 * DateTime = Mon Jan 16 2023 17:39:40 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJRegisterCamera.ts
 * FileBasenameNoExtension = YJRegisterCamera
 * URL = db://assets/NoUi3/base/YJRegisterCamera.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJRegisterCamera')
@requireComponent(Camera)
export class YJRegisterCamera extends Component {
    @property
    cameraName: string = '';

    onLoad() {
        YJCameraManager.register(this.cameraName, this.getComponent(Camera));
    }
}


@ccclass('YJCameraManager')
export class YJCameraManager {
    private static _map = {};
    public static register(name: string, camera: Camera) {
        this._map[name] = camera;
    }

    public static hasCamera(name: string): boolean {
        return !!this.getCamera(name);
    }

    public static getCamera(name: string): Camera {
        return this._map[name];;
    }

    public static setCameraRect(name: string, rect: math.Rect) {
        let camera: Camera = this._map[name];
        if (camera) {
            camera.rect = rect;
        }
    }
}