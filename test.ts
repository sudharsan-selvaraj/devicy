import { gunzip } from 'zlib';
import { AndroidTracker, IosTracker } from './src/index';

async function main() {
  const tracker = new IosTracker();
  // const tracker = new AndroidTracker();
  tracker.onDeviceConnectLister((d) => {
    console.log('*** Connected ***');
    console.log(d);
  });
  tracker.onDeviceDisconnectLister((d) => {
    console.log('*** Removed ***');
    console.log(d);
  });

  await tracker.start();

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
