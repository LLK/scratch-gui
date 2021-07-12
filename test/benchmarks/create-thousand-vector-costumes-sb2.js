const fs = require('fs');
const path = require('path');

const md5 = require('js-md5');
const JSZip = require('jszip');

const finishScratch2VectorCostume = (width, height, x = -1, y = -1, body = '') => [
    `<svg version="1.1" width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`,
    '  <!-- Exported by Scratch - http://scratch.mit.edu/ -->',
    body,
    '</svg>'
].join('\n');

let nextBaseLayerID = 0;

const projectJson = {
    objName: 'Stage',
    costumes: [],
    currentCostumeIndex: 0,
    tempoBPM: 60,
    videoAlpha: 0.5,
    children: [{
        objName: 'Sprite1',
        costumes: [],
        currentCostumeIndex: 0,
        scratchX: 0,
        scratchY: 0,
        scale: 1,
        direction: 90,
        rotationStyle: 'normal',
        isDraggable: false,
        indexInLibrary: 1,
        visible: true,
        spriteInfo: {}
    }],
    info: {
        flashVersion: 'mock 0,0,0,0',
        spriteCount: 1,
        videoOn: false,
        userAgent: 'create-svg-sb2.js',
        swfVersion: 'v999',
        scriptCount: 0
    }
};

const sb2 = new JSZip();

const makeCostumeEntry = (fileExtension, fileContent) => {
    const baseLayerID = nextBaseLayerID++;
    const baseLayerMD5 = md5(fileContent);
    sb2.file(`${baseLayerID}.${fileExtension}`, fileContent);
    return {
        baseLayerID: baseLayerID,
        baseLayerMD5: `${baseLayerMD5}.${fileExtension}`,
        bitmapResolution: 1,
        costumeName: `costume${baseLayerID - 1}`,
        rotationCenterX: 240,
        rotationCenterY: 180
    };
};

const penCostume = makeCostumeEntry('png', fs.readFileSync(path.join(__dirname, 'empty-pen-layer.png')));
projectJson.penLayerID = penCostume.baseLayerID;
projectJson.penLayerMD5 = penCostume.baseLayerMD5;

const emptyBackdrop = finishScratch2VectorCostume(2, 2);
const stageCostume = makeCostumeEntry('svg', emptyBackdrop);
stageCostume.costumeName = 'backdrop1';
projectJson.costumes.push(stageCostume);

const sprite1 = projectJson.children[0];
const numCostumes = 750;
while (sprite1.costumes.length < numCostumes) {
    const numLines = 20;
    const lines = [];
    while (lines.length < numLines) {
        const pathId = Math.random();
        const x0 = Math.trunc(Math.random() * 480) - 240;
        const y0 = Math.trunc(Math.random() * 360) - 180;
        const x1 = Math.trunc(Math.random() * 480) - 240;
        const y1 = Math.trunc(Math.random() * 360) - 180;
        const color = Math.trunc(Math.random() * 256 * 256 * 256)
            .toString(16)
            .padStart(6, '0');
        lines.push(
            `  <path id="ID${pathId}" fill="none" stroke="#${color}" stroke-width="2" stroke-linecap="round" ` +
            `d="M ${x0} ${y0} L ${x1} ${y1} " transform="matrix(1, 0, 0, 1, 240, 180)"/>`
        );
    }
    const svg = finishScratch2VectorCostume(480, 360, 0, 0, lines.join('\n'));
    const costume = makeCostumeEntry('svg', svg);
    sprite1.costumes.push(costume);
}

sb2.file('project.json', JSON.stringify(projectJson, null, '\t'));

const zipFileName = path.join(__dirname, 'thousand-vector-costumes.sb2');
sb2
    .generateNodeStream({
        type: 'nodebuffer',
        streamFiles: true,
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9
        }
    })
    .pipe(fs.createWriteStream(zipFileName));
