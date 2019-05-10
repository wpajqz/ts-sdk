import { Utils } from './utils';
import Int64 from 'node-int64';

export class Packet {
  private key: string = 'b8ca9aa66def05ff3f24919274bb4a66';
  public operator: number;
  public sequence: number;
  public headerLength: number;
  public bodyLength: number;
  public header: string;
  public body: string;

  public pack(
    operator: number,
    sequence: number,
    header: string,
    body: string,
  ): ArrayBuffer {
    header = Utils.encrypt(header, this.key, this.key);
    body = Utils.encrypt(body, this.key, this.key);

    const headerLength = header.length;
    const bodyLength = body.length;

    const buf = new ArrayBuffer(20 + headerLength + bodyLength);
    const dataView = new DataView(buf);
    const nsBuf = new Int64(sequence).toBuffer();

    dataView.setUint32(0, operator);
    dataView.setUint32(12, headerLength);
    dataView.setUint32(16, bodyLength);

    let bufView = new Uint8Array(buf);
    for (var i = 0; i < 8; i++) {
      bufView[4 + i] = nsBuf[i];
    }
    for (let i = 0; i < headerLength; i++) {
      bufView[20 + i] = header.charCodeAt(i);
    }

    for (let i = 0; i < bodyLength; i++) {
      bufView[20 + headerLength + i] = body.charCodeAt(i);
    }

    return buf;
  }

  public unPack(data: ArrayBuffer | SharedArrayBuffer): Packet {
    const dataView = new DataView(data);

    this.operator = dataView.getUint32(0, false);
    this.sequence = new Int64(
      new Uint8Array(dataView.buffer.slice(4, 12)),
    ).toNumber();
    this.headerLength = dataView.getUint32(12, false);
    this.bodyLength = dataView.getUint32(16, false);

    const header = Utils.ab2str(
      dataView.buffer.slice(20, 20 + this.headerLength),
    );
    const body = Utils.ab2str(dataView.buffer.slice(20 + this.headerLength));

    this.header = Utils.decrypt(header, this.key, this.key);
    this.body = Utils.decrypt(body, this.key, this.key);

    return this;
  }
}
