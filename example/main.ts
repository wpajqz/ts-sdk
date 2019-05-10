import { Client } from '../src/client';

const url = 'ws://127.0.0.1:8081';
const client = new Client(
  url,
  new (class {
    public onOpen(): void {
      client.ping(
        {},
        new (class {
          public onStart(): void {
            console.log('start ping');
          }

          public onSuccess(data: string): void {
            console.log('ping successful:', data);
          }

          public onError(code: number, message: string): void {
            console.log('ping error:', message);
          }

          public onEnd(): void {
            console.log('end ping');
          }
        })(),
      );

      client.syncSend(
        '/v1/healthy',
        {},
        new (class {
          public onStart(): void {
            console.log('start request');
          }

          public onSuccess(data: string): void {
            console.log('request successful:', data);
          }

          public onError(code: number, message: string): void {
            console.log('request error:', message);
          }

          public onEnd(): void {
            console.log('end request');
          }
        })(),
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
