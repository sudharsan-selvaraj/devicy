import { Device, DeviceListenerCallback, IDeviceTracker } from '../types';
import AsyncLock from 'async-lock';
const gsmarena = require('gsmarena-api');

const DEVICE_LOCK = new AsyncLock();

export abstract class BaseDeviceTracker implements IDeviceTracker {
  protected devices: Map<string, Device> = new Map();

  protected deviceConnectedListeners: DeviceListenerCallback[] = [];
  protected deviceDisconnectedListeners: DeviceListenerCallback[] = [];

  public onDeviceConnectLister(listener: DeviceListenerCallback) {
    this.deviceConnectedListeners.push(listener);
  }

  public onDeviceDisconnectLister(listener: DeviceListenerCallback) {
    this.deviceDisconnectedListeners.push(listener);
  }

  protected async onDeviceAdded(device: Device) {
    await this.executeWithLock(async () => {
      if (!this.devices.has(device.udid)) {
        this.devices.set(device.udid, device);
        this.deviceConnectedListeners.forEach((l) => l(device));
      }
    });
  }

  protected async onDeviceRemoved(udid: string) {
    await this.executeWithLock(async () => {
      if (this.devices.has(udid)) {
        const device = this.devices.get(udid);
        if (device) {
          this.devices.delete(udid);
          this.deviceDisconnectedListeners.forEach((l) => l(device));
        }
      }
    });
  }

  protected async getDeviceImage(deviceNames: string[]) {
    try {
      for (const name of deviceNames) {
        const deviceDetails = await gsmarena.search.search(name);
        if (deviceDetails.length && deviceDetails[0].img) {
          return deviceDetails[0].img;
        }
      }
    } catch (err) {
      return undefined;
    }
    return undefined;
  }

  protected async executeWithLock(fn: (args: any) => Promise<any>) {
    await DEVICE_LOCK.acquire('device-manager', fn);
  }

  public abstract start(): Promise<void>;
  public abstract stop(): Promise<void>;
}
