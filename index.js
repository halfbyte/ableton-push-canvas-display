const USB = require('usb')
const PUSH_VID = 0x2982
const PUSH_PID = 0x1967
const PUSH_FRAME_SIZE = 327680
const PUSH_LINE_SIZE = 2048
const PUSH_BUFFER_SIZE = PUSH_FRAME_SIZE
const PUSH_XOR_PATTERN = 0xFFE7F3E7
const PUSH_BUFFER_COUNT = PUSH_FRAME_SIZE / PUSH_BUFFER_SIZE
const PUSH_FRAME_HEADER = [0xFF, 0xCC, 0xAA, 0x88, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ]

var endpoint;
var interface;

const frameData = new ArrayBuffer(327680)

/* The actual conversion function */
function convertImage(image, frame) {
  var y,h,x,w;
  for(y=0;y<160;y++) {
    const frameLineStart = PUSH_LINE_SIZE * y
    const frameLine = new Uint16Array(frame, frameLineStart, PUSH_LINE_SIZE / 2)
    for(x=0;x<1024;x++) {
      var word = 0
      if (x < 960) {
        const off = (y * 3840) + x * 4
        const r = image[off + 0] >> 3
        const g = image[off + 1] >> 2
        const b = image[off + 2] >> 3
        word = (r & 0b11111) | ((g & 0b111111) << 5) | ((b & 0b11111) << 11)
      }
      var mask = 0xF3E7
      if (x & 1 > 0) {
        mask = 0xFFE7
      }
      frameLine[x] = word ^ mask
    }
  }
}
/* this is thi actual device init */
function _init(device) {
  if (device == null) { return; }
  device.open()
  const pushInterface = device.interface(0)
  pushInterface.claim()
  endpoint = pushInterface.endpoint(1)
}

/**
 * initialize the push device. his will open the push device and claim the display interface.
 * This function also sets up callbacks for later device addition, so that the push gets
 * initialized if added to the system later
 * @param { function(error) } callback - callback will be called after init. Follows node's "error first" async convention
 */
function initPush(callback) {
  var push = USB.findByIds(PUSH_VID, PUSH_PID)
  USB.on('attach', function(device) {
    if (device.deviceDescriptor.idVendor === PUSH_VID && device.deviceDescriptor.idProduct === PUSH_PID) {
      _init(device)
    }
  })
  USB.on('detach', function(device) {
    if (device.deviceDescriptor.idVendor === PUSH_VID && device.deviceDescriptor.idProduct === PUSH_PID) {
      endpoint = null
    }
  })
  if (push == null) {
    callback(new Error("Push not found"))
  }
  _init(push)
  callback()
}

/**
 * sends the current content of the given canvas context to the push.
 * The function assumes the canvas has the correct dimenstions.
 * It's fine to call this function even if initPush returned an error, as Push may have
 * been added to the system at a later time.
 * @param { Context2D } ctx - the canvas context. Both a native web canvas and node-canvas work.
 * @param { function(error) } callback - callback will be called after init. Follows node's "error first" async convention
 */
function sendFrame(ctx, callback) {
  if (!endpoint) { callback(new Error("No Push available")); return; } // push not available
  convertImage(ctx.getImageData(0,0,960,160).data, frameData)
  endpoint.transfer(Buffer.from(PUSH_FRAME_HEADER), function (error) {
    if (!error) {
      endpoint.transfer(Buffer.from(frameData), function (error) {
        if (!error) {
          callback()
        } else {
          callback(error)
        }
      })
    } else {
      callback(error)
    }
  })
}

module.exports = {
  initPush: initPush,
  sendFrame: sendFrame
}
