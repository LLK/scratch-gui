import React from 'react';
import classNames from 'classnames';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {DraggableCore} from 'react-draggable';
import {FormattedMessage} from 'react-intl';
import {ContextMenuTrigger} from 'react-contextmenu';
import {BorderedMenuItem, ContextMenu, MenuItem} from '../context-menu/context-menu.jsx';
import Box from '../box/box.jsx';
import DefaultMonitor from './default-monitor.jsx';
import LargeMonitor from './large-monitor.jsx';
import SliderMonitor from '../../containers/slider-monitor.jsx';
import ListMonitor from '../../containers/list-monitor.jsx';

import styles from './monitor.css';

const categories = {
    data: '#FF8C1A',
    sensing: '#5CB1D6',
    sound: '#CF63CF',
    looks: '#9966FF',
    motion: '#4C97FF',
    list: '#FC662C',
    extension: '#0FBD8C'
};

const modes = {
    default: DefaultMonitor,
    large: LargeMonitor,
    slider: SliderMonitor,
    list: ListMonitor
};

const MonitorComponent = props => (
    <ContextMenuTrigger
        disable={!props.draggable}
        holdToDisplay={props.mode === 'slider' ? -1 : 1000}
        id={`monitor-${props.label}`}
    >
        <DraggableCore
            cancel=".no-drag" // Class used for slider input to prevent drag
            disabled={!props.draggable}
            onStart={props.onDragStart}
            onDrag={props.onDrag}
            onStop={props.onDragEnd}
        >
            <Box
                className={classNames(styles.monitorContainer, {
                    [styles.dragging]: props.dragging
                })}
                style={{
                    transform: `translate(${props.x}px, ${props.y}px)`
                }}
                componentRef={props.componentRef}
                onDoubleClick={props.mode === 'list' || !props.draggable ? null : props.onNextMode}
            >
                {React.createElement(modes[props.mode], {
                    categoryColor: categories[props.category],
                    ...props
                })}
            </Box>
        </DraggableCore>
        {ReactDOM.createPortal((
            // Use a portal to render the context menu outside the flow to avoid
            // positioning conflicts between the monitors `transform: scale` and
            // the context menus `position: fixed`. For more details, see
            // http://meyerweb.com/eric/thoughts/2011/09/12/un-fixing-fixed-elements-with-css-transforms/
            <ContextMenu id={`monitor-${props.label}`}>
                {props.onSetModeToDefault &&
                    <MenuItem onClick={props.onSetModeToDefault}>
                        <FormattedMessage
                            defaultMessage="normal readout"
                            description="Menu item to switch to the default monitor"
                            id="gui.monitor.contextMenu.default"
                        />
                    </MenuItem>}
                {props.onSetModeToLarge &&
                    <MenuItem onClick={props.onSetModeToLarge}>
                        <FormattedMessage
                            defaultMessage="large readout"
                            description="Menu item to switch to the large monitor"
                            id="gui.monitor.contextMenu.large"
                        />
                    </MenuItem>}
                {props.onSetModeToSlider &&
                    <MenuItem onClick={props.onSetModeToSlider}>
                        <FormattedMessage
                            defaultMessage="slider"
                            description="Menu item to switch to the slider monitor"
                            id="gui.monitor.contextMenu.slider"
                        />
                    </MenuItem>}
                {props.onSliderPromptOpen && props.mode === 'slider' &&
                    <BorderedMenuItem onClick={props.onSliderPromptOpen}>
                        <FormattedMessage
                            defaultMessage="change slider range"
                            description="Menu item to change the slider range"
                            id="gui.monitor.contextMenu.sliderRange"
                        />
                    </BorderedMenuItem>}
                {props.onImport &&
                    <MenuItem onClick={props.onImport}>
                        <FormattedMessage
                            defaultMessage="import"
                            description="Menu item to import into list monitors"
                            id="gui.monitor.contextMenu.import"
                        />
                    </MenuItem>}
                {props.onExport &&
                    <MenuItem onClick={props.onExport}>
                        <FormattedMessage
                            defaultMessage="export"
                            description="Menu item to export from list monitors"
                            id="gui.monitor.contextMenu.export"
                        />
                    </MenuItem>}
            </ContextMenu>
        ), document.body)}
    </ContextMenuTrigger>

);

MonitorComponent.categories = categories;

const monitorModes = Object.keys(modes);

MonitorComponent.propTypes = {
    category: PropTypes.oneOf(Object.keys(categories)),
    componentRef: PropTypes.func.isRequired,
    draggable: PropTypes.bool.isRequired,
    dragging: PropTypes.bool.isRequired,
    label: PropTypes.string.isRequired,
    mode: PropTypes.oneOf(monitorModes),
    onDragStart: PropTypes.func.isRequired,
    onDrag: PropTypes.func.isRequired,
    onDragEnd: PropTypes.func.isRequired,
    onExport: PropTypes.func,
    onImport: PropTypes.func,
    onNextMode: PropTypes.func.isRequired,
    onSetModeToDefault: PropTypes.func,
    onSetModeToLarge: PropTypes.func,
    onSetModeToSlider: PropTypes.func,
    onSliderPromptOpen: PropTypes.func,
    x: PropTypes.number,
    y: PropTypes.number
};

MonitorComponent.defaultProps = {
    category: 'extension',
    mode: 'default'
};

export {
    MonitorComponent as default,
    monitorModes
};
