// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import notification from 'antd/lib/notification';
import Typography from 'antd/lib/typography';
import Row from 'antd/lib/row';
import Timeline from 'antd/lib/timeline';
import { Link } from 'react-router-dom';
import moment from 'moment';
import {
    Activities,
    Activity,
    computeActivity,
    ComputedActivity,
    fetchActivitiesOfUser,
    mapActivityType,
} from '../../utils/activity';

function ActivityShowPage(): JSX.Element {
    const { uid } = useParams();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ComputedActivity | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const activities = await fetchActivitiesOfUser(uid);
            setData(computeActivity(activities));
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

    function mapDescription(item: Activity):JSX.Element | null {
        if (item.activity_type === Activities.TASK_ANNOTATION_CHANGED) {
            const mapVal = (value: string, one: string, more: string): string => (
                `${value} ${Number(value) === 1 ? one : more}`
            );

            const line = [
                item.options?.shapes_no ? mapVal(item.options?.shapes_no, 'shape', 'shapes') : '',
                item.options?.tags_no ? mapVal(item.options?.tags_no, 'tag', 'tags') : '',
                item.options?.tracks_no ? mapVal(item.options?.tracks_no, 'track', 'tracks') : '',
            ].filter(Boolean).join(', ');

            let href = '';
            if (item.options?.task_id) {
                href = `/tasks/${item.options?.task_id}`;
                if (item.options?.job_id) {
                    href += `/jobs/${item.options?.job_id}`;
                }
            }

            return (
                <>
                    Changed&nbsp;
                    { href ? (
                        <Link to={href}>{`Task #${item.options?.task_id}`}</Link>
                    ) : 'Task' }
                    {line ? `, (${line})` : ''}
                </>
            );
        }

        return null;
    }

    useEffect(() => {
        const el = document.querySelector<HTMLDivElement>('#root > .ant-layout');
        if (el) {
            el.style.background = '#fff';
        }
        return () => {
            if (el) {
                el.style.removeProperty('background');
            }
        };
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Typography.Text>Loading...</Typography.Text>
            </div>
        );
    }

    if (!data) {
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
            <div
                style={{
                    width: '100%', display: 'flex', flexDirection: 'column', marginBottom: 32,
                }}
            >
                <Typography.Title style={{ marginBottom: 0 }}>Activity Log</Typography.Title>
                <Typography.Text>
                    <b style={{ marginRight: 6 }}>Name:</b>
                    { data.label }
                </Typography.Text>
                <Typography.Text>
                    <b style={{ marginRight: 6 }}>Email:</b>
                    { data.email ?? '-' }
                </Typography.Text>
            </div>
            <Timeline>
                { data.activities.map((item) => (
                    <Timeline.Item key={item.hash}>
                        <Row>
                            <b>{ `${mapActivityType(item.activity_type)}:` }</b>
                                    &nbsp;
                            <span>{ moment(item.options?.time).format('lll') }</span>
                        </Row>
                        <Row>
                            <Typography.Text>
                                {mapDescription(item)}
                            </Typography.Text>
                        </Row>
                    </Timeline.Item>
                )) }
            </Timeline>
        </div>
    );
}

export default ActivityShowPage;
