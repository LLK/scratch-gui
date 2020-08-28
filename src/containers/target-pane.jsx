import bindAll from 'lodash.bindall';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {intlShape, injectIntl} from 'react-intl';

import {
    openSpriteLibrary,
    closeSpriteLibrary
} from '../reducers/modals';
import {activateTab, COSTUMES_TAB_INDEX, BLOCKS_TAB_INDEX} from '../reducers/editor-tab';
import {setReceivedBlocks} from '../reducers/hovered-target';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';
import {setRestore} from '../reducers/restore-deletion';
import DragConstants from '../lib/drag-constants';
import TargetPaneComponent from '../components/target-pane/target-pane.jsx';
import {BLOCKS_DEFAULT_SCALE} from '../lib/layout-constants';
import spriteLibraryContent from '../lib/libraries/sprites.json';
import {handleFileUpload, spriteUpload} from '../lib/file-uploader.js';
import sharedMessages from '../lib/shared-messages';
import {emptySprite} from '../lib/empty-assets';
import {highlightTarget} from '../reducers/targets';
import {fetchSprite, fetchCode} from '../lib/backpack-api';
import randomizeSpritePosition from '../lib/randomize-sprite-position';
import downloadBlob from '../lib/download-blob';

class TargetPane extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleActivateBlocksTab',
            'handleBlockDragEnd',
            'handleChangeSpriteRotationStyle',
            'handleChangeSpriteDirection',
            'handleChangeSpriteName',
            'handleChangeSpriteSize',
            'handleChangeSpriteVisibility',
            'handleChangeSpriteX',
            'handleChangeSpriteY',
            'handleDeleteSprite',
            'handleDrop',
            'handleDuplicateSprite',
            'handleExportSprite',
            'handleNewSprite',
            'handleSelectSprite',
            'handleSurpriseSpriteClick',
            'handlePaintSpriteClick',
            'handleFileUploadClick',
            'handleSpriteUpload',
            'setFileInput'
        ]);
    }
    componentDidMount () {
        this.props.vm.addListener('BLOCK_DRAG_END', this.handleBlockDragEnd);
    }
    componentWillUnmount () {
        this.props.vm.removeListener('BLOCK_DRAG_END', this.handleBlockDragEnd);
    }
    handleChangeSpriteDirection (direction) {
        this.props.vm.postSpriteInfo({direction});
    }
    handleChangeSpriteRotationStyle (rotationStyle) {
        this.props.vm.postSpriteInfo({rotationStyle});
    }
    handleChangeSpriteName (name) {
        this.props.vm.renameSprite(this.props.editingTarget, name);
    }
    handleChangeSpriteSize (size) {
        this.props.vm.postSpriteInfo({size});
    }
    handleChangeSpriteVisibility (visible) {
        this.props.vm.postSpriteInfo({visible});
    }
    handleChangeSpriteX (x) {
        this.props.vm.postSpriteInfo({x});
    }
    handleChangeSpriteY (y) {
        this.props.vm.postSpriteInfo({y});
    }
    handleDeleteSprite (id) {
        const restoreSprite = this.props.vm.deleteSprite(id);
        const restoreFun = () => restoreSprite().then(this.handleActivateBlocksTab);

        this.props.dispatchUpdateRestore({
            restoreFun: restoreFun,
            deletedItem: 'Sprite'
        });

    }
    handleDuplicateSprite (id) {
        this.props.vm.duplicateSprite(id);
    }
    handleExportSprite (id) {
        const spriteName = this.props.vm.runtime.getTargetById(id).getName();
        const saveLink = document.createElement('a');
        document.body.appendChild(saveLink);

        this.props.vm.exportSprite(id).then(content => {
            downloadBlob(`${spriteName}.sprite3`, content);
        });
    }
    handleSelectSprite (id) {
        this.props.vm.setEditingTarget(id);
        if (this.props.stage && id !== this.props.stage.id) {
            this.props.onHighlightTarget(id);
        }
    }
    handleSurpriseSpriteClick () {
        const surpriseSprites = spriteLibraryContent.filter(sprite =>
            (sprite.tags.indexOf('letters') === -1) && (sprite.tags.indexOf('numbers') === -1)
        );
        const item = surpriseSprites[Math.floor(Math.random() * surpriseSprites.length)];
        randomizeSpritePosition(item);
        this.props.vm.addSprite(JSON.stringify(item.json))
            .then(this.handleActivateBlocksTab);
    }
    handlePaintSpriteClick () {
        const formatMessage = this.props.intl.formatMessage;
        const emptyItem = emptySprite(
            formatMessage(sharedMessages.sprite, {index: 1}),
            formatMessage(sharedMessages.pop),
            formatMessage(sharedMessages.costume, {index: 1})
        );
        randomizeSpritePosition(emptyItem);
        this.props.vm.addSprite(JSON.stringify(emptyItem)).then(() => {
            setTimeout(() => { // Wait for targets update to propagate before tab switching
                this.props.onActivateTab(COSTUMES_TAB_INDEX);
            });
        });
    }
    handleActivateBlocksTab () {
        this.props.onActivateTab(BLOCKS_TAB_INDEX);
    }
    handleNewSprite (spriteJSONString) {
        return this.props.vm.addSprite(spriteJSONString)
            .then(this.handleActivateBlocksTab);
    }
    handleFileUploadClick () {
        this.fileInput.click();
    }
    handleSpriteUpload (e) {
        const storage = this.props.vm.runtime.storage;
        this.props.onShowImporting();
        handleFileUpload(e.target, (buffer, fileType, fileName, fileIndex, fileCount) => {
            spriteUpload(buffer, fileType, fileName, storage, newSprite => {
                this.handleNewSprite(newSprite)
                    .then(() => {
                        if (fileIndex === fileCount - 1) {
                            this.props.onCloseImporting();
                        }
                    })
                    .catch(this.props.onCloseImporting);
            }, this.props.onCloseImporting);
        }, this.props.onCloseImporting);
    }
    setFileInput (input) {
        this.fileInput = input;
    }
    handleBlockDragEnd (blocks) {
        if (this.props.hoveredTarget.sprite && this.props.hoveredTarget.sprite !== this.props.editingTarget) {
            this.shareBlocks(blocks, this.props.hoveredTarget.sprite, this.props.editingTarget);
            this.props.onReceivedBlocks(true);
        }
    }
    shareBlocks (blocks, targetId, optFromTargetId) {
        // Position the top-level block based on the scroll position.
        const topBlock = blocks.find(block => block.topLevel);
        if (topBlock) {
            let metrics;
            if (this.props.workspaceMetrics.targets[targetId]) {
                metrics = this.props.workspaceMetrics.targets[targetId];
            } else {
                metrics = {
                    scrollX: 0,
                    scrollY: 0,
                    scale: BLOCKS_DEFAULT_SCALE
                };
            }

            // Determine position of the top-level block based on the target's workspace metrics.
            const {scrollX, scrollY, scale} = metrics;
            const posY = -scrollY + 30;
            let posX;
            if (this.props.isRtl) {
                posX = scrollX + 30;
            } else {
                posX = -scrollX + 30;
            }

            // Actually apply the position!
            topBlock.x = posX / scale;
            topBlock.y = posY / scale;
        }

        this.props.vm.shareBlocksToTarget(blocks, targetId, optFromTargetId);
    }
    handleDrop (dragInfo) {
        const {sprite: targetId} = this.props.hoveredTarget;
        if (dragInfo.dragType === DragConstants.SPRITE) {
            // Add one to both new and target index because we are not counting/moving the stage
            this.props.vm.reorderTarget(dragInfo.index + 1, dragInfo.newIndex + 1);
        } else if (dragInfo.dragType === DragConstants.BACKPACK_SPRITE) {
            // TODO storage does not have a way of loading zips right now, and may never need it.
            // So for now just grab the zip manually.
            fetchSprite(dragInfo.payload.bodyUrl)
                .then(sprite3Zip => this.props.vm.addSprite(sprite3Zip));
        } else if (targetId) {
            // Something is being dragged over one of the sprite tiles or the backdrop.
            // Dropping assets like sounds and costumes duplicate the asset on the
            // hovered target. Shared costumes also become the current costume on that target.
            // However, dropping does not switch the editing target or activate that editor tab.
            // This is based on 2.0 behavior, but seems like it keeps confusing switching to a minimum.
            // it allows the user to share multiple things without switching back and forth.
            if (dragInfo.dragType === DragConstants.COSTUME) {
                this.props.vm.shareCostumeToTarget(dragInfo.index, targetId);
            } else if (targetId && dragInfo.dragType === DragConstants.SOUND) {
                this.props.vm.shareSoundToTarget(dragInfo.index, targetId);
            } else if (dragInfo.dragType === DragConstants.BACKPACK_COSTUME) {
                // In scratch 2, this only creates a new sprite from the costume.
                // We may be able to handle both kinds of drops, depending on where
                // the drop happens. For now, just add the costume.
                this.props.vm.addCostume(dragInfo.payload.body, {
                    name: dragInfo.payload.name
                }, targetId);
            } else if (dragInfo.dragType === DragConstants.BACKPACK_SOUND) {
                this.props.vm.addSound({
                    md5: dragInfo.payload.body,
                    name: dragInfo.payload.name
                }, targetId);
            } else if (dragInfo.dragType === DragConstants.BACKPACK_CODE) {
                fetchCode(dragInfo.payload.bodyUrl)
                    .then(blocks => {
                        this.shareBlocks(blocks, targetId);
                        this.props.vm.refreshWorkspace();
                    });
            }
        }
    }
    render () {
        /* eslint-disable no-unused-vars */
        const {
            dispatchUpdateRestore,
            onActivateTab,
            onCloseImporting,
            onHighlightTarget,
            onReceivedBlocks,
            onShowImporting,
            workspaceMetrics,
            ...componentProps
        } = this.props;
        /* eslint-enable no-unused-vars */
        return (
            <TargetPaneComponent
                {...componentProps}
                fileInputRef={this.setFileInput}
                onActivateBlocksTab={this.handleActivateBlocksTab}
                onChangeSpriteDirection={this.handleChangeSpriteDirection}
                onChangeSpriteName={this.handleChangeSpriteName}
                onChangeSpriteRotationStyle={this.handleChangeSpriteRotationStyle}
                onChangeSpriteSize={this.handleChangeSpriteSize}
                onChangeSpriteVisibility={this.handleChangeSpriteVisibility}
                onChangeSpriteX={this.handleChangeSpriteX}
                onChangeSpriteY={this.handleChangeSpriteY}
                onDeleteSprite={this.handleDeleteSprite}
                onDrop={this.handleDrop}
                onDuplicateSprite={this.handleDuplicateSprite}
                onExportSprite={this.handleExportSprite}
                onFileUploadClick={this.handleFileUploadClick}
                onPaintSpriteClick={this.handlePaintSpriteClick}
                onSelectSprite={this.handleSelectSprite}
                onSpriteUpload={this.handleSpriteUpload}
                onSurpriseSpriteClick={this.handleSurpriseSpriteClick}
            />
        );
    }
}

const {
    onSelectSprite, // eslint-disable-line no-unused-vars
    onActivateBlocksTab, // eslint-disable-line no-unused-vars
    ...targetPaneProps
} = TargetPaneComponent.propTypes;

TargetPane.propTypes = {
    intl: intlShape.isRequired,
    onCloseImporting: PropTypes.func,
    onShowImporting: PropTypes.func,
    ...targetPaneProps
};

const mapStateToProps = state => ({
    editingTarget: state.scratchGui.targets.editingTarget,
    hoveredTarget: state.scratchGui.hoveredTarget,
    isRtl: state.locales.isRtl,
    spriteLibraryVisible: state.scratchGui.modals.spriteLibrary,
    sprites: state.scratchGui.targets.sprites,
    stage: state.scratchGui.targets.stage,
    raiseSprites: state.scratchGui.blockDrag,
    workspaceMetrics: state.scratchGui.workspaceMetrics
});

const mapDispatchToProps = dispatch => ({
    onNewSpriteClick: e => {
        e.preventDefault();
        dispatch(openSpriteLibrary());
    },
    onRequestCloseSpriteLibrary: () => {
        dispatch(closeSpriteLibrary());
    },
    onActivateTab: tabIndex => {
        dispatch(activateTab(tabIndex));
    },
    onReceivedBlocks: receivedBlocks => {
        dispatch(setReceivedBlocks(receivedBlocks));
    },
    dispatchUpdateRestore: restoreState => {
        dispatch(setRestore(restoreState));
    },
    onHighlightTarget: id => {
        dispatch(highlightTarget(id));
    },
    onCloseImporting: () => dispatch(closeAlertWithId('importingAsset')),
    onShowImporting: () => dispatch(showStandardAlert('importingAsset'))
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(TargetPane));
