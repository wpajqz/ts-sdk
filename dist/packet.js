"use strict";
exports.__esModule = true;
var utils_1 = require("./utils");
var Int64 = require("node-int64");
var Packet = /** @class */ (function () {
    function Packet() {
    }
    Packet.pack = function (operator, sequence, header, body) {
        var header = utils_1.Utils.encrypt(header, Packet.key, Packet.key);
        var body = utils_1.Utils.encrypt(body, Packet.key, Packet.key);
        var headerLength = header.length;
        var bodyLength = body.length;
        var buf = new ArrayBuffer(20 + headerLength + bodyLength);
        var dataView = new DataView(buf);
        var nsBuf = new Int64(sequence).toBuffer();
        dataView.setUint32(0, operator);
        dataView.setUint32(12, headerLength);
        dataView.setUint32(16, bodyLength);
        var bufView = new Uint8Array(buf);
        for (var i = 0; i < 8; i++) {
            bufView[4 + i] = nsBuf[i];
        }
        for (var i_1 = 0; i_1 < headerLength; i_1++) {
            bufView[20 + i_1] = header.charCodeAt(i_1);
        }
        for (var i_2 = 0; i_2 < bodyLength; i_2++) {
            bufView[20 + headerLength + i_2] = body.charCodeAt(i_2);
        }
        return buf;
    };
    Packet.unPack = function (data) {
        var dataView = new DataView(data);
        Packet.operator = dataView.getUint32(0, false);
        Packet.sequence = new Int64(new Uint8Array(dataView.buffer.slice(4, 12))).toNumber();
        Packet.headerLength = dataView.getUint32(12, false);
        Packet.bodyLength = dataView.getUint32(16, false);
        var header = utils_1.Utils.ab2str(dataView.buffer.slice(20, 20 + Packet.headerLength));
        var body = utils_1.Utils.ab2str(dataView.buffer.slice(20 + Packet.headerLength));
        Packet.header = utils_1.Utils.decrypt(header, Packet.key, Packet.key);
        Packet.body = utils_1.Utils.decrypt(body, Packet.key, Packet.key);
        return Packet;
    };
    Packet.key = 'b8ca9aa66def05ff3f24919274bb4a66';
    return Packet;
}());
exports.Packet = Packet;
//# sourceMappingURL=packet.js.map