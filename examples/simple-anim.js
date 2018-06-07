const Canvas = require('canvas')
const path = require('path')
const { initPush, sendFrame } = require(path.join(__dirname, '..', 'index.js'))

const canvas = new Canvas(960,160)
const ctx = canvas.getContext('2d')

function drawFrame(ctx, frameNum) {
  ctx.strokeStyle = "#ff0"
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, 960, 160)
  ctx.fillStyle = "hsl(" + frameNum % 360 +",100%,50%)"
  ctx.lineWidth = 4
  ctx.fillRect((frameNum * 2) % 960, (frameNum * 2) % 160, 20, 20)
  ctx.beginPath()
  ctx.arc(100, 100, 50, 0, (frameNum / 20.0) % (2 * Math.PI))
  ctx.lineTo(100, 100)
  ctx.stroke()

  ctx.font = '800 20px "SF Pro Display"';
  ctx.fillStyle = '#fff'
  ctx.fillText("Awesome!", 50, 100);
}

let frameNum = 0

function nextFrame() {
  drawFrame(ctx, frameNum)
  frameNum++
  sendFrame(ctx, function() {
    process.nextTick(function() {
      nextFrame()
    })
  })
}

initPush(function() {
  nextFrame()
})
