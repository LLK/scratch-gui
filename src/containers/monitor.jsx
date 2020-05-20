import bindAll from 'lodash.bindall';
import React from 'react';
import PropTypes from 'prop-types';
import {injectIntl, intlShape, defineMessages} from 'react-intl';

import monitorAdapter from '../lib/monitor-adapter.js';
import MonitorComponent, {monitorModes} from '../components/monitor/monitor.jsx';
import {addMonitorRect, getInitialPosition, resizeMonitorRect, removeMonitorRect} from '../reducers/monitor-layout';
import {getVariable, setVariableValue} from '../lib/variable-utils';
import importCSV from '../lib/import-csv';
import downloadBlob from '../lib/download-blob';
import SliderPrompt from './slider-prompt.jsx';

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

const messages = defineMessages({
    columnPrompt: {
        defaultMessage: 'Which column should be used (1-{numberOfColumns})?',
        description: 'Prompt for which column should be used',
        id: 'gui.monitors.importListColumnPrompt'
    }
});

class Monitor extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleDragStart',
            'handleDrag',
            'handleDragEnd',
            'handleNextMode',
            'handleSetModeToDefault',
            'handleSetModeToLarge',
            'handleSetModeToSlider',
            'handleSliderPromptClose',
            'handleSliderPromptOk',
            'handleSliderPromptOpen',
            'handleImport',
            'handleExport',
            'setElement'
        ]);
        this.state = {
            sliderPrompt: false,
            x: 0,
            y: 0,
            dragStartMonitorX: 0,
            dragStartMonitorY: 0,
            dragStartEventX: 0,
            dragStartEventY: 0,
            dragging: false
        };
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

        const {x, y} = rect.upperStart;
        // There's no way around it--we have to do layout twice: once to determine the monitor dimensions for
        // getInitialPosition and once to move the monitor to its proper position.
        // eslint-disable-next-line react/no-did-mount-set-state
        this.setState({x, y});
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
    handleDragStart (e, {x, y}) {
        this.setState({
            dragStartEventX: x,
            dragStartEventY: y,
            dragStartMonitorX: this.state.x,
            dragStartMonitorY: this.state.y,
            dragging: true
        });
    }
    handleDrag (e, {x, y}) {
        this.setState({
            x: (x - this.state.dragStartEventX) + this.state.dragStartMonitorX,
            y: (y - this.state.dragStartEventY) + this.state.dragStartMonitorY
        });
    }
    handleDragEnd (e, {x, y}) {
        this.setState({
            dragging: false
        });
        this.props.onDragEnd(
            this.props.id,
            x,
            y
        );
        this.props.vm.runtime.requestUpdateMonitor(Map({
            id: this.props.id,
            x,
            y
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
    handleSliderPromptClose () {
        this.setState({sliderPrompt: false});
    }
    handleSliderPromptOpen () {
        this.setState({sliderPrompt: true});
    }
    handleSliderPromptOk (min, max, isDiscrete) {
        const realMin = Math.min(min, max);
        const realMax = Math.max(min, max);
        this.props.vm.runtime.requestUpdateMonitor(Map({
            id: this.props.id,
            sliderMin: realMin,
            sliderMax: realMax,
            isDiscrete: isDiscrete
        }));
        this.handleSliderPromptClose();
    }
    setElement (monitorElt) {
        this.element = monitorElt;
    }
    handleImport () {
        importCSV().then(rows => {
            const numberOfColumns = rows[0].length;
            let columnNumber = 1;
            if (numberOfColumns > 1) {
                const msg = this.props.intl.formatMessage(messages.columnPrompt, {numberOfColumns});
                columnNumber = parseInt(prompt(msg), 10); // eslint-disable-line no-alert
            }
            const newListValue = rows.map(row => row[columnNumber - 1])
                .filter(item => typeof item === 'string'); // CSV importer can leave undefineds
            const {vm, targetId, id: variableId} = this.props;
            setVariableValue(vm, targetId, variableId, newListValue);
        });
    }
    handleExport () {
        const {vm, targetId, id: variableId} = this.props;
        const variable = getVariable(vm, targetId, variableId);
        const text = variable.value.join('\r\n');
        const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
        downloadBlob(`${variable.name}.txt`, blob);
    }
    render () {
        const monitorProps = monitorAdapter(this.props);
        const showSliderOption = availableModes(this.props.opcode).indexOf('slider') !== -1;
        const isList = this.props.mode === 'list';
        return (
            <React.Fragment>
                {this.state.sliderPrompt && <SliderPrompt
                    isDiscrete={this.props.isDiscrete}
                    maxValue={parseFloat(this.props.max)}
                    minValue={parseFloat(this.props.min)}
                    onCancel={this.handleSliderPromptClose}
                    onOk={this.handleSliderPromptOk}
                />}
                <MonitorComponent
                    componentRef={this.setElement}
                    {...monitorProps}
                    x={this.state.x}
                    y={this.state.y}
                    draggable={this.props.draggable}
                    dragging={this.state.dragging}
                    height={this.props.height}
                    isDiscrete={this.props.isDiscrete}
                    max={this.props.max}
                    min={this.props.min}
                    mode={this.props.mode}
                    targetId={this.props.targetId}
                    width={this.props.width}
                    onDragStart={this.handleDragStart}
                    onDrag={this.handleDrag}
                    onDragEnd={this.handleDragEnd}
                    onExport={isList ? this.handleExport : null}
                    onImport={isList ? this.handleImport : null}
                    onNextMode={this.handleNextMode}
                    onSetModeToDefault={isList ? null : this.handleSetModeToDefault}
                    onSetModeToLarge={isList ? null : this.handleSetModeToLarge}
                    onSetModeToSlider={showSliderOption ? this.handleSetModeToSlider : null}
                    onSliderPromptOpen={this.handleSliderPromptOpen}
                />
            </React.Fragment>
        );
    }
}

Monitor.propTypes = {
    addMonitorRect: PropTypes.func.isRequired,
    draggable: PropTypes.bool,
    height: PropTypes.number,
    id: PropTypes.string.isRequired,
    intl: intlShape,
    isDiscrete: PropTypes.bool,
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

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(Monitor));
