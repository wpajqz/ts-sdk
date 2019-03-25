import { Utils } from './utils';
import * as Int64 from 'node-int64';

export class Packet {
  private static key = 'b8ca9aa66def05ff3f24919274bb4a66';
  private static operator: number;
  private static sequence: number;
  private static headerLength: number;
  private static bodyLength: number;
  private static header: string;
  private static body: string;

  private static pack(
    operator: number,
    sequence: number,
    header: string,
    body: string,
  ): ArrayBuffer {
    const header = Utils.encrypt(header, Packet.key, Packet.key);
    const body = Utils.encrypt(body, Packet.key, Packet.key);

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

  private static unPack(data: ArrayBuffer): Packet {
    const dataView = new DataView(data);

    Packet.operator = dataView.getUint32(0, false);
    Packet.sequence = new Int64(
      new Uint8Array(dataView.buffer.slice(4, 12)),
    ).toNumber();
    Packet.headerLength = dataView.getUint32(12, false);
    Packet.bodyLength = dataView.getUint32(16, false);

    const header = Utils.ab2str(
      dataView.buffer.slice(20, 20 + Packet.headerLength),
    );
    const body = Utils.ab2str(dataView.buffer.slice(20 + Packet.headerLength));

    Packet.header = Utils.decrypt(header, Packet.key, Packet.key);
    Packet.body = Utils.decrypt(body, Packet.key, Packet.key);

    return Packet;
  }
}
