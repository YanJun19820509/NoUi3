import { YJAudioManager } from "./base/audio/YJAudioManager";
import { YJWindowManager } from "./base/node/YJWindowManager";
import { YJSpineManager } from "./base/YJSpineManager";
import { GuiManager } from "./gui/GuiManager";
import { no } from "./no";
import { YJTempData } from "./YJTempData";

/**
 * 清理所有数据,用于场景切换时清理所有数据
 */
export function clearAll() {
    YJAudioManager.ins?.stopAll();
    YJAudioManager.ins?.clear();
    YJWindowManager.clearAll();
    no.nodePool.clear();
    no.evn.clear();
    no.SingleObjectManager.clearAll();
    // no.assetBundleManager.clear();
    YJTempData.clear();
    YJSpineManager.ins.clear();
    GuiManager.clearAll();
}