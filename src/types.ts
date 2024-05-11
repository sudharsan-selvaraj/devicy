enum PLATFORM {
  IOS = 'ios',
  ANDROID = 'android',
}

enum DEVICE_TYPE {
  REAL = 'real',
  EMULATOR = 'emulator',
}

type DeviceInfo = {};

type Device = {
  udid: string;
  name: string;
  platform: PLATFORM;
  type: DEVICE_TYPE;
  model: string;
  brand: string;
  connectedTime: Date;
  osVersion: string;
  image?: string;
};

interface IDeviceTracker {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  onDeviceConnectLister: (listener: DeviceListenerCallback) => void;
  onDeviceDisconnectLister: (listener: DeviceListenerCallback) => void;
}

type DeviceListenerCallback = (device: Device) => void;

export { PLATFORM, DEVICE_TYPE, DeviceInfo, Device, IDeviceTracker, DeviceListenerCallback };
