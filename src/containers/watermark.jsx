import bindAll from 'lodash.bindall';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import DebouncedPropertyHOC from '../lib/debounced-property-hoc.jsx';

import VM from 'scratch-vm';
import storage from '../lib/storage';
import getCostumeUrl from '../lib/get-costume-url';

import WatermarkComponent from '../components/watermark/watermark.jsx';

class Watermark extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'getCostumeData'
        ]);
    }

    getCostumeData () {
        if (!this.props.asset) return null;

        return getCostumeUrl(this.props.asset);
    }

    render () {
        console.log('rerendering watermark');
        const componentProps = omit(this.props, ['asset', 'vm']);
        return (
            <WatermarkComponent
                costumeURL={this.getCostumeData()}
                {...componentProps}
            />
        );
    }
}

Watermark.propTypes = {
    asset: PropTypes.instanceOf(storage.Asset),
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => {
    const targets = state.scratchGui.targets;
    const currentTargetId = targets.editingTarget;

    let asset;
    if (currentTargetId) {
        if (targets.stage.id === currentTargetId) {
            asset = targets.stage.costume.asset;
        } else if (targets.sprites.hasOwnProperty(currentTargetId)) {
            const currentSprite = targets.sprites[currentTargetId];
            asset = currentSprite.costume.asset;
        }
    }

    return {
        vm: state.scratchGui.vm,
        asset: asset
    };
};

const ConnectedComponent = connect(
    mapStateToProps
)(
    DebouncedPropertyHOC('asset', 2000)(Watermark)
);

export default ConnectedComponent;
