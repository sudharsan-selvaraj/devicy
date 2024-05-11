import { BaseDeviceTracker } from './base';
import _, { add } from 'lodash';
import * as os from 'os';
import usbmux from '../usbmux';
import SimCtl from 'node-simctl';
import * as net from 'node:net';
import { DEVICE_TYPE, Device, PLATFORM } from '../types';

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
    this.usbMuxListener.on('attached', () => {});
    this.usbMuxListener.on('detached', () => {});
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
            brand: 'Apple',
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
