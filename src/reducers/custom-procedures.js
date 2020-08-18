const ACTIVATE_CUSTOM_PROCEDURES = 'scratch-gui/custom-procedures/ACTIVATE_CUSTOM_PROCEDURES';
const DEACTIVATE_CUSTOM_PROCEDURES = 'scratch-gui/custom-procedures/DEACTIVATE_CUSTOM_PROCEDURES';
const SET_CALLBACK = 'scratch-gui/custom-procedures/SET_CALLBACK';

const initialState = {
    active: false,
    mutator: null,
    isEdit: false,
    callback: null
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case ACTIVATE_CUSTOM_PROCEDURES:
        return Object.assign({}, state, {
            active: true,
            mutator: action.mutator,
            isEdit: action.isEdit,
            callback: action.callback
        });
    case DEACTIVATE_CUSTOM_PROCEDURES:
        // Can be called without a mutator to deactivate without new procedure
        // i.e. when clicking on the modal background
        if (action.mutator) {
            state.callback(action.mutator);
        }
        return Object.assign({}, state, {
            active: false,
            mutator: null,
            isEdit: false,
            callback: null
        });
    case SET_CALLBACK:
        return Object.assign({}, state, {callback: action.callback});
    default:
        return state;
    }
};

/**
 * Action creator to open the custom procedures modal.
 * @param {!Element} mutator The XML node of the mutator for the procedure.
 * @param {!boolean} isEdit True if editing an existing custom procedure.
 * @param {!function(!Element)} callback The function to call when done editing procedure.
 *     Expect the callback to be a function that takes a new XML mutator node.
 * @returns {object} An action object with type ACTIVATE_CUSTOM_PROCEDURES.
 */
const activateCustomProcedures = (mutator, isEdit, callback) => ({
    type: ACTIVATE_CUSTOM_PROCEDURES,
    mutator: mutator,
    isEdit: isEdit,
    callback: callback
});

/**
 * Action creator to close the custom procedures modal.
 * @param {?Element} mutator The new mutator, or null if the callback should not be called.
 * @returns {object} An action object with type ACTIVATE_CUSTOM_PROCEDURES.
 */
const deactivateCustomProcedures = mutator => ({
    type: DEACTIVATE_CUSTOM_PROCEDURES,
    mutator: mutator
});

export {
    reducer as default,
    initialState as customProceduresInitialState,
    activateCustomProcedures,
    deactivateCustomProcedures
};
