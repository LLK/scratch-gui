import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {STAGE_DISPLAY_SIZES} from '../lib/layout-constants.js';
import StageWrapperComponent from '../components/stage-wrapper/stage-wrapper.jsx';

class StageWrapper extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'updateWindow'
        ]);
        this.state = {
            windowWidth: 0
        };
    }
    componentDidMount () {
        this.updateWindow();
        window.addEventListener('resize', this.updateWindow);
    }
    componentWillUnmount () {
        window.removeEventListener('resize', this.updateWindow);
    }
    updateWindow () {
        this.setState({windowWidth: window.outerWidth});
    }
    render () {
        return (
            <StageWrapperComponent
                windowWidth={this.state.windowWidth}
                {...this.props}
            />
        );
    }
}

StageWrapper.propTypes = {
    isRendererSupported: PropTypes.bool.isRequired,
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default StageWrapper;
