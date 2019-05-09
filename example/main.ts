import { Client } from '../src/client';

const url = 'ws://127.0.0.1:8081';
const client = new Client(
  url,
  new (class {
    onOpen(ev: Event) {
      client.ping(
        {},
        new (class {
          onStart(): void {
            console.log('start ping');
          }

          onSuccess(data: string): void {
            console.log('ping successful:', data);
          }

          onError(code: number, message: string): void {
            console.log('ping error:', message);
          }

          onEnd(): void {
            console.log('end ping');
          }
        })(),
      );

      client.syncSend(
        '/v1/healthy',
        {},
        new (class {
          onStart(): void {
            console.log('start request');
          }

          onSuccess(data: string): void {
            console.log('request successful:', data);
          }

          onError(code: number, message: string): void {
            console.log('request error:', message);
          }

          onEnd(): void {
            console.log('end request');
          }
        })(),
      );
    }

    onClose(ev: Event) {
      console.log('connection error', ev);
      console.log(ev);
    }

    onError(ev: Event) {
      console.log('close connection');
    }
  })(),
);
