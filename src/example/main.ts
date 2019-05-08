import { Client } from '../index';

const url = 'ws://127.0.0.1:8081';
const client = new Client(
  url,
  new (class {
    onOpen(ev: Event) {
      client.ping(
        undefined,
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
