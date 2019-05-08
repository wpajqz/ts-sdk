import { Client } from '../index';

const url = 'ws://127.0.0.1:8081';
const client = new Client(
  url,
  new (class {
    onOpen(ev: Event) {
      console.log('open connection', ev.target);
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

console.log(client);
