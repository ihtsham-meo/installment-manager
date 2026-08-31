const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  products: {
    list: () => ipcRenderer.invoke("products:list"),
    add: (product) => ipcRenderer.invoke("products:add", product),
    update: (id, product) => ipcRenderer.invoke("products:update", id, product),
    delete: (id) => ipcRenderer.invoke("products:delete", id),
  },

  customers: {
    list: () => ipcRenderer.invoke("customers:list"),
    checkCnic: (cnic) => ipcRenderer.invoke("customers:checkCnic", cnic),
    selectFile: () => ipcRenderer.invoke("customers:selectFile"),
    add: (customer) => ipcRenderer.invoke("customers:add", customer),
    update: (id, customer) =>
      ipcRenderer.invoke("customers:update", id, customer),
    delete: (id) => ipcRenderer.invoke("customers:delete", id),
  },

  sales: {
    list: () => ipcRenderer.invoke("sales:list"),
    getSchedule: (saleId) => ipcRenderer.invoke("sales:getSchedule", saleId),
    create: (saleData) => ipcRenderer.invoke("sales:create", saleData),
    void: (payload) => ipcRenderer.invoke("sales:void", payload),
  },
});
