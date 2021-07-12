import React from 'react';

/* Higher Order Component to throttle updates to specific props by delaying it,
 * instead of ignoring it (like ThrottledPropertyHOC)
 * @param {string} propName the name of the prop to throttle updates from.
 * @param {string} throttleTime the minimum time (in ms) between updates to that specific property.
 * @returns {function} a function that accepts a component to wrap.
 */

const DebouncedPropertyHOC = function (propName, throttleTime) {
    return function (WrappedComponent) {
        class DebouncedPropertyWrapper extends React.Component {
            constructor () {
                super();
                this.state = {
                    propValue: this.props && this.props[propName]
                };
                this.pendingTimeout = null;
            }

            shouldComponentUpdate (nextProps) {
                // if pending timeout, we may or may not want to update
                if (this.pendingTimeout) {
                    // update if any other property *besides* propName's value has changed
                    for (const nextProp in nextProps) {
                        if (nextProp !== propName && this.props[nextProp] !== nextProps[nextProp]) {
                            return true;
                        }
                    }
                    return false; // nothing besides propName's value has changed
                }
                return true; // not pending timeout, so definitely want to update
            }

            componentDidUpdate (prevProps) {
                // if no timeout is pending, and propName's value has changed:
                if (!this.pendingTimeout && prevProps[propName] !== this.props[propName]) {
                    // set a timeout, at the end of which we'll update state's propValue
                    this.pendingTimeout = setTimeout(() => {
                        this.pendingTimeout = null;
                        if (this.state.propValue !== this.props[propName]) {
                            this.setState({
                                propValue: this.props[propName]
                            });
                        }
                    }, throttleTime);
                    this.setState({ // eslint-disable-line react/no-did-update-set-state
                        propValue: this.props[propName]
                    });
                }
            }

            componentWillUnmount () {
                if (this.pendingTimeout) clearTimeout(this.pendingTimeout);
            }

            render () {
                let props = {};
                if (this.pendingTimeout) {
                    props = Object.assign({}, this.props, {[propName]: this.state.propValue});
                } else {
                    props = this.props;
                }
                return (
                    <WrappedComponent
                        {...props}
                    />
                );
            }
        }
        return DebouncedPropertyWrapper;
    };
};

export default DebouncedPropertyHOC;
