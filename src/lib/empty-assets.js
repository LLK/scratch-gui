/**
 * @fileoverview
 * Utility functions to return json corresponding to default empty assets.
 */

/**
 * Generate a blank costume object for vm.addCostume with the provided name.
 * @param {string} name the name to use for the costume, caller should localize
 * @return {object} vm costume object
 */
const emptyCostume = name => ({
    name: name,
    assetId: 'cd21514d0531fdffb22204e0ec5ed84a',
    md5ext: 'cd21514d0531fdffb22204e0ec5ed84a.svg',
    md5: 'cd21514d0531fdffb22204e0ec5ed84a.svg', // @todo For some reason, md5 is required (or the serialization breaks)
    bitmapResolution: 1,
    rotationCenterX: 0,
    rotationCenterY: 0,
    dataFormat: 'svg'
});

/**
 * Generate a new empty sprite. The caller should provide localized versions of the
 * default names.
 * @param {string} name the name to use for the sprite
 * @param {string} soundName the name to use for the default sound
 * @param {string} costumeName the name to use for the default costume
 * @return {object} object expected by vm.addSprite
 */
const emptySprite = (name, soundName, costumeName) => ({
    isStage: false,
    name: name,
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: {},
    sounds: [
        {
            name: soundName,
            assetId: '83a9787d4cb6f3b7632b4ddfebf74367',
            md5ext: '83a9787d4cb6f3b7632b4ddfebf74367.wav',
            sampleCount: 258,
            rate: 11025,
            dataFormat: 'wav',
            format: ''
        }
    ],
    costumes: [
        {
            name: costumeName,
            assetId: 'cd21514d0531fdffb22204e0ec5ed84a',
            md5ext: 'cd21514d0531fdffb22204e0ec5ed84a.svg',
            bitmapResolution: 1,
            dataFormat: 'svg',
            rotationCenterX: 0,
            rotationCenterY: 0
        }
    ],
    currentCostume: 0,
    x: 36,
    y: 28,
    size: 100,
    direction: 90,
    rotationStyle: 'all around',
    draggable: false,
    visible: true
});

export {
    emptyCostume,
    emptySprite
};
