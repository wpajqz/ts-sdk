import { AES, enc, mode, pad } from 'crypto-js';

class Utils {
  private static code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split(
    '',
  );

  public static crc32(str: string): number {
    let crcTable =
      (<any>window).crcTable || ((<any>window).crcTable = Utils.makeCRCTable());
    let crc = 0 ^ -1;

    for (let i = 0; i < str.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff];
    }

    return (crc ^ -1) >>> 0;
  }

  // ArrayBuffer 转为字符串，参数为 ArrayBuffer 对象
  public static ab2str(buf: ArrayBuffer): string {
    // 注意，如果是大型二进制数组，为了避免溢出，必须一个一个字符地转
    if (buf && buf.byteLength < 1024) {
      return String.fromCharCode.apply(null, new Uint8Array(buf));
    }

    let bufView = new Uint8Array(buf);
    let len = bufView.length;
    let byteStr = new Array(len);

    for (let i = 0; i < len; i++) {
      byteStr[i] = String.fromCharCode.call(null, bufView[i]);
    }

    return byteStr.join('');
  }

  // 字符串转为 ArrayBuffer 对象，参数为字符串
  public static str2ab(str: string): ArrayBuffer {
    let buf = new ArrayBuffer(str.length); // 每个字符占用2个字节
    let bufView = new Uint8Array(buf);

    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }

    return buf;
  }

  // 解密服务端传递过来的字符串
  public static decrypt(data: string, key: string, iv: string): string {
    const binData = Utils.stringToBin(data);
    const base64Data = Utils.binToBase64(binData);

    const bytes = AES.decrypt(base64Data, enc.Latin1.parse(key), {
      iv: enc.Latin1.parse(iv),
      mode: mode.CBC,
      padding: pad.Pkcs7,
    });

    return bytes.toString(enc.Utf8);
  }

  // 加密字符串以后传递到服务端
  public static encrypt(data: string, key: string, iv: string): string {
    const result = AES.encrypt(data, enc.Latin1.parse(key), {
      iv: enc.Latin1.parse(iv),
      mode: mode.CBC,
      padding: pad.Pkcs7,
    });

    return Utils.binToString(Utils.base64ToBin(result.toString()));
  }

  // 字节数组转换为base64编码
  public static binToBase64(bitString: string): string {
    let result = '';
    let tail = bitString.length % 6;
    let bitStringTemp1 = bitString.substr(0, bitString.length - tail);
    let bitStringTemp2 = bitString.substr(bitString.length - tail, tail);

    for (let i = 0; i < bitStringTemp1.length; i += 6) {
      let index = parseInt(bitStringTemp1.substr(i, 6), 2);
      result += Utils.code[index];
    }

    bitStringTemp2 += new Array(7 - tail).join('0');
    if (tail) {
      result += Utils.code[parseInt(bitStringTemp2, 2)];
      result += new Array((6 - tail) / 2 + 1).join('=');
    }

    return result;
  }

  // base64编码转换为字节数组
  public static base64ToBin(str: string): string {
    let bitString = '';
    let tail = 0;

    for (let i = 0; i < str.length; i++) {
      if (str[i] !== '=') {
        let decode = this.code.indexOf(str[i]).toString(2);
        bitString += new Array(7 - decode.length).join('0') + decode;
      } else {
        tail++;
      }
    }

    return bitString.substr(0, bitString.length - tail * 2);
  }

  // 字符串转换为字节数组
  public static stringToBin(str: string): string {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      let charCode = str.charCodeAt(i).toString(2);
      result += new Array(9 - charCode.length).join('0') + charCode;
    }

    return result;
  }

  // 字节数组转化为字符串
  public static binToString(bin: string): string {
    let result = '';
    for (let i = 0; i < bin.length; i += 8) {
      result += String.fromCharCode(parseInt(bin.substr(i, 8), 2));
    }

    return result;
  }

  private static makeCRCTable(): number[] {
    let c: number;
    let crcTable: number[] = [];

    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c;
    }

    return crcTable;
  }
}

export { Utils };
