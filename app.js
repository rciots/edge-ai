const { Canvas, createCanvas, Image, ImageData, loadImage } = require('canvas');
const { JSDOM } = require('jsdom');
const { writeFileSync, existsSync, mkdirSync } = require("fs");
// This is our program. This time we use JavaScript async / await and promises to handle asynchronicity.
(async () => {
  // before loading opencv.js we emulate a minimal HTML DOM. See the function declaration below.
  installDOM();
  await loadOpenCV();
  // using node-canvas, we an image file to an object compatible with HTML DOM Image and therefore with cv.imread()
  const image = await loadImage('./input.jpg');
  const src = cv.imread(image);
  let cut = new cv.Mat();
  let blues = new cv.Mat();
  let rect = new cv.Rect(80, 250, 1200, 470);

  cut = src.roi(rect);
  const canvas = createCanvas(300, 300);
  cv.imshow(canvas, cut);
  writeFileSync('output_1.jpg', canvas.toBuffer('image/jpeg'));
  let blue = [60, 170, 200, 255];
  let low = new cv.Mat(cut.rows, cut.cols, cut.type(), [10, 116, 120, 0]);
  let high = new cv.Mat(cut.rows, cut.cols, cut.type(), blue);
  cv.inRange(cut, low, high, blues);
  const canvas2 = createCanvas(300, 300);
  cv.imshow(canvas2, blues);
  writeFileSync('output_2.jpg', canvas2.toBuffer('image/jpeg'));
  let bluesgray = new cv.Mat();
  const image2 = await loadImage('./output_2.jpg');
  const blues2 = cv.imread(image2);
  let circles = new cv.Mat();
  let color = new cv.Scalar(255, 255, 255);
  cv.cvtColor(blues2, bluesgray, cv.COLOR_RGBA2GRAY);
  let circlesblue = cv.Mat.zeros(blues.rows, blues.cols, cv.CV_8U);
  // You can try more different parameters
  cv.HoughCircles(bluesgray, circles, cv.HOUGH_GRADIENT,
                  1, 80, 35, 20, 10, 100);
  // draw circles
  for (let i = 0; i < circles.cols; ++i) {
      let x = circles.data32F[i * 3];
      let y = circles.data32F[i * 3 + 1];
      let radius = circles.data32F[i * 3 + 2];
      let center = new cv.Point(x, y);
      cv.circle(circlesblue, center, radius, color);
  }
  const canvas3 = createCanvas(300, 300);
  cv.imshow(canvas3, circlesblue);
  writeFileSync('output_3.jpg', canvas3.toBuffer('image/jpeg'));

})();
// Load opencv.js just like before but using Promise instead of callbacks:
function loadOpenCV() {
  return new Promise(resolve => {
    global.Module = {
      onRuntimeInitialized: resolve
    };
    global.cv = require('./opencv.js');
  });
}
// Using jsdom and node-canvas we define some global variables to emulate HTML DOM.
// Although a complete emulation can be archived, here we only define those globals used
// by cv.imread() and cv.imshow().
function installDOM() {
  const dom = new JSDOM();
  global.document = dom.window.document;
  // The rest enables DOM image and canvas and is provided by node-canvas
  global.Image = Image;
  global.HTMLCanvasElement = Canvas;
  global.ImageData = ImageData;
  global.HTMLImageElement = Image;
}
