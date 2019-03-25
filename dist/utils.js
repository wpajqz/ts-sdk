"use strict";
exports.__esModule = true;
var crypto_js_1 = require("crypto-js");
var makeCRCTable = function () {
    var c;
    var crcTable = [];
    for (var n = 0; n < 256; n++) {
        c = n;
        for (var k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        crcTable[n] = c;
    }
    return crcTable;
};
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.crc32 = function (str) {
        var crcTable = window.crcTable || (window.crcTable = makeCRCTable());
        var crc = 0 ^ -1;
        for (var i = 0; i < str.length; i++) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff];
        }
        return (crc ^ -1) >>> 0;
    };
    // ArrayBuffer 转为字符串，参数为 ArrayBuffer 对象
    Utils.ab2str = function (buf) {
        // 注意，如果是大型二进制数组，为了避免溢出，必须一个一个字符地转
        if (buf && buf.byteLength < 1024) {
            return String.fromCharCode.apply(null, new Uint8Array(buf));
        }
        var bufView = new Uint8Array(buf);
        var len = bufView.length;
        var byteStr = new Array(len);
        for (var i = 0; i < len; i++) {
            byteStr[i] = String.fromCharCode.call(null, bufView[i]);
        }
        return byteStr.join('');
    };
    // 字符串转为 ArrayBuffer 对象，参数为字符串
    Utils.str2ab = function (str) {
        var buf = new ArrayBuffer(str.length); // 每个字符占用2个字节
        var bufView = new Uint8Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    };
    // 解密服务端传递过来的字符串
    Utils.decrypt = function (data, key, iv) {
        var binData = Utils.stringToBin(data);
        var base64Data = Utils.binToBase64(binData);
        var bytes = crypto_js_1.AES.decrypt(base64Data, crypto_js_1.enc.Latin1.parse(key), {
            iv: crypto_js_1.enc.Latin1.parse(iv),
            mode: crypto_js_1.mode.CBC,
            padding: crypto_js_1.pad.Pkcs7
        });
        return bytes.toString(crypto_js_1.enc.Utf8);
    };
    // 加密字符串以后传递到服务端
    Utils.encrypt = function (data, key, iv) {
        var result = crypto_js_1.AES.encrypt(data, crypto_js_1.enc.Latin1.parse(key), {
            iv: crypto_js_1.enc.Latin1.parse(iv),
            mode: crypto_js_1.mode.CBC,
            padding: crypto_js_1.pad.Pkcs7
        });
        return Utils.binToStr(Utils.base64ToBin(result.toString()));
    };
    // 字节数组转换为base64编码
    Utils.binToBase64 = function (bitString) {
        var result = '';
        var tail = bitString.length % 6;
        var bitStringTemp1 = bitString.substr(0, bitString.length - tail);
        var bitStringTemp2 = bitString.substr(bitString.length - tail, tail);
        for (var i = 0; i < bitStringTemp1.length; i += 6) {
            var index = parseInt(bitStringTemp1.substr(i, 6), 2);
            result += this.code[index];
        }
        bitStringTemp2 += new Array(7 - tail).join('0');
        if (tail) {
            result += this.code[parseInt(bitStringTemp2, 2)];
            result += new Array((6 - tail) / 2 + 1).join('=');
        }
        return result;
    };
    // base64编码转换为字节数组
    Utils.base64ToBin = function (str) {
        var bitString = '';
        var tail = 0;
        for (var i = 0; i < str.length; i++) {
            if (str[i] !== '=') {
                var decode = this.code.indexOf(str[i]).toString(2);
                bitString += new Array(7 - decode.length).join('0') + decode;
            }
            else {
                tail++;
            }
        }
        return bitString.substr(0, bitString.length - tail * 2);
    };
    // 字符串转换为字节数组
    Utils.stringToBin = function (str) {
        var result = '';
        for (var i = 0; i < str.length; i++) {
            var charCode = str.charCodeAt(i).toString(2);
            result += new Array(9 - charCode.length).join('0') + charCode;
        }
        return result;
    };
    // 字节数组转化为字符串
    Utils.binToStr = function (bin) {
        var result = '';
        for (var i = 0; i < bin.length; i += 8) {
            result += String.fromCharCode(parseInt(bin.substr(i, 8), 2));
        }
        return result;
    };
    Utils.code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');
    return Utils;
}());
exports.Utils = Utils;
//# sourceMappingURL=utils.js.map