# devicy

devicy is a Node.js library designed for real-time detection of connected Android and iOS devices. It offers a simple and efficient way to identify devices connected to your development environment, aiding in device management.

## Installation

You can install devicy via npm:

```
npm install devicy
```

## Usage

```javascript
const { AndroidTracker, IosTracker } = require('devicy');

const deviceConnectedCallback = (device) => {
  console.log('*** Connected ***');
  console.log(device);
};

const deviceRemovecCallback = (device) => {
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
```

## Sample Output

```
*** Connected ***
{
  name: 'iPhone 14 Pro Max',
  osVersion: '16.1',
  udid: 'EF970804-C846-44FA-87DD-BDBE1F0A04C5',
  type: 'emulator',
  model: 'Iphone',
  platform: 'ios',
  brand: 'Apple',
  connectedTime: 2024-05-11T09:39:55.490Z,
  image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro-max-.jpg'
}
*** Connected ***
{
  udid: 'emulator-5554',
  name: 'Pixel_4_31',
  platform: 'android',
  type: 'emulator',
  model: 'sdk_gphone64_arm64',
  brand: 'Google',
  osVersion: '12',
  image: undefined
}

```

## Features

- **Real-time Detection:** devicy provides instant detection of Android and iOS devices connected to your system.
- **Cross-Platform:** Works seamlessly on various operating systems including Windows, macOS, and Linux.
- **Simple API:** Easy-to-use API for straightforward integration into your Node.js projects.
