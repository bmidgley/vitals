import timely from '../logic/datetime.js';
import audio from '../logic/sound.js';

const demo = document.body.querySelector('demo-view');

let cache = [];
let previousMinute = 0;
let xAxis = 0;
let yAxis = 100;

let dataTable = [];

function parseVitals(arr) {
  const now = timely().format('HH:mm');
  const sats = arr[4];
  const bpm = arr[5];

  if (sats == 127) return;

  demo.sats = sats;
  demo.bpm = bpm;
  if (now !== previousMinute) {
    previousMinute = now;
    dataTable = [[now, sats, bpm], ...dataTable];
    demo.data = dataTable;
  }
}
function parseSignal(arr) {
  const intensity = arr.slice(10);
  if (intensity > 260) console.error('intensity more than 260', intensity);
  demo.bar = Math.trunc((intensity / 300) * 100);
}
function parseGraph(arr) {
  arr
  .filter((int) => int < 150) // filter anomalies
  .map((int) => {
    if (int > 80) audio('beep', true);
    //this._graph[this._graphCounter] = int;
    demo.beep = int / 150;
    const height = int;
    yAxis = demo.drawLine(xAxis, yAxis, height);
    xAxis++;
    if (xAxis > 300) xAxis = yAxis = 0;
  });
}
/**
 * Parse stream from pulse oximeter
 * @param {Array} arr index 5 = SpO2; 6 = HR; 8 = PI; 9 = ?
 */
function parseData(arr) {
  console.log(arr);
  switch (arr[3]) {
    case 0:
      parseVitals(arr);
      parseGraph(arr.slice(8, 37));
      return;
    case 3:
    case 6:
      return;
    case 7:
      parseSignal(arr);
      return;
    default:
      console.error('unknown flag', arr[3]);
  }
}

const NEW_LINE_FLAG = 255;

function handleData(e) {
  const t = e.target;
  let receivedData = new Uint8Array(t.value.byteLength);

  //let rawData = [];
  for (let i = 0; i < t.value.byteLength; i++) {
    receivedData[i] = t.value.getUint8(i);
    const value = t.value.getUint8(i);
    //rawData.push(value);
    if (value == NEW_LINE_FLAG) {
      parseData(cache);
      cache = [value];
    } else {
      cache = [...cache, value];
    }
  }
  //console.log(rawData);
}

const serviceUuid = '0000ffe0-0000-1000-8000-00805f9b34fb';

async function registerHandler(server) {
  const service = await server.getPrimaryService(serviceUuid);

  const characteristics = await service.getCharacteristics();
  const oximetry = characteristics[3];

  console.log('characteristics', characteristics);
  console.log('oximetry', oximetry);

  oximetry.addEventListener('characteristicvaluechanged', handleData);
  oximetry.startNotifications();
}

export { registerHandler, serviceUuid }

