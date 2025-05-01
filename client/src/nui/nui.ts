// src/nui/nui.ts
interface NUIMessage {
  action: string;
  vehicles?: any[];
  message?: string;
  plate?: string;
  isAdmin?: boolean;
  error?: string;
  spawnedVehicles?: { [plate: string]: boolean };
}

export const onNUIMessage = (callback: (message: NUIMessage) => void) => {
  window.addEventListener('message', (event) => {
    const message = event.data as NUIMessage;
    if (message.action) {
      callback(message);
    }
  });
};