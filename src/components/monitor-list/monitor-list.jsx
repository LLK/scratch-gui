import React from 'react';
import classNames from 'classnames';
import Box from '../box/box.jsx';
import Monitor from '../../containers/monitor.jsx';
import PropTypes from 'prop-types';
import {OrderedMap} from 'immutable';
import {stageSizeToTransform} from '../../lib/screen-utils';

import styles from './monitor-list.css';

const MonitorList = props => (
    <Box
        // Use static `monitor-overlay` class for bounds of draggables
        className={classNames(styles.monitorList, 'monitor-overlay')}
        style={{
            width: props.stageSize.width,
            height: props.stageSize.height
        }}
    >
        <Box
            className={styles.monitorListScaler}
            style={stageSizeToTransform(props.stageSize)}
        >
            {props.monitors.valueSeq().filter(m => m.visible)
                .map(monitorData => (
                    <Monitor
                        draggable={props.draggable}
                        height={monitorData.height}
                        id={monitorData.id}
                        isDiscrete={monitorData.isDiscrete}
                        key={monitorData.id}
                        max={monitorData.sliderMax}
                        min={monitorData.sliderMin}
                        mode={monitorData.mode}
                        opcode={monitorData.opcode}
                        params={monitorData.params}
                        spriteName={monitorData.spriteName}
                        stageSize={props.stageSize}
                        targetId={monitorData.targetId}
                        value={monitorData.value}
                        width={monitorData.width}
                        x={monitorData.x}
                        y={monitorData.y}
                        onDragEnd={props.onMonitorChange}
                    />
                ))}
        </Box>
    </Box>
);

MonitorList.propTypes = {
    draggable: PropTypes.bool.isRequired,
    monitors: PropTypes.instanceOf(OrderedMap),
    onMonitorChange: PropTypes.func.isRequired,
    stageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number,
        widthDefault: PropTypes.number,
        heightDefault: PropTypes.number
    }).isRequired
};

export default MonitorList;
