"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var constant = require("./constant");
var packet_1 = require("./packet");
var utils_1 = require("./utils");
/**
 * Client ws client, 单例模式, 负责维护连接
 */
var Client = /** @class */ (function () {
    function Client(url, readyStateCallback) {
        if (!('WebSocket' in window)) {
            return;
        }
        this.requestHeader = '';
        this.maxPayload = constant.MAX_PAYLOAD;
        this.url = url;
        this.readyStateCallback = readyStateCallback;
        this.reconnectTimes = 0;
        this.reconnectLock = false;
        this.socket = this.connect();
    }
    // 向服务端发送ping包保持长连接
    Client.prototype.ping = function (param, callback) {
        if (param === void 0) { param = {}; }
        if (callback === void 0) { callback = {}; }
        if (typeof callback !== 'object') {
            throw new Error('callback must be an object');
        }
        if (this.socket.readyState !== this.socket.OPEN) {
            throw new Error('asyncSend: connection refuse');
        }
        var _this = this;
        this.addMessageListener(0, function (data) {
            var code = _this.getResponseProperty('code');
            if (typeof code !== 'undefined') {
                var message = _this.getResponseProperty('message');
                if (this.callback.onError !== null) {
                    this.callback.onError(code, message);
                }
            }
            else {
                this.callback.onSuccess(data);
            }
            this.callback.onEnd();
        });
        var p = new packet_1.Packet();
        _this.send(p.pack(0, 0, _this.requestHeader, JSON.stringify(param)));
    };
    Client.prototype.send = function (data) {
        if (this.socket.readyState !== this.socket.OPEN) {
            console.error('WebSocket is already in CLOSING or CLOSED state.');
            return;
        }
        try {
            this.socket.send(data);
        }
        catch (e) {
            console.log('send data error', e);
        }
    };
    /**
     * asyncSend
     * @param {*} operator
     * @param {*} param
     * @param {*} callback 仅此次有效的callback
     */
    Client.prototype.asyncSend = function (operator, param, callback) {
        console.info('websocket send data', operator, this.requestHeader, param);
        if (typeof callback !== 'object') {
            throw new Error('callback must be an object');
        }
        if (this.socket.readyState !== this.socket.OPEN) {
            throw new Error('asyncSend: connection refuse');
        }
        if (callback.hasOwnProperty('onStart') &&
            typeof callback.onStart === 'function') {
            callback.onStart();
        }
        var _this = this;
        var sequence = new Date().getTime();
        var listener = utils_1.Utils.crc32(operator) + sequence;
        this.callback[listener] = function (data) {
            var code = _this.getResponseProperty('code');
            if (typeof code !== 'undefined') {
                var message = _this.getResponseProperty('message');
                if (callback.hasOwnProperty('onError') &&
                    typeof callback.onError === 'function') {
                    callback.onError(code, message);
                }
            }
            else {
                if (callback.hasOwnProperty('onSuccess') &&
                    typeof callback.onSuccess === 'function') {
                    callback.onSuccess(data);
                }
            }
            if (callback.hasOwnProperty('onEnd') &&
                typeof callback.onEnd === 'function') {
                callback.onEnd();
            }
            delete _this.callback[listener];
        };
        var p = new packet_1.Packet();
        this.send(p.pack(utils_1.Utils.crc32(operator), sequence, this.requestHeader, JSON.stringify(param)));
    };
    // 同步请求服务端数据
    Client.prototype.syncSend = function (operator, param, callback) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.asyncSend(operator, param, callback)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // 添加消息监听
    Client.prototype.addMessageListener = function (operator, listener) {
        this.callback[utils_1.Utils.crc32(operator)] = listener;
    };
    // 移除消息监听
    Client.prototype.removeMessageListener = function (operator) {
        delete this.callback[utils_1.Utils.crc32(operator)];
    };
    // 获取socket的链接状态
    Client.prototype.getReadyState = function () {
        return this.socket.readyState;
    };
    // 设置单个请求能够处理的最大字节数
    Client.prototype.setMaxPayload = function (maxPayload) {
        this.maxPayload = maxPayload;
    };
    // 设置请求属性
    Client.prototype.setRequestProperty = function (key, value) {
        var v = this.getRequestProperty(key);
        this.requestHeader = this.requestHeader.replace(key + '=' + v + ';', '');
        this.requestHeader = this.requestHeader + key + '=' + value + ';';
    };
    // 获取请求属性
    Client.prototype.getRequestProperty = function (key) {
        var values = this.requestHeader.split(';');
        for (var index in values) {
            var kv = values[index].split('=');
            if (kv[0] === key) {
                return kv[1];
            }
        }
    };
    // 设置Response属性
    Client.prototype.setResponseProperty = function (key, value) {
        var v = this.getResponseProperty(key);
        this.responseHeader = this.responseHeader.replace(key + '=' + v + ';', '');
        this.responseHeader = this.responseHeader + key + '=' + value + ';';
    };
    // 获取响应属性
    Client.prototype.getResponseProperty = function (key) {
        var values = this.responseHeader.split(';');
        for (var index in values) {
            var kv = values[index].split('=');
            if (kv[0] === key) {
                return kv[1];
            }
        }
    };
    // 创建连接
    Client.prototype.connect = function () {
        var url = this.url;
        var readyStateCallback = this.readyStateCallback;
        var ws = new WebSocket(url);
        var _this = this;
        ws.binaryType = 'blob';
        ws.onopen = function (ev) {
            console.info('websocket connected');
            _this.reconnectTimes = 0;
            if (readyStateCallback.hasOwnProperty('onopen') &&
                typeof readyStateCallback.onopen === 'function') {
                readyStateCallback.onopen(ev);
            }
        };
        ws.onclose = function (ev) {
            console.info('websocket disconnected');
            _this.reconnect();
            if (readyStateCallback.hasOwnProperty('onclose') &&
                typeof readyStateCallback.onclose === 'function') {
                readyStateCallback.onclose(ev);
            }
        };
        ws.onerror = function (ev) {
            console.info('websocket error disconnected');
            _this.reconnect();
            if (readyStateCallback.hasOwnProperty('onerror') &&
                typeof readyStateCallback.onerror === 'function') {
                readyStateCallback.onerror(ev);
            }
        };
        ws.onmessage = function (ev) {
            if (ev.data instanceof Blob) {
                var reader = new FileReader();
                reader.readAsArrayBuffer(ev.data);
                reader.onload = function () {
                    try {
                        var packet = new packet_1.Packet().unPack(this.result);
                        var packetLength = packet.headerLength + packet.bodyLength + 20;
                        if (packetLength > constant.MAX_PAYLOAD) {
                            throw new Error('the packet is big than ' + constant.MAX_PAYLOAD);
                        }
                        var operator = Number(packet.operator) + Number(packet.sequence);
                        if (_this.callback.hasOwnProperty(operator)) {
                            if (packet.body === '') {
                                packet.body = '{}';
                            }
                            _this.responseHeader = packet.header;
                            _this.callback[operator](JSON.parse(packet.body));
                        }
                        if (operator !== 0 && packet.body !== 'null') {
                            console.info('receive data', packet.body);
                        }
                    }
                    catch (e) {
                        console.info(e);
                        throw new Error(e);
                    }
                };
            }
            else {
                throw new Error('websocket unsupported data format');
            }
        };
        return ws;
    };
    Client.prototype.reconnect = function () {
        var _this_1 = this;
        if (!this.reconnectLock) {
            this.reconnectLock = true;
            console.info('websocket reconnect in ' + this.reconnectTimes + 's');
            // 尝试重连
            setTimeout(function () {
                _this_1.reconnectTimes++;
                _this_1.socket = _this_1.connect();
                _this_1.reconnectLock = false;
            }, this.reconnectTimes * 1000);
        }
    };
    return Client;
}());
exports.Client = Client;
//# sourceMappingURL=index.js.map