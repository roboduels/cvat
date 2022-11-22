// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { useHistory } from 'react-router';
import { Col, Row } from 'antd/lib/grid';
import { LoadingOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import Button from 'antd/lib/button';
import Text from 'antd/lib/typography/Text';
import Upload from 'antd/lib/upload';
import Radio from 'antd/lib/radio';

import SearchField from 'components/search-field/search-field';
import { Task, TasksQuery } from 'reducers/interfaces';
import BulkActionsMenu from './bulk-actions-menu';

interface VisibleTopBarProps {
    onFilterStatus: (value: string) => void;
    onSearch: (query: TasksQuery) => void;
    onFileUpload(file: File): void;
    query: TasksQuery;
    taskImporting: boolean;
    filterStatus: string | null;
    checkedTasks: Record<string | number, Task>;
}

export default function TopBarComponent(props: VisibleTopBarProps): JSX.Element {
    const {
        query, onSearch, onFileUpload, taskImporting, onFilterStatus, filterStatus, checkedTasks,
    } = props;

    const history = useHistory();

    return (
        <Row className='cvat-tasks-page-top-bar' justify='center' align='middle'>
            <Col md={22} lg={18} xl={16} xxl={14}>
                <Row justify='space-between' align='middle'>
                    <Col>
                        <Text className='cvat-title'>My Assigned Tasks</Text>
                    </Col>
                    <Col>
                        <Row gutter={8}>
                            <Col>
                                <Upload
                                    accept='.zip'
                                    multiple={false}
                                    showUploadList={false}
                                    beforeUpload={(file: File): boolean => {
                                        onFileUpload(file);
                                        return false;
                                    }}
                                    className='cvat-import-task'
                                >
                                    <Button
                                        size='large'
                                        id='cvat-import-task-button'
                                        type='primary'
                                        disabled={taskImporting}
                                        icon={<UploadOutlined />}
                                    >
                                        Import Task
                                        {taskImporting && <LoadingOutlined id='cvat-import-task-button-loading' />}
                                    </Button>
                                </Upload>
                            </Col>
                            <Col>
                                <Button
                                    size='large'
                                    id='cvat-create-task-button'
                                    type='primary'
                                    onClick={(): void => history.push('/tasks/create')}
                                    icon={<PlusOutlined />}
                                >
                                    Create new task
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Row justify='space-between' align='middle' style={{ marginTop: 14 }}>
                    <Col>
                        <SearchField instance='task' onSearch={onSearch} query={query} />
                    </Col>
                    <Col>
                        <Row gutter={8} align='middle'>
                            <Col style={{ marginRight: 14 }}>
                                <BulkActionsMenu checkedTasks={checkedTasks} />
                            </Col>
                            <Col>
                                Filter:
                            </Col>
                            <Col>
                                <Radio.Group
                                    defaultValue={filterStatus}
                                    size='small'
                                    buttonStyle='solid'
                                    onChange={({ target: { value } }) => onFilterStatus(value)}
                                >
                                    <Radio.Button value={null}>All</Radio.Button>
                                    <Radio.Button value='completed'>Completed</Radio.Button>
                                    <Radio.Button value='annotation'>Pending</Radio.Button>
                                </Radio.Group>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}
