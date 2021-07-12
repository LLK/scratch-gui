/**
 * Utility to get thumbnail (aka picture of stage)
 * @param {object} vm Scratch VM instance
 * @param {function} callback callback function that takes data URI as an argument
 */
export default function getThumbnail (vm, callback) {
    vm.postIOData('video', {forceTransparentPreview: true});
    vm.renderer.requestSnapshot(dataURI => {
        vm.postIOData('video', {forceTransparentPreview: false});
        callback(dataURI);
    });
    vm.renderer.draw();
}
