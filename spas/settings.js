//const Store = require("electron-store");
import Store from "electron-store";

// default settings
const storeConfig = {
  name: "almaconfig",
  defaults: {
    signIn: {
      workId: "",
      password: "spas"
    },
    token: "",
    workStartTime: "07:36",
    workEndTime: "17:05",
    disabledProject: [1696, 1697],
    simultaneousGroup: []
  }
};

export const Settings = new Store(storeConfig);
