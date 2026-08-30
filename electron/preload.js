const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  products: {
    list: () => ipcRenderer.invoke("products:list"),
    add: (product) => ipcRenderer.invoke("products:add", product),
    update: (id, product) => ipcRenderer.invoke("products:update", id, product),
    delete: (id) => ipcRenderer.invoke("products:delete", id),
  },
});
