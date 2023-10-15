// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';

import { StatesOrdering } from 'reducers/interfaces';
import ObjectItemContainer from 'containers/annotation-page/standard-workspace/objects-side-bar/object-item';
import ObjectListHeader from './objects-list-header';

interface Props {
    readonly: boolean;
    statesHidden: boolean;
    statesLocked: boolean;
    statesCollapsedAll: boolean;
    statesOrdering: StatesOrdering;
    sortedStatesID: number[];
    objectStates: any[];
    switchLockAllShortcut: string;
    switchHiddenAllShortcut: string;
    deleteAllShortcut: string;
    changeStatesOrdering(value: StatesOrdering): void;
    lockAllStates(): void;
    unlockAllStates(): void;
    collapseAllStates(): void;
    deleteAllStates(): void;
    expandAllStates(): void;
    hideAllStates(): void;
    showAllStates(): void;
}

function ObjectListComponent(props: Props): JSX.Element {
    const {
        readonly,
        statesHidden,
        statesLocked,
        statesCollapsedAll,
        statesOrdering,
        sortedStatesID,
        objectStates,
        switchLockAllShortcut,
        switchHiddenAllShortcut,
        deleteAllShortcut,
        changeStatesOrdering,
        lockAllStates,
        unlockAllStates,
        collapseAllStates,
        deleteAllStates,
        expandAllStates,
        hideAllStates,
        showAllStates,
    } = props;

    return (
        <>
            <ObjectListHeader
                readonly={readonly}
                statesHidden={statesHidden}
                statesLocked={statesLocked}
                statesCollapsed={statesCollapsedAll}
                statesOrdering={statesOrdering}
                switchLockAllShortcut={switchLockAllShortcut}
                deleteAllShortcut={deleteAllShortcut}
                switchHiddenAllShortcut={switchHiddenAllShortcut}
                changeStatesOrdering={changeStatesOrdering}
                lockAllStates={lockAllStates}
                unlockAllStates={unlockAllStates}
                collapseAllStates={collapseAllStates}
                deleteAllStates={deleteAllStates}
                expandAllStates={expandAllStates}
                hideAllStates={hideAllStates}
                showAllStates={showAllStates}
            />
            <div className='cvat-objects-sidebar-states-list'>
                {sortedStatesID.map(
                    (id: number): JSX.Element => (
                        <ObjectItemContainer
                            readonly={readonly}
                            objectStates={objectStates}
                            key={id}
                            clientID={id}
                            initialCollapsed={statesCollapsedAll}
                        />
                    ),
                )}
            </div>
        </>
    );
}

export default React.memo(ObjectListComponent);
