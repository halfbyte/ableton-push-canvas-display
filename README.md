# ableton-push-canvas-display

Ableton Push 2 has a high resolution color display that can be updated via libusb very easily.
The hardest part is drawing pretty graphics. Usually people use frameworks like JUCE for that, but
with node and the web, we have something simple, that should also work: The canvas.

This package does that hard work of converting the image data from a canvas to the slightly weird
push framebuffer format and sending it via USB.

## How to use

Since this uses node libusb bindings, you need to have a node environment. This means that it
actually works in electron, even in the renderer process. That also means that you can send a canvas
that is actually rendered in a web page.

Here's a minimal example that assumes a set up canvas. The canvas should be 960x160 (the display
size of Push 2).

```JavaScript
const { initPush, sendFrame } = require('ableton-push-canvas-display')

function render() {
  ctx.clearRect(...)
  ctx.strokeLine(...)
  sendFrame(ctx, (err) => {
    render() // you probably want to do something like requestAnimationFrame or so.
  })
}

initPush((err) => {
  if (!err) {
    render()
  }
})
```

If you can't or don't want to use a web canvas, there's a npm package called "canvas" that
replicates the API using libcairo which works as an image source as well.

## Pitfalls

If you don't clear the canvas with a solid background, the results will look weird, as the
conversion process doesn't take the alpha channel into account. As soon as you render to a solid
background, the alpha masks (for antia aliasing for example) are baked and it should look ok.

For performance reasons I'm using direct access to typed arrays which means that things can go wrong
in terms of endianness if you are not on a little endian machine. (which is VERY rare nowadays)

The libusb bulk transfer process takes up almost all of the 16 ms we have to make this a 60fps
operation on my iMac, so there could be some jank sometimes. I have to test this on other hardware
to see if it needs additional optimisations.

## Status

This needs tests (sort of hard to test without actual hardware, but I guess I could at least test
the conversion process properly).

It is not handling multiple push devices. Not sure that this is actually a valid usecase for me.

## Contributions

...are welcome. Fork the project, open up a PR, yadda yadda.

## Credits

This uses Tessel's node-usb library and Automattic's libcairo based canvas implementation for the
example.

This library is inspired by an awesome weekend at JSConfEU 2019, and especially by my time spent with the
wonderful people at [live:js](http://livejs.network).

Also, thank you so much, Ableton for [being very open with Push 2 and documenting almost everything
about this](https://github.com/Ableton/push-interface) awesome hardware.
