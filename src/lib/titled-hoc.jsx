import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import {
    getIsAnyCreatingNewState,
    getIsShowingWithoutId
} from '../reducers/project-state';
import {setProjectTitle} from '../reducers/project-title';

const messages = defineMessages({
    defaultProjectTitle: {
        id: 'gui.gui.defaultProjectTitle',
        description: 'Default title for project',
        defaultMessage: 'Scratch Project'
    }
});

/* Higher Order Component to get and set the project title
 * @param {React.Component} WrappedComponent component to receive project title related props
 * @returns {React.Component} component with project loading behavior
 */
const TitledHOC = function (WrappedComponent) {
    class TitledComponent extends React.Component {
        componentDidMount () {
            this.handleReceivedProjectTitle(this.props.projectTitle);
        }
        componentDidUpdate (prevProps) {
            if (this.props.projectTitle !== prevProps.projectTitle) {
                this.handleReceivedProjectTitle(this.props.projectTitle);
            }
            // if project is a new default project, and has loaded,
            if (this.props.isShowingWithoutId && prevProps.isAnyCreatingNewState) {
                // reset title to default
                const defaultProjectTitle = this.handleReceivedProjectTitle();
                this.props.onUpdateProjectTitle(defaultProjectTitle);
            }
            // if the user has changed the project Title, and the projectTitle prop
            // passed in to us is stale (defined, but old), we need to notify
            // the source of the projectTitle that it should be updated
            const reduxTitleHasChanged =
                (this.props.reduxProjectTitle !== prevProps.reduxProjectTitle &&
                this.props.reduxProjectTitle !== this.props.projectTitle);
            const titlePropIsSet = ((this.props.projectTitle !== null) &&
                (typeof this.props.projectTitle !== 'undefined'));
            if (titlePropIsSet && reduxTitleHasChanged) {
                this.props.onUpdateProjectTitle(this.props.reduxProjectTitle);
            }
        }
        handleReceivedProjectTitle (requestedTitle) {
            let newTitle = requestedTitle;
            if (newTitle === null || typeof newTitle === 'undefined') {
                newTitle = this.props.intl.formatMessage(messages.defaultProjectTitle);
            }
            this.props.onChangedProjectTitle(newTitle);
            return newTitle;
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                intl,
                isAnyCreatingNewState,
                isShowingWithoutId,
                onChangedProjectTitle,
                // for children, we replace onUpdateProjectTitle with our own
                onUpdateProjectTitle,
                // we don't pass projectTitle prop to children -- they must use
                // redux value
                projectTitle,
                reduxProjectTitle,
                /* eslint-enable no-unused-vars */
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    {...componentProps}
                />
            );
        }
    }

    TitledComponent.propTypes = {
        intl: intlShape,
        isAnyCreatingNewState: PropTypes.bool,
        isShowingWithoutId: PropTypes.bool,
        onChangedProjectTitle: PropTypes.func,
        onUpdateProjectTitle: PropTypes.func,
        projectTitle: PropTypes.string,
        reduxProjectTitle: PropTypes.string
    };

    TitledComponent.defaultProps = {
        onUpdateProjectTitle: () => {}
    };

    const mapStateToProps = state => {
        const loadingState = state.scratchGui.projectState.loadingState;
        return {
            isAnyCreatingNewState: getIsAnyCreatingNewState(loadingState),
            isShowingWithoutId: getIsShowingWithoutId(loadingState),
            reduxProjectTitle: state.scratchGui.projectTitle
        };
    };

    const mapDispatchToProps = dispatch => ({
        onChangedProjectTitle: title => dispatch(setProjectTitle(title))
    });

    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );

    return injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(TitledComponent));
};

export {
    TitledHOC as default
};
