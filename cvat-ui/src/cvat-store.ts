// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import thunk from 'redux-thunk';
import {
    applyMiddleware, createStore, Reducer, Store,
} from 'redux';
import { createLogger } from 'redux-logger';
import { isDev } from 'utils/enviroment';
import { CombinedState } from './reducers/interfaces';

const logger = createLogger({
    predicate: isDev,
    collapsed: true,
});

const middlewares = [thunk, logger];

let store: Store | null = null;

export default function createCVATStore(createRootReducer: () => Reducer): void {
    let appliedMiddlewares = applyMiddleware(...middlewares);

    if (isDev()) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
        const { composeWithDevTools } = require('redux-devtools-extension');

        appliedMiddlewares = composeWithDevTools(appliedMiddlewares);
    }

    store = createStore(createRootReducer(), appliedMiddlewares);
}

export function getCVATStore(): Store {
    if (store) {
        return store;
    }

    throw new Error('First create a store');
}

declare module 'react-redux' {
    type DefaultRootState = CombinedState;
}
