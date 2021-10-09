// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { ActionUnion, createAction, ThunkAction } from '../utils/redux';
import { CombinedState, CvatGrades, GradesState } from '../reducers/interfaces';
import { mapGradeValue } from '../utils/grades';

export enum GradesActionsTypes {
    LOAD_VALUES = 'grades@LOAD_VALUES',
    ASSIGN_VALUES = 'grades@ASSIGN_VALUES',
    UPDATE_VALUE = 'grades@UPDATE_VALUE',
    SET_LOADING = 'grades@SET_LOADING',
    SET_ERROR = 'grades@SET_ERROR',
}

export const gradesActions = {
    setGrades: (values: GradesState['values']) => createAction(GradesActionsTypes.LOAD_VALUES, { values }),
    assignGrades: (values: Partial<GradesState['values']>) =>
        createAction(GradesActionsTypes.ASSIGN_VALUES, { values }),
    setLoading: (loading: boolean) => createAction(GradesActionsTypes.SET_LOADING, { loading }),
    setError: (error: boolean) => createAction(GradesActionsTypes.SET_ERROR, { error }),
    updateValue: (key: keyof GradesState['values'] | string, value: string | number) =>
        createAction(GradesActionsTypes.UPDATE_VALUE, { key, value }),
};

export type GradesActions = ActionUnion<typeof gradesActions>;

function apiCall(endpoint: string, opts: RequestInit = {}) {
    return fetch(`http://34.222.149.76/api${endpoint}`, {
        ...opts,
        headers: {
            ...(opts.headers || {}),
            Authorization:
                'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjQ3MDE5ODQ4LCJqdGkiOiI3NDU2ZjE4NjVmNTI0MmY0ODgwNWQzNWVkZjAzYzQzZCIsInVzZXJfaWQiOjU3OH0.MiTXDgWsHdpXm7J1noaRu9fGbv8u6i3IrDJE2bpK3bg',
        },
    });
}

export const loadingGradesAsync = (certificateId: string | number): ThunkAction => async (dispatch) => {
    try {
        dispatch(gradesActions.setLoading(true));

        const res = await apiCall(`/v2/robograding/scan-results?certificate_ids=${certificateId}`);
        const data = await res.json();
        const result = (data.results || [])[0];

        dispatch(
            gradesActions.setGrades({
                back_centering_human_grade: mapGradeValue(result?.back_centering_human_grade),
                back_corners_human_grade: mapGradeValue(result?.back_corners_human_grade),
                back_edges_human_grade: mapGradeValue(result?.back_edges_human_grade),
                back_surface_human_grade: mapGradeValue(result?.back_surface_human_grade),
                front_centering_human_grade: mapGradeValue(result?.front_centering_human_grade),
                front_corners_human_grade: mapGradeValue(result?.front_corners_human_grade),
                front_edges_human_grade: mapGradeValue(result?.front_edges_human_grade),
                front_surface_human_grade: mapGradeValue(result?.front_surface_human_grade),
                back_centering_laser_grade: mapGradeValue(result?.laser_back_scan?.centering_grade?.grade),
                back_corners_laser_grade: mapGradeValue(result?.laser_back_scan?.corners_grade?.grade),
                back_edges_laser_grade: mapGradeValue(result?.laser_back_scan?.edges_grade?.grade),
                back_surface_laser_grade: mapGradeValue(result?.laser_back_scan?.surface_grade?.grade),
                front_centering_laser_grade: mapGradeValue(result?.laser_front_scan?.centering_grade?.grade),
                front_corners_laser_grade: mapGradeValue(result?.laser_front_scan?.corners_grade?.grade),
                front_edges_laser_grade: mapGradeValue(result?.laser_front_scan?.edges_grade?.grade),
                front_surface_laser_grade: mapGradeValue(result?.laser_front_scan?.surface_grade?.grade),
            }),
        );
    } catch (error) {
        dispatch(gradesActions.setError(error));
    }

    dispatch(gradesActions.setLoading(false));
};

export const submitAnnotationFrameToGradeAsync = (orientation: 'front' | 'back' | string): ThunkAction => async (
    dispatch,
    getState,
) => {
    const state = getState() as CombinedState;
    const { states } = state.annotation.annotations;
    const { frame } = state.annotation.player;

    const res = await apiCall('/cvat-to-grade', {
        method: 'POST',
        body: JSON.stringify({
            filename: frame.filename,
            objects: states.map((item) => ({
                points: item.points,
                label: item.label.name,
                shape: item.shapeType,
            })),
            image: {
                width: frame.data.width,
                height: frame.data.height,
            },
        }),
    });

    const data: CvatGrades = await res.json();

    dispatch(
        gradesActions.assignGrades({
            [`${orientation}_centering_laser_grade`]: mapGradeValue(data?.center),
            [`${orientation}_corners_laser_grade`]: mapGradeValue(data?.corner),
            [`${orientation}_edges_laser_grade`]: mapGradeValue(data?.edge),
            [`${orientation}_surface_laser_grade`]: mapGradeValue(data?.surface),
        }),
    );
};

export const submitHumanGradesAsync = (certificateId: string | number): ThunkAction => async (dispatch, getState) => {
    const state = getState() as CombinedState;
    const { values } = state.grades;

    const res = await apiCall(`/v2/robograding/certificates/?certificate_id=${certificateId}`, {
        method: 'PATCH',
        body: JSON.stringify({
            front_centering_human_grade: mapGradeValue(values.front_centering_human_grade),
            front_corners_human_grade: mapGradeValue(values.front_corners_human_grade),
            front_edges_human_grade: mapGradeValue(values.front_edges_human_grade),
            front_surface_human_grade: mapGradeValue(values.front_surface_human_grade),
            back_centering_human_grade: mapGradeValue(values.back_centering_human_grade),
            back_corners_human_grade: mapGradeValue(values.back_corners_human_grade),
            back_edges_human_grade: mapGradeValue(values.back_edges_human_grade),
            back_surface_human_grade: mapGradeValue(values.back_surface_human_grade),

            // TODO: calculate
            overall_centering_grade: 8.7,
            overall_corners_grade: 8.6,
            overall_edges_grade: 8.1,
            overall_surface_grade: 9.2,
            overall_grade: {
                grade: 8.5,
                nickname: 'MINT',
            },
        }),
    });

    const data = await res.json();
    dispatch(
        gradesActions.assignGrades({
            back_centering_human_grade: mapGradeValue(data.back_centering_human_grade),
            back_corners_human_grade: mapGradeValue(data.back_corners_human_grade),
            back_edges_human_grade: mapGradeValue(data.back_edges_human_grade),
            back_surface_human_grade: mapGradeValue(data.back_surface_human_grade),
            front_centering_human_grade: mapGradeValue(data.front_centering_human_grade),
            front_corners_human_grade: mapGradeValue(data.front_corners_human_grade),
            front_edges_human_grade: mapGradeValue(data.front_edges_human_grade),
            front_surface_human_grade: mapGradeValue(data.front_surface_human_grade),
        }),
    );
};
