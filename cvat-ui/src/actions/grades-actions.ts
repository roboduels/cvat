// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
import { ActionUnion, createAction, ThunkAction } from '../utils/redux';
import { CombinedState, CvatGrades, GradesState } from '../reducers/interfaces';
import {
    calculateAllOverall, calculateOverall, getGradeNickname, mapGradeValue,
} from '../utils/grades';

const certificateNotFound = (message: string): Error => new Error(`${message}, certificate number not found!`);
const orientationNotFound = new Error('Cannot reload robo grades, orientation not found!');

export enum GradesActionsTypes {
    LOAD_VALUES = 'grades@LOAD_VALUES',
    ASSIGN_VALUES = 'grades@ASSIGN_VALUES',
    UPDATE_VALUE = 'grades@UPDATE_VALUE',
    SET_LOADING = 'grades@SET_LOADING',
    SET_ERROR = 'grades@SET_ERROR',
    SET_WARNING = 'grades@SET_WARNING',
}

export const gradesActions = {
    setGrades: (values: GradesState['values']) => createAction(GradesActionsTypes.LOAD_VALUES, { values }),
    assignGrades: (values: Partial<GradesState['values']>) =>
        createAction(GradesActionsTypes.ASSIGN_VALUES, { values }),
    setLoading: (loading: boolean) => createAction(GradesActionsTypes.SET_LOADING, { loading }),
    setError: (error: string | Error | null) => createAction(GradesActionsTypes.SET_ERROR, { error }),
    setWarning: (warning: string | Error | null) => createAction(GradesActionsTypes.SET_WARNING, { warning }),
    updateValue: (key: keyof GradesState['values'] | string, value: string | number) =>
        createAction(GradesActionsTypes.UPDATE_VALUE, { key, value }),
};

export type GradesActions = ActionUnion<typeof gradesActions>;

function apiCall(endpoint: string, opts: RequestInit = {}): Promise<Response> {
    const token = process.env.API_TOKEN;
    return fetch(`https://api.agscard.com/api${endpoint}`, {
        ...opts,
        headers: {
            ...(opts.headers || {}),
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
}

export const setErrorAsync = (error: string | Error): ThunkAction => async (dispatch) => {
    dispatch(gradesActions.setError(error));
    setTimeout(() => {
        dispatch(gradesActions.setError(null));
    }, 3000);
};

export const setWarningAsync = (warning: string | Error): ThunkAction => async (dispatch) => {
    dispatch(gradesActions.setWarning(warning));
    setTimeout(() => {
        dispatch(gradesActions.setWarning(null));
    }, 3000);
};

export const updateTaskMeta = (
    task: any,
    data: Record<'certificateId' | 'orderId', number>,
): ThunkAction => async () => {
    const { certificateId, orderId } = data;
    const task$ = task;

    if (orderId) {
        task$.orderId = orderId;
    }

    if (certificateId) {
        task$.certificateId = certificateId;
    }

    await task.save();
};

export const loadingGradesAsync = (certificateId?: string | number): ThunkAction => async (dispatch) => {
    if (!certificateId) {
        dispatch(setErrorAsync(certificateNotFound('Cannot load human grades')));
        return;
    }

    try {
        dispatch(gradesActions.setLoading(true));

        const res = await apiCall(`/v2/robograding/scan-results/?certificate_ids=${certificateId}`);
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
        dispatch(setErrorAsync(error));
    }

    dispatch(gradesActions.setLoading(false));
};

export const submitAnnotationFrameToGradeAsync = (
    orientation?: 'front' | 'back' | string | null,
): ThunkAction => async (dispatch, getState) => {
    if (!orientation) {
        dispatch(setWarningAsync(orientationNotFound));
    }

    const state = getState() as CombinedState;
    const { states } = state.annotation.annotations;
    const { frame } = state.annotation.player;

    const res = await apiCall('/cvat-to-grade/', {
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
    if (orientation) {
        dispatch(
            gradesActions.assignGrades({
                [`${orientation}_centering_laser_grade`]: mapGradeValue(data?.center),
                [`${orientation}_corners_laser_grade`]: mapGradeValue(data?.corner),
                [`${orientation}_edges_laser_grade`]: mapGradeValue(data?.edge),
                [`${orientation}_surface_laser_grade`]: mapGradeValue(data?.surface),
            }),
        );
    }
};

export const submitHumanGradesAsync = (certificateId?: string | number | null): ThunkAction => async (
    dispatch,
    getState,
) => {
    if (!certificateId) {
        dispatch(setErrorAsync(certificateNotFound('Cannot submit human grades')));
        return;
    }

    const state = getState() as CombinedState;
    const { values } = state.grades;

    const overallCenteringGrade = calculateOverall(
        values.front_centering_human_grade,
        values.back_centering_human_grade,
    );
    const overallCornersGrade = calculateOverall(values.front_corners_human_grade, values.back_corners_human_grade);
    const overallEdgesGrade = calculateOverall(values.front_edges_human_grade, values.back_edges_human_grade);
    const overallSurfaceGrade = calculateOverall(values.front_surface_human_grade, values.back_surface_human_grade);

    const overallGrade = calculateAllOverall(
        overallCenteringGrade,
        overallCornersGrade,
        overallEdgesGrade,
        overallSurfaceGrade,
    );

    const overallGradeNickname = getGradeNickname(overallGrade);

    try {
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
                overall_centering_grade: overallCenteringGrade,
                overall_corners_grade: overallCornersGrade,
                overall_edges_grade: overallEdgesGrade,
                overall_surface_grade: overallSurfaceGrade,
                overall_grade: {
                    grade: overallGrade,
                    nickname: overallGradeNickname,
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
    } catch (e) {
        dispatch(setErrorAsync(e));
    }
};