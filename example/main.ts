import { Client } from '../src/client';
import { WebsocketError } from './error';

const url = 'ws://127.0.0.1:8081';
const client = new Client(
  url,
  new (class {
    public onOpen(): void {
      client
        .ping({})
        .then(
          (res: string): void => {
            console.log('ping sucessful:', res);
          },
        )
        .catch(
          (reason: WebsocketError): void => {
            console.log('ping error:', reason.code, reason.msg);
          },
        );

      client
        .request('/v1/healthy/a', {})
        .then(
          (res: string): void => {
            console.log('request successful:', res);
          },
        )
        .catch(
          (reason: WebsocketError): void => {
            console.log('request error:', reason.code, reason.msg);
          },
        );
    }

    public onClose(ev: Event): void {
      console.log('connection error', ev);
      console.log(ev);
    }

    public onError(): void {
      console.log('close connection');
    }
  })(),
);
