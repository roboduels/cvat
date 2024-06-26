// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux';

import { TasksQuery, CombinedState, ActiveInference } from 'reducers/interfaces';

import TaskItemComponent from 'components/tasks-page/task-item';

import {
    getTasksAsync, updateTaskAsync, updateJobAsync, markTaskChecked,
} from 'actions/tasks-actions';
import { cancelInferenceAsync } from 'actions/models-actions';

interface StateToProps {
    deleted: boolean;
    hidden: boolean;
    checked: boolean;
    previewImage: string;
    taskInstance: any;
    activeInference: ActiveInference | null;
}

interface DispatchToProps {
    getTasks(query: TasksQuery): void;
    cancelAutoAnnotation(): void;
    onTaskUpdate: (taskInstance: any) => void;
    onJobUpdate: (jobInstance: any) => void;
    onCheck: (taskInstance: any) => void;
}

interface OwnProps {
    idx: number;
    taskID: number;
}

function mapStateToProps(state: CombinedState, own: OwnProps): StateToProps {
    const task = state.tasks.current[own.idx];
    const { deletes } = state.tasks.activities;
    const id = own.taskID;

    return {
        hidden: state.tasks.hideEmpty && task.instance.jobs.length === 0,
        deleted: id in deletes ? deletes[id] : false,
        previewImage: task.preview,
        taskInstance: task.instance,
        activeInference: state.models.inferences[id] || null,
        checked: !!state.tasks.checkedTasks[task.instance.id],
    };
}

function mapDispatchToProps(dispatch: any, own: OwnProps): DispatchToProps {
    return {
        getTasks(query: TasksQuery): void {
            dispatch(getTasksAsync(query));
        },
        cancelAutoAnnotation(): void {
            dispatch(cancelInferenceAsync(own.taskID));
        },
        onTaskUpdate(taskInstance: any): void {
            dispatch(updateTaskAsync(taskInstance));
        },
        onJobUpdate(jobInstance: any): void {
            dispatch(updateJobAsync(jobInstance));
        },
        onCheck(taskInstance: any): void {
            dispatch(markTaskChecked(taskInstance));
        },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(TaskItemComponent);
