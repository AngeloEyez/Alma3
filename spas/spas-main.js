import { ipcMain } from "electron";
import { SpasConnector } from "./SpasConnector";

const sc = new SpasConnector();

ipcMain.handle("spas/do", async (event, message) => {
  console.log(`receive message from render: ${message}`);
  const result = await sc.do(message);
  //console.log(`return message : ${result}`);
  return result;
});

ipcMain.handle("spas/get", async (event, message) => {
  return await sc.settings.get(message);
});

ipcMain.handle("spas/getAll", (event, message) => {
  return sc.settings.store;
});

ipcMain.handle("spas/set", async (event, message) => {
  let msg = JSON.parse(message);
  sc.settings.set(msg.key, msg.value);
  return true;
});

export default sc;
