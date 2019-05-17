import { Client } from '../src/';
import { WebsocketError, WebSocketResp } from '../src/types';

const url = 'ws://127.0.0.1:8081';
const client = new Client(url, {
  onOpen(): void {
    client
      .ping({})
      .then(
        (res: WebSocketResp): void => {
          console.log('ping sucessful:', res);
        },
      )
      .catch(
        (reason: WebsocketError): void => {
          console.log('ping error:', reason.code, reason.msg);
        },
      );

    client
      .request('/v1/healthy', {})
      .then(
        (res: WebSocketResp): void => {
          console.log('request successful:', res);
        },
      )
      .catch(
        (reason: WebsocketError): void => {
          console.log('request error:', reason.code, reason.msg);
        },
      );
  },

  onClose(ev: Event): void {
    console.log('connection error', ev);
    console.log(ev);
  },

  onError(): void {
    console.log('close connection');
  },
});

client.enableLogger = true;
