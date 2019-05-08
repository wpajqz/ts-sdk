import { Client } from "../index";

const client = new Client("ws://127.0.0.1:8081", new class {
  onOpen(ev:Event) {
    console.log("open connection", ev.target)
  }

  onClose(ev:Event) {
    console.log("connection error", ev)
    console.log(ev)
  }

  onError(ev:Event){
    console.log("close connection")
  }
})


console.log(client)
