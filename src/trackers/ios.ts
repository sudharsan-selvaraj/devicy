import { BaseDeviceTracker } from './base';
import _, { add } from 'lodash';
import * as os from 'os';
import usbmux from '../usbmux';
import SimCtl from 'node-simctl';
import * as net from 'node:net';
import { DEVICE_TYPE, Device, PLATFORM } from '../types';
import { utilities as IOSUtils } from 'appium-ios-device';

interface IosTrackerOptions {
  realDeviceOnly?: boolean;
  simulator?: {
    trackingIntervalMs?: number;
  };
}

const DEFAULT_OPTIONS = {
  realDeviceOnly: false,
  simulator: {
    trackingIntervalMs: 10000,
  },
};

const isMac = () => os.type().toLowerCase() === 'darwin';

const APPLE_BRAND = 'Apple';
class IosTracker extends BaseDeviceTracker {
  private simulatorTracker!: NodeJS.Timeout;
  private usbMuxListener!: net.Socket;
  private simctl!: SimCtl;

  constructor(protected options: IosTrackerOptions = {}) {
    super();
    this.options = _.defaultsDeep(DEFAULT_OPTIONS, options);
  }

  public async start(): Promise<void> {
    try {
      await this.trackRealIosDevices();
      if (!this.options.realDeviceOnly && isMac()) {
        await this.trackIosSimulators();
        setInterval;
      }
    } catch (err) {}
  }

  private async trackRealIosDevices() {
    this.usbMuxListener = usbmux.createListener();
    this.usbMuxListener.on('attached', async (udid: string) => {
      const [osVersion, name, deviceInfo] = await Promise.all([
        IOSUtils.getOSVersion(udid),
        IOSUtils.getDeviceName(udid),
        await IOSUtils.getDeviceInfo(udid),
      ]);

      // BoardId: 24,
      // BuildVersion: '20D67',
      // CPUArchitecture: 'arm64e',
      // ChipID: 32816,
      // DeviceClass: 'iPad',
      // DeviceColor: '1',
      // DeviceName: 'Shoba’s ipad',
      // DieID: 3751791811412014,
      // HardwareModel: 'J181AP',
      // HasSiDP: true,
      // PartitionType: 'GUID_partition_scheme',
      // ProductName: 'iPhone OS',
      // ProductType: 'iPad12,1',
      // ProductVersion: '16.3.1',
      // ProductionSOC: true,
      // ProtocolVersion: '2',
      // SupportedDeviceFamilies: [ 1, 2 ],
      // TelephonyCapability: false,
      // UniqueChipID: 3751791811412014,
      // UniqueDeviceID: '00008030-000D543C1A30C02E'

      const model = deviceInfo['ProductType']?.split(',')[0];
      const device: Device = {
        udid,
        name,
        osVersion,
        platform: PLATFORM.IOS,
        type: DEVICE_TYPE.REAL,
        brand: APPLE_BRAND,
        connectedTime: new Date(),
        image: await this.getDeviceImage([name, model]),
        model: model,
      };
      this.onDeviceAdded(device);
    });
    this.usbMuxListener.on('detached', this.onDeviceRemoved.bind(this));
  }

  private async trackIosSimulators() {
    if (!this.simulatorTracker) {
      this.simctl = new SimCtl();
      await this.refreshSimulatorList();
      this.simulatorTracker = setInterval(
        this.refreshSimulatorList.bind(this),
        this.options.simulator?.trackingIntervalMs
      );
    }
  }

  private async refreshSimulatorList() {
    const added: Device[] = [],
      removed: Device[] = [];
    const devices = await this.simctl.getDevices();

    const promiseArr = _.flatten(Object.values(devices))
      .filter((d: any) => d.isAvailable)
      .map(async (d: any) => {
        if (this.devices.has(d.udid)) {
          if (d.state?.toLowerCase() == 'shutdown') {
            removed.push(this.devices.get(d.udid) as Device);
          }
        } else if (d.state?.toLowerCase() == 'booted') {
          added.push({
            name: d.name,
            osVersion: d.sdk,
            udid: d.udid,
            type: DEVICE_TYPE.EMULATOR,
            model: d.name.toLowerCase().includes('iphone') ? 'Iphone' : 'Ipad',
            platform: PLATFORM.IOS,
            brand: APPLE_BRAND,
            connectedTime: new Date(),
            image: await this.getDeviceImage([d.name]),
          });
        }
      });

    await Promise.all(promiseArr);
    for (const addedDevice of added) {
      await this.onDeviceAdded(addedDevice);
    }

    for (const removedDevice of removed) {
      await this.onDeviceRemoved(removedDevice.udid);
    }
  }

  public async stop(): Promise<void> {
    this.usbMuxListener.end();
    clearInterval(this.simulatorTracker);
  }
}

export { IosTracker };
