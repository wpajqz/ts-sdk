import { Client } from "../index";

const client = new Client("ws://127.0.0.1:8081", null)
console.log(client.setRequestProperty("name", "stri"))
console.log(client.getRequestProperty("name"))
