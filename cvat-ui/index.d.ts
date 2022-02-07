// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

declare module '*.svg';
declare module 'cvat-core/src/api';

declare module 'sync-task-queue' {
    const creator: () => { enqueue: (task: () => Promise<void>) => Promise<any> };
    export default creator;
}
