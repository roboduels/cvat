// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
import React, {
    useCallback, useEffect, useMemo, useState,
} from 'react';
import notification from 'antd/lib/notification';
import Typography from 'antd/lib/typography';
import Table, { ColumnsType } from 'antd/lib/table';
import Button from 'antd/lib/button';
import { Link } from 'react-router-dom';
import {
    Activity, computeActivity, ComputedActivity, fetchActivities,
} from '../../utils/activity';

function ActivityListPage(): JSX.Element {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ComputedActivity[]>([]);
    const columns = useMemo<ColumnsType<ComputedActivity>>(() => ([
        {
            title: '# User',
            dataIndex: 'id',
            key: 'id',
            sorter: (a: ComputedActivity, b: ComputedActivity) => a.totalScore - b.totalScore,
        },
        {
            title: 'Label',
            dataIndex: 'label',
            key: 'label',
            sorter: (a: ComputedActivity, b: ComputedActivity) => a.label.localeCompare(b.label),
        },
        {
            title: 'Score',
            dataIndex: 'totalScore',
            key: 'totalScore',
            sorter: (a: ComputedActivity, b: ComputedActivity) => a.totalScore - b.totalScore,
        },
        {
            title: 'Average Score',
            dataIndex: 'avgScore',
            key: 'avgScore',
            sorter: (a: ComputedActivity, b: ComputedActivity) => a.avgScore - b.avgScore,
        },

        {
            title: 'Options',
            key: 'options',
            render: (text: string, record: ComputedActivity) => (
                <Link to={`/activity/${record.id}`}>
                    <Button block>View</Button>
                </Link>
            ),
        },
    ]), []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const activities = await fetchActivities();
            const grouped = activities.reduce< { [key: string]: Activity[] }>((acc, cur) => ({
                ...acc,
                [cur.user_id]: [...(acc[cur.user_id] ?? []), cur],
            }), {});

            const dataMap: Record<string, any> = {};

            Object.values(grouped).forEach((list) => {
                const userId = list[0]?.user_id;
                dataMap[userId] = computeActivity(list);
            });

            setData(Object.values(dataMap));
        } catch (e) {
            console.error(e);
            notification.error({
                message: 'Failed to load activities',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        load();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Typography.Text>Loading...</Typography.Text>
            </div>
        );
    }

    if (data?.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Typography.Text>No activities found</Typography.Text>
            </div>
        );
    }

    return (
        <div
            style={{
                width: '100%', maxWidth: 1140, padding: '30px 24px', margin: '0 auto',
            }}
        >
            <Table columns={columns} dataSource={data} />
        </div>
    );
}

export default ActivityListPage;
