// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import Menu from 'antd/lib/menu';
import Button from 'antd/lib/button';
import Dropdown from 'antd/lib/dropdown';
import React, { useCallback, useMemo, useState } from 'react';
import { chunk, set } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
// eslint-disable-next-line import/no-extraneous-dependencies
import createTaskQueue from 'sync-task-queue';
import Tooltip from 'antd/lib/tooltip';
import Progress from 'antd/lib/progress';
import Tree from 'antd/lib/tree';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import Badge from 'antd/lib/badge';
import notification from 'antd/lib/notification';
import { CombinedState, Task } from '../../reducers/interfaces';
import { parseFilename } from '../../utils/grades';
import { submitAnnotationFrameToGradeAsync } from '../../actions/grades-actions';
import { markTaskChecked, setGradingQueueJob } from '../../actions/tasks-actions';

interface Props {
    checkedTasks: Record<string | number, Task['instance']>;
}

enum Actions {
    GENERATE_GRADES = 'GENERATE_GRADES',
    GENERATE_GRADES_AND_MASKS = 'GENERATE_GRADES_AND_MASKS',
}

const queue = createTaskQueue();

async function getTaskFrames(task: any): Promise<{ task: any; frame: any; annotation: any; }[]> {
    const { size } = task;
    let i = 1;
    let frame = await task.frames.get(0);
    let annotation = await task.annotations.get(0);
    const frames = [{ frame, task, annotation }];

    while (i < size) {
        [frame, annotation] = await Promise.all([
            task.frames.get(i),
            task.annotations.get(i),
        ]);
        frames.push({ frame, task, annotation });
        i++;
    }

    return frames;
}

async function getFrames(checkedTasks: Record<string | number, any>): Promise<{ task: any; frame: any; }[]> {
    const tasks = Object.entries(checkedTasks).map(([, task]) => task);
    let task = tasks.shift();
    const frames = [];

    while (task) {
        const taskFrames = await getTaskFrames(task);
        frames.push(...taskFrames);
        task = tasks.shift();
    }

    return frames.flat();
}

function processChunks(chunks: any[][], { dispatch, withMasks }: Record<string, any>): void {
    chunks.forEach((current) => {
        current.forEach(({ task, frame }) => {
            const options = parseFilename(frame.filename, task);
            dispatch(setGradingQueueJob({ task, frame, options }, 'pending'));
        });

        queue.enqueue(async () => {
            await Promise.all(current.map(async ({ frame, annotation, task }: Record<string, any>) => {
                const options = parseFilename(frame.filename, task);
                dispatch(setGradingQueueJob({ task, frame, options }, 'running'));
                try {
                    await new Promise((resolve, reject) => dispatch(submitAnnotationFrameToGradeAsync({
                        ...options,
                        job: task.jobs[0],
                        frame,
                        annotation,
                        resolve,
                        reject,
                        withMasks,
                        noNotifications: true,
                    })));
                    dispatch(markTaskChecked(task));
                    dispatch(setGradingQueueJob({
                        task,
                        frame,
                        options,
                    }, 'done'));
                } catch (e) {
                    console.log(e, task);
                    dispatch(setGradingQueueJob({
                        error: e,
                        task,
                        frame,
                        options,
                    }, 'error'));
                }
            }));
        });
    });
}

export default function BulkActionsMenu(props: Props): JSX.Element | null {
    const {
        checkedTasks,
    } = props;

    const dispatch = useDispatch();
    const pendingJobs = useSelector((state: CombinedState) => state.tasks.pendingJobs);
    const [extended, setExtended] = useState(true);

    const handleGenerateGrades = useCallback(async (withMasks?: boolean) => {
        notification.info({
            message: 'Generating grades',
            description: 'This may take a while',
        });

        const frames = await getFrames(checkedTasks);
        const chunks = chunk(frames, 4);
        processChunks(chunks, { dispatch, withMasks });
    }, [checkedTasks]);

    const handleClick = useCallback((params: Record<string, any>) => {
        // eslint-disable-next-line default-case
        switch (params.key as Actions) {
            case Actions.GENERATE_GRADES:
                handleGenerateGrades();
                break;
            case Actions.GENERATE_GRADES_AND_MASKS:
                handleGenerateGrades(true);
                break;
        }
    }, [checkedTasks]);

    const jobs = useMemo(() => Object.values(pendingJobs), [pendingJobs]);
    const pending = useMemo(() => jobs.filter((job) => job.status === 'pending'), [jobs]);
    const running = useMemo(() => jobs.filter((job) => job.status === 'running'), [jobs]);
    const error = useMemo(() => jobs.filter((job) => job.status === 'error'), [jobs]);
    const done = useMemo(() => jobs.filter((job) => job.status === 'done'), [jobs]);
    const progress = useMemo(() => 100 - ((100 * (pending.length + running.length)) / jobs.length), [jobs]);
    const doneProgress = useMemo(() => ((100 * (done.length)) / jobs.length), [jobs]);
    const tooltipText = useMemo(() => [
        `${done.length} done`,
        `${running.length} running`,
        `${error.length} error`,
        `${pending.length} pending`,
    ].join(' / '), [done.length, running.length, error.length, pending.length]);

    const tree = useMemo(() => {
        const map = jobs.reduce((acc, data) => {
            set(acc, `${data.taskId}.title`, data.orderId);
            set(acc, `${data.taskId}.key`, data.taskId);
            set(acc, `${data.taskId}.children.${data.frame}.title`, `${data.certId} - ${data.status}${data.error ? ` - ${data.error}` : ''}`);
            set(acc, `${data.taskId}.children.${data.frame}.key`, `${data.taskId}-${data.frame}`);
            return acc;
        }, {});

        return Object.values(map).map((item: any) => {
            item.children = Object.values(item.children);
            return item;
        });
    }, [jobs]);

    if (!checkedTasks || Object.keys(checkedTasks).length === 0) {
        return null;
    }

    return (
        <>
            <Dropdown
                overlay={(
                    <Menu selectable={false} className='cvat-actions-menu' onClick={handleClick}>
                        <Menu.Item key={Actions.GENERATE_GRADES}>Generate Grades</Menu.Item>
                        <Menu.Item key={Actions.GENERATE_GRADES_AND_MASKS}>Generate Grades + Masks</Menu.Item>
                    </Menu>
                )}
            >
                <Button type='primary'>
                    Bulk Actions
                </Button>
            </Dropdown>

            { jobs.length > 0 ? (
                <div className='cvat-jobs-manager'>
                    <header className='cvat-jobs-manager-header'>
                        { extended ? (
                            <p className='cvat-jobs-manager-title'>
                                Grading Jobs (
                                { jobs.length }
                                )
                            </p>
                        ) : null }

                        <Badge count={pending.length + running.length}>
                            <Button
                                type='primary'
                                shape='circle'
                                onClick={() => setExtended((prev) => !prev)}
                                icon={extended ? <DownOutlined /> : <UpOutlined />}
                            />
                        </Badge>
                    </header>
                    { extended ? (
                        <div className='cvat-jobs-manager-progress'>
                            <Tooltip title={tooltipText}>
                                <Progress percent={parseInt(progress, 10)} success={{ percent: doneProgress }} />
                            </Tooltip>
                        </div>
                    ) :
                        null }
                    { extended ? (
                        <div className='cvat-jobs-manager-tree'>
                            <Tree
                                defaultExpandAll
                                showLine
                                switcherIcon={<DownOutlined />}
                                icon={<DownOutlined />}
                                treeData={tree as any}
                            />
                        </div>
                    ) : null }
                </div>
            ) : null }
        </>
    );
}
