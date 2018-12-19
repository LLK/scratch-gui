import bindAll from 'lodash.bindall';
import React from 'react';
import PropTypes from 'prop-types';

import monitorAdapter from '../lib/monitor-adapter.js';
import MonitorComponent, {monitorModes} from '../components/monitor/monitor.jsx';
import {addMonitorRect, getInitialPosition, resizeMonitorRect, removeMonitorRect} from '../reducers/monitor-layout';

import {connect} from 'react-redux';
import {Map} from 'immutable';
import VM from 'scratch-vm';

const availableModes = opcode => (
    monitorModes.filter(t => {
        if (opcode === 'data_variable') {
            return t !== 'list';
        } else if (opcode === 'data_listcontents') {
            return t === 'list';
        }
        return t !== 'slider' && t !== 'list';
    })
);

class Monitor extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleDragEnd',
            'handleHide',
            'handleNextMode',
            'handleSetModeToDefault',
            'handleSetModeToLarge',
            'handleSetModeToSlider',
            'setElement'
        ]);
    }
    componentDidMount () {
        let rect;

        const isNum = num => typeof num === 'number' && !isNaN(num);

        // Load the VM provided position if not loaded already
        // If a monitor has numbers for the x and y positions, load the saved position.
        // Otherwise, auto-position the monitor.
        if (isNum(this.props.x) && isNum(this.props.y) &&
            !this.props.monitorLayout.savedMonitorPositions[this.props.id]) {
            rect = {
                upperStart: {x: this.props.x, y: this.props.y},
                lowerEnd: {x: this.props.x + this.element.offsetWidth, y: this.props.y + this.element.offsetHeight}
            };
            this.props.addMonitorRect(this.props.id, rect, true /* savePosition */);
        } else { // Newly created user monitor
            rect = getInitialPosition(
                this.props.monitorLayout, this.props.id, this.element.offsetWidth, this.element.offsetHeight);
            this.props.addMonitorRect(this.props.id, rect);
            this.props.vm.runtime.requestUpdateMonitor(Map({
                id: this.props.id,
                x: rect.upperStart.x,
                y: rect.upperStart.y
            }));
        }
        this.element.style.top = `${rect.upperStart.y}px`;
        this.element.style.left = `${rect.upperStart.x}px`;
    }
    shouldComponentUpdate (nextProps, nextState) {
        if (nextState !== this.state) {
            return true;
        }
        for (const key of Object.getOwnPropertyNames(nextProps)) {
            // Don't need to rerender when other monitors are moved.
            // monitorLayout is only used during initial layout.
            if (key !== 'monitorLayout' && nextProps[key] !== this.props[key]) {
                return true;
            }
        }
        return false;
    }
    componentDidUpdate () {
        this.props.resizeMonitorRect(this.props.id, this.element.offsetWidth, this.element.offsetHeight);
    }
    componentWillUnmount () {
        this.props.removeMonitorRect(this.props.id);
    }
    handleDragEnd (e, {x, y}) {
        const newX = parseInt(this.element.style.left, 10) + x;
        const newY = parseInt(this.element.style.top, 10) + y;
        this.props.onDragEnd(
            this.props.id,
            newX,
            newY
        );
        this.props.vm.runtime.requestUpdateMonitor(Map({
            id: this.props.id,
            x: newX,
            y: newY
        }));
    }
    handleHide () {
        this.props.vm.runtime.requestUpdateMonitor(Map({
            id: this.props.id,
            visible: false
        }));
    }
    handleNextMode () {
        const modes = availableModes(this.props.opcode);
        const modeIndex = modes.indexOf(this.props.mode);
        const newMode = modes[(modeIndex + 1) % modes.length];
        this.props.vm.runtime.requestUpdateMonitor(Map({
            id: this.props.id,
            mode: newMode
        }));
    }
    handleSetModeToDefault () {
        this.props.vm.runtime.requestUpdateMonitor(Map({
            id: this.props.id,
            mode: 'default'
        }));
    }
    handleSetModeToLarge () {
        this.props.vm.runtime.requestUpdateMonitor(Map({
            id: this.props.id,
            mode: 'large'
        }));
    }
    handleSetModeToSlider () {
        this.props.vm.runtime.requestUpdateMonitor(Map({
            id: this.props.id,
            mode: 'slider'
        }));
    }
    setElement (monitorElt) {
        this.element = monitorElt;
    }
    render () {
        const monitorProps = monitorAdapter(this.props);
        const showSliderOption = availableModes(this.props.opcode).indexOf('slider') !== -1;
        return (
            <MonitorComponent
                componentRef={this.setElement}
                {...monitorProps}
                draggable={this.props.draggable}
                height={this.props.height}
                max={this.props.max}
                min={this.props.min}
                mode={this.props.mode}
                targetId={this.props.targetId}
                width={this.props.width}
                onDragEnd={this.handleDragEnd}
                onHide={this.handleHide}
                onNextMode={this.handleNextMode}
                onSetModeToDefault={this.handleSetModeToDefault}
                onSetModeToLarge={this.handleSetModeToLarge}
                onSetModeToSlider={showSliderOption ? this.handleSetModeToSlider : null}
            />
        );
    }
}

Monitor.propTypes = {
    addMonitorRect: PropTypes.func.isRequired,
    draggable: PropTypes.bool,
    height: PropTypes.number,
    id: PropTypes.string.isRequired,
    max: PropTypes.number,
    min: PropTypes.number,
    mode: PropTypes.oneOf(['default', 'slider', 'large', 'list']),
    monitorLayout: PropTypes.shape({
        monitors: PropTypes.object,
        savedMonitorPositions: PropTypes.object
    }).isRequired,
    onDragEnd: PropTypes.func.isRequired,
    opcode: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
    params: PropTypes.object, // eslint-disable-line react/no-unused-prop-types, react/forbid-prop-types
    removeMonitorRect: PropTypes.func.isRequired,
    resizeMonitorRect: PropTypes.func.isRequired,
    spriteName: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
    targetId: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]))
    ]), // eslint-disable-line react/no-unused-prop-types
    vm: PropTypes.instanceOf(VM),
    width: PropTypes.number,
    x: PropTypes.number,
    y: PropTypes.number
};
const mapStateToProps = state => ({
    monitorLayout: state.scratchGui.monitorLayout,
    vm: state.scratchGui.vm
});
const mapDispatchToProps = dispatch => ({
    addMonitorRect: (id, rect, savePosition) =>
        dispatch(addMonitorRect(id, rect.upperStart, rect.lowerEnd, savePosition)),
    resizeMonitorRect: (id, newWidth, newHeight) => dispatch(resizeMonitorRect(id, newWidth, newHeight)),
    removeMonitorRect: id => dispatch(removeMonitorRect(id))
});
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Monitor);
