import classNames from 'classnames';
import {defineMessages, FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';

import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';

import styles from './prompt.css';


const messages = defineMessages({
    forAllSpritesMessage: {
        defaultMessage: 'For all sprites',
        description: 'Option message when creating a variable for making it available to all sprites',
        id: 'gui.gui.variableScopeOptionAllSprites'
    },
    forThisSpriteMessage: {
        defaultMessage: 'For this sprite only',
        description: 'Option message when creating a varaible for making it only available to the current sprite',
        id: 'gui.gui.variableScopeOptionSpriteOnly'
    },
    cloudVarOptionMessage: {
        defaultMessage: 'Cloud variable (stored on server)',
        description: 'Option message when creating a variable for making it a cloud variable, a variable that is stored on the server', /* eslint-disable-line max-len */
        id: 'gui.gui.cloudVariableOption'
    },
    availableToAllSpritesMessage: {
        defaultMessage: 'This variable will be available to all sprites.',
        description: 'A message that displays in a variable modal when the stage is selected indicating ' +
            'that the variable being created will available to all sprites.',
        id: 'gui.gui.variablePromptAllSpritesMessage'
    },
    listAvailableToAllSpritesMessage: {
        defaultMessage: 'This list will be available to all sprites.',
        description: 'A message that displays in a list modal when the stage is selected indicating ' +
            'that the list being created will available to all sprites.',
        id: 'gui.gui.listPromptAllSpritesMessage'
    }
});

const PromptComponent = props => (
    <Modal
        className={styles.modalContent}
        contentLabel={props.title}
        onRequestClose={props.onCancel}
    >
        <Box className={styles.body}>
            <Box className={styles.label}>
                {props.label}
            </Box>
            <Box>
                <input
                    autoFocus
                    className={styles.variableNameTextInput}
                    defaultValue={props.defaultValue}
                    name={props.label}
                    onChange={props.onChange}
                    onFocus={props.onFocus}
                    onKeyPress={props.onKeyPress}
                />
            </Box>
            {props.showVariableOptions ?
                <div>
                    {props.isStage ?
                        <div className={styles.infoMessage}>
                            {props.isVariable ? (
                                <FormattedMessage
                                    {...messages.availableToAllSpritesMessage}
                                />
                            ) : (
                                <FormattedMessage
                                    {...messages.listAvailableToAllSpritesMessage}
                                />
                            )}
                        </div> :
                        <Box className={styles.optionsRow}>
                            <label>
                                <input
                                    checked={props.globalSelected}
                                    name="variableScopeOption"
                                    type="radio"
                                    value="global"
                                    onChange={props.onScopeOptionSelection}
                                />
                                <FormattedMessage
                                    {...messages.forAllSpritesMessage}
                                />
                            </label>
                            <label
                                className={classNames({[styles.disabledLabel]: props.cloudSelected})}
                            >
                                <input
                                    checked={!props.globalSelected}
                                    disabled={props.cloudSelected}
                                    name="variableScopeOption"
                                    type="radio"
                                    value="local"
                                    onChange={props.onScopeOptionSelection}
                                />
                                <FormattedMessage
                                    {...messages.forThisSpriteMessage}
                                />
                            </label>
                        </Box>}
                    {props.showCloudOption ?
                        <Box className={classNames(styles.cloudOption)}>
                            <label
                                className={classNames({[styles.disabledLabel]: !props.canAddCloudVariable})}
                            >
                                <input
                                    checked={props.cloudSelected && props.canAddCloudVariable}
                                    disabled={!props.canAddCloudVariable}
                                    type="checkbox"
                                    onChange={props.onCloudVarOptionChange}
                                />
                                <FormattedMessage
                                    {...messages.cloudVarOptionMessage}
                                />
                            </label>
                        </Box> : null}
                </div> : null}

            <Box className={styles.buttonRow}>
                <button
                    className={styles.cancelButton}
                    onClick={props.onCancel}
                >
                    <FormattedMessage
                        defaultMessage="Cancel"
                        description="Button in prompt for cancelling the dialog"
                        id="gui.prompt.cancel"
                    />
                </button>
                <button
                    className={styles.okButton}
                    onClick={props.onOk}
                >
                    <FormattedMessage
                        defaultMessage="OK"
                        description="Button in prompt for confirming the dialog"
                        id="gui.prompt.ok"
                    />
                </button>
            </Box>
        </Box>
    </Modal>
);

PromptComponent.propTypes = {
    canAddCloudVariable: PropTypes.bool.isRequired,
    cloudSelected: PropTypes.bool.isRequired,
    defaultValue: PropTypes.string,
    globalSelected: PropTypes.bool.isRequired,
    isStage: PropTypes.bool.isRequired,
    isVariable: PropTypes.bool.isRequired,
    label: PropTypes.string.isRequired,
    onCancel: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onCloudVarOptionChange: PropTypes.func,
    onFocus: PropTypes.func.isRequired,
    onKeyPress: PropTypes.func.isRequired,
    onOk: PropTypes.func.isRequired,
    onScopeOptionSelection: PropTypes.func.isRequired,
    showCloudOption: PropTypes.bool.isRequired,
    showVariableOptions: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired
};

export default PromptComponent;
