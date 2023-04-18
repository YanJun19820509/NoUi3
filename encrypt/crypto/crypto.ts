import { DEBUG } from "cc/env";
import { no } from "../../no";

export namespace YJCrypto {
    let CryptoJS = window['CryptoJS'];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/!@#$%^&*=';
    const hexs = '0123456789abcdef';
    let AESKey: string;
    let AESIv = '0000000000000000';

    let key: any; //十六位十六进制数作为密钥
    let iv: any;//十六位十六进制数作为密钥偏移量

    function ArrayBufferToWordArray(arrayBuffer: ArrayBuffer | Uint8Array) {
        let u8: Uint8Array;
        if (arrayBuffer instanceof ArrayBuffer)
            u8 = new Uint8Array(arrayBuffer, 0, arrayBuffer.byteLength);
        else u8 = arrayBuffer;
        const len = u8.length;
        const words = [];
        for (let i = 0; i < len; i += 1) {
            words[i >>> 2] |= (u8[i] & 0xff) << (24 - (i % 4) * 8);
        }
        return CryptoJS.lib.WordArray.create(words, len);
    }

    function WordArrayToArrayBuffer(wordArray) {
        const { words } = wordArray;
        const { sigBytes } = wordArray;
        const u8 = new Uint8Array(sigBytes);
        for (let i = 0; i < sigBytes; i += 1) {
            const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
            u8[i] = byte;
        }
        return u8;
    }

    export function createAESKey(cb: (d: { key: string, iv: string } | string) => void, newAESIv = false) {
        AESKey = no.arrayRandom(chars.split(''), 16, true).join('');
        if (newAESIv) AESIv = no.arrayRandom(hexs.split(''), 16, true).join('');
        if (!newAESIv) cb?.(AESKey);
        else cb?.({ key: AESKey, iv: AESIv });
        key = CryptoJS.enc.Utf8.parse(AESKey);
        iv = CryptoJS.enc.Utf8.parse(AESIv);
    }

    /**
     * 加密
     * @param data 
     * @param toBuffer 是否输出ArrayBuffer，默认false，输出string
     * @returns 
     */
    export function aesEncode(data: Uint8Array): ArrayBuffer;
    export function aesEncode(data: string | object, toBuffer?: boolean): string | ArrayBuffer
    export function aesEncode(data: string | object | Uint8Array, toBuffer = false): string | ArrayBuffer {
        let encrypted: any;
        if (data instanceof Uint8Array) {
            let wordBuffer = ArrayBufferToWordArray(data);
            encrypted = CryptoJS.AES.encrypt(wordBuffer, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            return WordArrayToArrayBuffer(encrypted.ciphertext);
        } else {
            let str = "";
            if (typeof (data) == 'string') {
                str = data;
            } else if (typeof (data) == 'object') {//对象格式的转成json字符串
                str = no.jsonStringify(data);
            }
            if (!toBuffer) {
                let encrypted = CryptoJS.AES.encrypt(str, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
                return encrypted.toString();
            } else {
                let arrayBuffer = no.string2ArrayBuffer(str);
                let wordBuffer = ArrayBufferToWordArray(arrayBuffer);
                let encrypt = CryptoJS.AES.encrypt(wordBuffer, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
                return WordArrayToArrayBuffer(encrypt.ciphertext);
            }
        }
    }

    /**
     * 解密
     * @param data 
     * @returns 
     */
    export function aesDecode(data: string | ArrayBufferLike): string | ArrayBuffer {
        if (typeof data == 'string') {
            let decrypt = CryptoJS.AES.decrypt(data, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            return decrypt.toString(CryptoJS.enc.Utf8);
        } else {
            let wordArr = ArrayBufferToWordArray(data)
            let decrypt = CryptoJS.AES.decrypt(wordArr.toString(CryptoJS.enc.Base64),
                key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            return WordArrayToArrayBuffer(decrypt);
        }
    }

    // /**
    //  * AES 加密
    //  * @param arrayBuffer 
    //  * @returns ArrayBuffer
    //  */
    // export function aesEncodeToBuffer(arrayBuffer: ArrayBuffer): ArrayBuffer {
    //     let wordBuffer = ArrayBufferToWordArray(arrayBuffer);
    //     let encrypt = CryptoJS.AES.encrypt(wordBuffer, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    //     return WordArrayToArrayBuffer(encrypt.ciphertext);
    // }
    // /**
    //  * AES解密
    //  * @param arrayBuffer 
    //  * @returns ArrayBuffer
    //  */
    // export function aesDecodeBuffer(arrayBuffer: ArrayBuffer): ArrayBuffer { // 这里的data是WordBuffer类型的数据
    //     let wordArr = ArrayBufferToWordArray(arrayBuffer)
    //     let decrypt = CryptoJS.AES.decrypt(wordArr.toString(CryptoJS.enc.Base64),
    //         key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    //     return WordArrayToArrayBuffer(decrypt);;
    // }
}

if (DEBUG) window['YJCrypto'] = YJCrypto;