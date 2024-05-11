import { AndroidTracker, Device, IosTracker } from '../src/index';

async function main() {
  const deviceConnectedCallback = (device: Device) => {
    console.log('*** Connected ***');
    console.log(device);
  };

  const deviceRemovecCallback = (device: Device) => {
    console.log('*** Removed ***');
    console.log(device);
  };

  // Detect connected devices
  const androidTracker = new AndroidTracker();
  const iosTracker = new IosTracker();
  androidTracker.addConnectionLister(deviceConnectedCallback);
  androidTracker.addDisconnectionListner(deviceRemovecCallback);

  iosTracker.addConnectionLister(deviceConnectedCallback);
  iosTracker.addDisconnectionListner(deviceRemovecCallback);

  await Promise.all([androidTracker.start(), iosTracker.start()]);
}
main();
