const UPDATE_TARGET_LIST = 'scratch-gui/targets/UPDATE_TARGET_LIST';

const initialState = {
    sprites: {},
    stage: {}
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case UPDATE_TARGET_LIST:
        return Object.assign({}, state, {
            sprites: action.targets
                .filter(target => !target.isStage)
                .reduce(
                    (targets, target, listId) => Object.assign(
                        targets,
                        {[target.id]: {order: listId, ...target}}
                    ),
                    {}
                ),
            stage: action.targets
                .filter(target => target.isStage)[0] || {},
            editingTarget: action.editingTarget
        });
    default:
        return state;
    }
};
const updateTargetsAction_ = function (targetList, editingTarget, editingCostume) {
    return {
        type: UPDATE_TARGET_LIST,
        targets: targetList,
        editingTarget: editingTarget,
        editingCostume: editingCostume,
        meta: {
            throttle: 30
        }
    };
};
/**
 * Updates state.targets and state.editingTarget. Also updates state.editingCostume,
 * the costume that is active in the paint editor, to match the editing sprite's active
 * costume if the editing target changes or if costumes have been added or removed.
 * @param {string} editingTarget Id of the active editing target
 * @param {Array<Target>} targetList List of all sprite objects in the project
 * @return {function} function which returns an action that updates the state's targets,
 *     editingTarget, and editingCostume together.
 */
const updateTargets = function (editingTarget, targetList) {
    return function (dispatch, getState) {
        const state = getState();
        let editingCostume = state.editingCostumeIndex ? state.editingCostumeIndex : 0;
        if (!editingTarget || !targetList || !state.targets || !state.targets.sprites) {
            dispatch(updateTargetsAction_(targetList, editingTarget, editingCostume));
            return Promise.resolve();
        }

        // Detect if a costume has been deleted from the editing target.
        // If so, update the editing costume index to the target's current costume.

        // When the editing target is changed, also update the editing costume index
        let oldCostumes = 0;
        if (state.targets.stage.id === editingTarget) {
            oldCostumes = state.targets.stage.costumeCount;
        } else {
            for (const sprite in state.targets.sprites) {
                if (state.targets.sprites.hasOwnProperty(sprite) &&
                        sprite === editingTarget) {
                    oldCostumes = state.targets.sprites[sprite].costumeCount;
                    break;
                }
            }
        }
        for (const target of targetList) {
            if (target.id === editingTarget) {
                const newCostumes = target.costumeCount;
                if (newCostumes !== oldCostumes ||
                        state.targets.editingTarget !== editingTarget) {
                    editingCostume = target.currentCostume;
                }
                break;
            }
        }
        dispatch(updateTargetsAction_(targetList, editingTarget, editingCostume));
        return Promise.resolve();
    };
};
export {
    reducer as default,
    updateTargets,
    UPDATE_TARGET_LIST
};
