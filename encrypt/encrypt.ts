import { base64 } from "./base64";
import { YJCrypto } from "./crypto/crypto";
import { rsa } from "./rsa/rsa";

export type EncryptType = 'none' | 'base64' | 'aes' | 'rsa';
/**
 * 加密
 * @param d 
 * @param encryptType 
 * @returns 
 */
export function encode(d: string | object, encryptType: EncryptType): any {
    switch (encryptType) {
        case 'base64':
            return base64.encode(d);
        case 'aes':
            return YJCrypto.aesEncode(d);
        case 'rsa':
            return rsa.encode(d);
        default:
            return d;
    }
}
/**
 * 解密
 * @param d 
 * @param encryptType 
 * @returns 
 */
export function decode(d: string | ArrayBufferLike, encryptType: EncryptType): any {
    switch (encryptType) {
        case 'base64':
            return base64.decode(d);
        case 'aes':
            return YJCrypto.aesDecode(d);
        case 'rsa':
            return rsa.decode(d);
        default:
            return d;
    }
}