import { gunzip } from 'zlib';
import { AndroidTracker, Device, IosTracker } from './src/index';

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

  // (async function() {
  //   const gsmarena = require('./index');
  //     const devices = await gsmarena.search.search('Redmi Note 7 Pro');
  //     console.log(devices);

  //     // const devices = await gsmarena.catalog.getDevice("samsung_galaxy_s23+-12083")
  //     // console.log(devices);

  //     //  const devices = await gsmarena.catalog.getDevice("xiaomi_redmi_note_10_lite-11137")
  //     // // console.log(JSON.stringify(devices, null, 2));
  //     // console.log(devices)
  // })()
}

main();
