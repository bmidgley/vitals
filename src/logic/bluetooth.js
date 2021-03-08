import { registerHandler as registerHandlerHealthtree, serviceUuid as serviceUuidHealthtree } from '../adapter/healthtree-pulse-oximetry.js';
import { registerHandler as registerHandlerViatom, serviceUuid as serviceUuidViatom } from '../adapter/viatom-pulse-oximetry.js';

const demo = document.body.querySelector('demo-view');

let isConnected = false;
let device = null;

function onDisconnected(e) {
  const t = event.target;
  // alert('Device ' + t.name + ' is disconnected.');
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
    optionalServices: [serviceUuidHealthtree, serviceUuidViatom],
    filters: [{ name: 'OXIMETER' }, { name: 'PC-60F_SN033668' }],
    //acceptAllDevices: true,
  });
  const server = await device.gatt.connect();

  registerHandlerViatom(server);
  registerHandlerHealthtree(server);

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
