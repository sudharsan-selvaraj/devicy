import Adb, { Client, DeviceWithPath } from '@devicefarmer/adbkit';
import { BaseDeviceTracker } from './base';
import Tracker from '@devicefarmer/adbkit/dist/src/adb/tracker';
import asyncWait from 'async-wait-until';
import { DEVICE_TYPE, Device, PLATFORM } from '../types';

interface AndroidTrackerOptions {
  realDeviceOnly?: boolean;
  waitForDeviceBooting?: boolean;
  adb?: {
    host?: string;
    port?: number;
    bin?: string;
    timeout?: number;
  };
}

const DEFAULT_OPTIONS = {
  realDeviceOnly: false,
  waitForDeviceBooting: true,
};

class AndroidTracker extends BaseDeviceTracker {
  private adbClient: Client;
  private tracker!: Tracker;

  constructor(private options: AndroidTrackerOptions = DEFAULT_OPTIONS) {
    super();
    this.adbClient = Adb.createClient(options.adb || {});
  }

  async start(): Promise<void> {
    try {
      await this.initialiseTracker();
      await this.getInitialDeviceList();
    } catch (err) {}
  }

  async stop(): Promise<void> {}

  private async getInitialDeviceList() {
    const devices = await this.adbClient.listDevices();
    devices.forEach(this.onDeviceConnected.bind(this));
  }

  private async initialiseTracker() {
    if (!this.tracker) {
      this.tracker = await this.adbClient.trackDevices();
      this.tracker.on('add', this.onDeviceConnected.bind(this));
      this.tracker.on('remove', async (device: any) => await this.onDeviceRemoved(device.id));
      this.tracker.on('error', (err) => console.log(err));
      this.tracker.on('end', () => {
        this.tracker = null as any;
        this.initialiseTracker();
      });
    }
  }

  private async onDeviceConnected(device: { id: string }) {
    try {
      await this.waitForDeviceBoot(device.id);
      const deviceInfo = await this.fetchDeviceDetails(device.id);
      if (deviceInfo) {
        await this.onDeviceAdded(deviceInfo);
      }
    } catch (err) {}
  }

  private async waitForDeviceBoot(deviceId: string) {
    const deviceClient = this.adbClient.getDevice(deviceId);
    return await asyncWait(() => deviceClient.waitBootComplete().catch(() => false), {
      intervalBetweenAttempts: 2000,
      timeout: 60 * 1000,
    });
  }

  private async fetchDeviceDetails(deviceId: string): Promise<Device | null> {
    try {
      const deviceClient = this.adbClient.getDevice(deviceId);
      const properties = await deviceClient.getProperties();
      const isRealDevice = properties['ro.build.characteristics'] !== 'emulator';
      const name = this.getDeviceName(isRealDevice, properties);
      const model = properties['ro.product.model'];
      return {
        udid: deviceId,
        name: name,
        platform: PLATFORM.ANDROID,
        type: isRealDevice ? DEVICE_TYPE.REAL : DEVICE_TYPE.EMULATOR,
        model: model,
        brand: properties['ro.product.manufacturer'],
        osVersion: properties['ro.build.version.release'],
        image: isRealDevice ? await this.getDeviceImage([name, model]) : undefined,
      } as Device;
    } catch (err) {}
    return null;
  }

  private getDeviceName(isReal: boolean, properties: { [key: string]: string }) {
    let propNames = [];
    if (isReal) {
      propNames = ['ro.vendor.oplus.market.name', 'ro.display.series', 'ro.product.name'];
    } else {
      propNames = ['ro.kernel.qemu.avd_name', 'ro.boot.qemu.avd_name'];
    }
    const matchedProp = propNames.find((prop) => !!properties[prop]);
    return matchedProp ? properties[matchedProp] : undefined;
  }
}

export { AndroidTracker };
