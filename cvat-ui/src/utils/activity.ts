// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
import axios, { AxiosRequestConfig } from 'axios';
import moment, { Moment } from 'moment';

export enum Activities {
    TASK_ANNOTATION_CHANGED = 'Activities.TASK_ANNOTATION_CHANGED',
    TASK_ASSIGNED = 'Activities.TASK_ASSIGNED',
    TASK_UPDATED = 'Activities.TASK_UPDATED',
}

export function mapActivityType(activityType: Activities): string {
    switch (activityType) {
        case Activities.TASK_ANNOTATION_CHANGED:
            return 'Annotation changed';
        case Activities.TASK_ASSIGNED:
            return 'Task assigned';
        case Activities.TASK_UPDATED:
            return 'Task updated';
        default:
            return 'Unknown activity';
    }
}

function scoreVal(val: any): number {
    return Math.max(1, parseInt(val, 10));
}

export interface Activity {
    id: number;
    user_id: number;
    activity_type: Activities;
    options: { time: string } & Record<string, any>;
    hash: string;

    user: Record<'id' | 'first_name' | 'last_name' | 'username' | 'email', any>;
}

export async function fetchActivities(config?: AxiosRequestConfig): Promise<Activity[]> {
    const { data } = await axios.get<Activity[]>('/api/v1/activity', config);
    return (data || []).sort((a, b) => b.id - a.id);
}

export async function fetchActivitiesOfUser(userId: number | number[]): Promise<Activity[]> {
    return fetchActivities({
        params: {
            user_id: Array.isArray(userId) ? userId.join(',') : userId,
        },
    });
}

export async function fetchActivitiesOfTask(taskId: number | number[]): Promise<Activity[]> {
    return fetchActivities({
        params: {
            task_id: taskId,
        },
    });
}

export interface ComputedActivity {
    id: number;
    email: string;
    label: string;
    totalScore: number;
    avgScore: number;
    activities: Activity[];
}

export function computeActivity(activities: Activity[]): ComputedActivity {
    const scores: Record<string, any> = {};
    activities.forEach((item) => {
        const date: Moment = moment(item.options.time);
        const key = date.format('YYYY-MM-DD');
        let score = scores[key] || 0;

        if (item.activity_type === Activities.TASK_ANNOTATION_CHANGED) {
            score += scoreVal(item.options.shapes_no) +
                     scoreVal(item.options.tags_no) +
                     scoreVal(item.options.tracks_no);
        } else {
            score += 1;
        }

        scores[key] = score;
    });

    const { user } = activities[0];
    const label = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username || 'Unknown';
    const totalScore = Object.values(scores).reduce((acc, val) => acc + val, 0);
    const avgScore = totalScore / Object.keys(scores).length;

    return {
        id: user.id,
        email: user.email,
        label,
        totalScore,
        avgScore,
        activities,
    };
}
