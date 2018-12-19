import React from 'react';
import {ContextMenu, MenuItem} from 'react-contextmenu';

import styles from './context-menu.css';

const StyledContextMenu = props => (
    <ContextMenu
        {...props}
        className={styles.contextMenu}
    />
);

const StyledMenuItem = props => (
    <MenuItem
        {...props}
        attributes={{className: styles.menuItem, dividerClassName: styles.divider}}
    />
);

export {
    StyledContextMenu as ContextMenu,
    StyledMenuItem as MenuItem
};
