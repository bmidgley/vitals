import { handleData } from '../adapter/viatom-pulse-oximetry.js';

const demo = document.body.querySelector('demo-view');

const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const DEVICE_NAME = 'OXIMETER';

let isConnected = false;
let device = null;

function onDisconnected(e) {
  const t = event.target;
  alert('Device ' + t.name + ' is disconnected.');
  isConnected = false;
  device = null;
  demo.disconnected();
}

function disconnect() {
  isConnected = false;
  if (!device) throw new Error('no device found');
  if (!device.gatt.connected) throw new Error('already disconnected');
  device.gatt.disconnect();
  console.log('device disconnected');
}

async function connect() {
  console.log('connecting...');
  device = await navigator.bluetooth.requestDevice({
    optionalServices: [SERVICE_UUID],
    filters: [{ name: DEVICE_NAME }],
    //acceptAllDevices: true,
  });
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(SERVICE_UUID);
  const characteristics = await service.getCharacteristics();
  const oximetry = characteristics[3];

  console.log('characteristics', characteristics);
  console.log('oximetry', oximetry);

  oximetry.addEventListener('characteristicvaluechanged', handleData);
  oximetry.startNotifications();
  isConnected = true;
  device.addEventListener('gattserverdisconnected', onDisconnected);
}
async function toggleConnection() {
  try {
    if (isConnected) disconnect();
    else await connect();
    return isConnected;
  } catch (error) {
    console.error(error);
  }
}

export default toggleConnection;
