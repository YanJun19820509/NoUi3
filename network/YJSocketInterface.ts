

/**
 * Predefined variables
 * Name = YJWebSocketInterface
 * DateTime = Thu Aug 18 2022 17:47:29 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJWebSocketInterface.ts
 * FileBasenameNoExtension = YJWebSocketInterface
 * URL = db://assets/NoUi3/network/YJWebSocketInterface.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

export interface YJSocketInterface {
    sendDataToServer(encryptType: 'base64' | 'aes' | 'rsa', code: string, args?: any): void;
    getDataFromServer(encryptType: 'base64' | 'aes' | 'rsa', code: string, args?: any): Promise<any>;
}
