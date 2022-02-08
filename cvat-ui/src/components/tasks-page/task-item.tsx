// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { RouteComponentProps } from 'react-router';
import { withRouter } from 'react-router-dom';
import Text from 'antd/lib/typography/Text';
import { Row, Col } from 'antd/lib/grid';
import Button from 'antd/lib/button';
import Icon from '@ant-design/icons';
import Dropdown from 'antd/lib/dropdown';
import Progress from 'antd/lib/progress';
import moment from 'moment';

import ActionsMenuContainer from 'containers/actions-menu/actions-menu';
import { ActiveInference } from 'reducers/interfaces';
import { MenuIcon } from 'icons';
import UserSelector, { User } from 'components/task-page/user-selector';
import Checkbox from 'antd/lib/checkbox';
import AutomaticAnnotationProgress from './automatic-annotation-progress';
import { fetchActivitiesOfTask } from '../../utils/activity';

export interface TaskItemProps {
    taskInstance: any;
    previewImage: string;
    deleted: boolean;
    hidden: boolean;
    checked?: boolean;
    activeInference: ActiveInference | null;

    cancelAutoAnnotation(): void;

    onTaskUpdate: (taskInstance: any) => void;
    onJobUpdate: (jobInstance: any) => void;
    onCheck: (taskInstance: any) => void;
}

interface State {
    lastActivity: any | null,
    loadedActivity: boolean
}

class TaskItemComponent extends React.PureComponent<TaskItemProps & RouteComponentProps, State> {
    constructor(props: TaskItemProps & RouteComponentProps) {
        super(props);
        this.state = {
            lastActivity: null,
            loadedActivity: false,
        };
    }

    public componentDidMount(): void {
        const { loadedActivity } = this.state;
        const { taskInstance } = this.props;
        const { id } = taskInstance || {};
        if (id && !loadedActivity) {
            this.setState({ loadedActivity: true });

            fetchActivitiesOfTask(id)
                .then((data) => {
                    const list = data.sort((a, b) => b.id - a.id);
                    this.setState({
                        lastActivity: list[0],
                    });
                }).catch(() => {
                    this.setState({
                        lastActivity: null,
                    });
                });
        }
    }

    private stopPropagation(e: any): void {
        e?.preventDefault();
        e?.stopPropagation();
    }

    private renderPreview(): JSX.Element {
        const { previewImage } = this.props;
        return (
            <Col span={4}>
                <div className='cvat-task-item-preview-wrapper'>
                    <img alt='Preview' className='cvat-task-item-preview' src={previewImage} />
                </div>
            </Col>
        );
    }

    private renderCheckbox(): JSX.Element | null {
        const { checked, onCheck, taskInstance } = this.props;
        if (!onCheck) {
            return null;
        }

        return (
            <div className='cvat-task-item-checkbox'>
                <Checkbox
                    checked={!!checked}
                    onChange={() => onCheck(taskInstance)}
                />
            </div>
        );
    }

    private renderDescription(): JSX.Element {
        // Task info
        const { taskInstance } = this.props;
        const { id } = taskInstance;
        const owner = taskInstance.owner ? taskInstance.owner.username : null;
        const updated = moment(taskInstance.updatedDate).fromNow();
        const created = moment(taskInstance.createdDate).format('MMMM Do YYYY');

        // Get and truncate a task name
        const name = `${taskInstance.name.substring(0, 70)}${taskInstance.name.length > 70 ? '...' : ''}`;

        const { lastActivity } = this.state;
        let lastUpdatedBy = null;
        if (lastActivity) {
            lastUpdatedBy = `${lastActivity.user.first_name ?? ''} ${lastActivity.user.last_name ?? ''}`.trim() || lastActivity.user.username;
        }

        return (
            <Col span={8} className='cvat-task-item-description'>
                <Text strong type='secondary' className='cvat-item-task-id'>{ `#${id}: ` }</Text>
                <Text strong className='cvat-item-task-name'>
                    { name }
                </Text>
                <br />
                { owner && (
                    <>
                        <Text type='secondary'>{ `Created ${owner ? `by ${owner}` : ''} on ${created}` }</Text>
                        <br />
                    </>
                ) }
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text type='secondary'>{ `Last updated ${updated}` }</Text>
                    { lastUpdatedBy && <Text type='secondary'>{ `By ${lastUpdatedBy}` }</Text> }
                </div>
            </Col>
        );
    }

    private renderProgress(): JSX.Element {
        const {
            taskInstance, activeInference, cancelAutoAnnotation, onTaskUpdate, onJobUpdate,
        } = this.props;
        const assignee = taskInstance.assignee ? taskInstance.assignee : null;
        const jobInstance = taskInstance?.jobs?.[0];
        const reviewer = jobInstance?.reviewer;
        // Count number of jobs and performed jobs
        const numOfJobs = taskInstance.jobs.length;
        const numOfCompleted = taskInstance.jobs.filter((job: any): boolean => job.status === 'completed').length;

        // Progress appearance depends on number of jobs
        let progressColor = null;
        let progressText = null;
        if (numOfCompleted && numOfCompleted === numOfJobs) {
            progressColor = 'cvat-task-completed-progress';
            progressText = (
                <Text strong className={progressColor}>
                    Completed
                </Text>
            );
        } else if (numOfCompleted) {
            progressColor = 'cvat-task-progress-progress';
            progressText = (
                <Text strong className={progressColor}>
                    In Progress
                </Text>
            );
        } else {
            progressColor = 'cvat-task-pending-progress';
            progressText = (
                <Text strong className={progressColor}>
                    Pending
                </Text>
            );
        }

        const jobsProgress = numOfCompleted / numOfJobs;

        return (
            <Col span={8}>
                <Row justify='space-between' align='top'>
                    <Col>
                        <svg height='8' width='8' className={progressColor}>
                            <circle cx='4' cy='4' r='4' strokeWidth='0' />
                        </svg>
                        { progressText }
                    </Col>
                    <Col>
                        <Text type='secondary'>{ `${numOfCompleted} of ${numOfJobs} jobs` }</Text>
                    </Col>
                </Row>
                <Row>
                    <Col span={24}>
                        <Progress
                            className={`${progressColor} cvat-task-progress`}
                            percent={jobsProgress * 100}
                            strokeColor='#1890FF'
                            showInfo={false}
                            strokeWidth={5}
                            size='small'
                        />
                    </Col>
                </Row>
                <AutomaticAnnotationProgress
                    activeInference={activeInference}
                    cancelAutoAnnotation={cancelAutoAnnotation}
                />
                <Row
                    gutter={8}
                    onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <Col span={12}>
                        <Text type='secondary' style={{ fontSize: 12 }}>
                            Assigned to
                        </Text>
                        <UserSelector
                            value={assignee}
                            onSelect={(value: User | null): void => {
                                taskInstance.assignee = value;
                                onTaskUpdate(taskInstance);
                            }}
                        />
                    </Col>
                    <Col span={12}>
                        <Text type='secondary' style={{ fontSize: 12 }}>
                            Reviewer
                        </Text>
                        <UserSelector
                            value={reviewer}
                            onSelect={(value: User | null): void => {
                                jobInstance.reviewer = value;
                                onJobUpdate(jobInstance);
                            }}
                        />
                    </Col>
                </Row>
            </Col>
        );
    }

    private renderNavigation(): JSX.Element {
        const { taskInstance, history } = this.props;
        const { id } = taskInstance;
        const jobId = taskInstance?.jobs?.[0]?.id;
        return (
            <Col span={4}>
                <Row justify='end'>
                    <Col>
                        <Button
                            className='cvat-item-open-task-button'
                            type='primary'
                            size='large'
                            ghost
                            href={`/tasks/${id}/jobs/${jobId}`}
                            onClick={(e: React.MouseEvent): void => {
                                e.preventDefault();
                                history.push(`/tasks/${id}/jobs/${jobId}`);
                            }}
                        >
                            Open
                        </Button>
                    </Col>
                </Row>
                <Row justify='end'>
                    <Col className='cvat-item-open-task-actions'>
                        <Text
                            className='cvat-text-color'
                            onClick={(e) => this.stopPropagation(e)}
                        >
                            Actions
                        </Text>
                        <Dropdown
                            overlay={(
                                <ActionsMenuContainer
                                    taskInstance={taskInstance}
                                />
                            )}
                            {...({ onClick: (e: any) => this.stopPropagation(e) } as any)}
                        >
                            <Icon className='cvat-menu-icon' component={MenuIcon} />
                        </Dropdown>
                    </Col>
                </Row>
            </Col>
        );
    }

    public render(): JSX.Element {
        const {
            deleted, hidden,
        } = this.props;

        const style = {};
        if (deleted) {
            (style as any).pointerEvents = 'none';
            (style as any).opacity = 0.5;
        }

        if (hidden) {
            (style as any).display = 'none';
        }

        return (
            <Row
                className='cvat-tasks-list-item'
                justify='center'
                align='top'
                style={{ ...style }}
            >
                { this.renderCheckbox() }
                { this.renderPreview() }
                { this.renderDescription() }
                { this.renderProgress() }
                { this.renderNavigation() }
            </Row>
        );
    }
}

export default withRouter(TaskItemComponent);
