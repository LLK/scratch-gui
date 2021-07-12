import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import styles from './input.css';

const Input = props => {
    const {small, ...componentProps} = props;
    return (
        <input
            {...componentProps}
            autoCapitalize="none"
            autoCorrect="off"
            className={classNames(
                styles.inputForm,
                props.className,
                {
                    [styles.inputSmall]: small
                }
            )}
        />
    );
};

Input.propTypes = {
    className: PropTypes.string,
    small: PropTypes.bool
};

Input.defaultProps = {
    small: false
};

export default Input;
