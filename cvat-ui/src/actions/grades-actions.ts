// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import notification from 'antd/lib/notification';
import { ActionUnion, createAction, ThunkAction } from '../utils/redux';
import { CombinedState, GradesState } from '../reducers/interfaces';
import { calculateAllOverall, calculateOverall, getGradeNickname, mapGradeValue } from '../utils/grades';

const certificateNotFound = (message: string): Error => new Error(`${message}, certificate number not found!`);
const orientationNotFound = new Error('Cannot reload RoboGrades, orientation not found!');

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

function apiCall(endpoint: string, opts: AxiosRequestConfig = {}): Promise<AxiosResponse> {
    const url = process.env.AGS_API_URL;
    const token = process.env.AGS_API_TOKEN;
    return Axios.request({
        ...opts,
        baseURL: url,
        url: endpoint,
        headers: {
            ...(opts.headers || {}),
            Authorization: `Bearer ${token}`,
        },
    });
}

async function sendGrades(action: string, values: any): Promise<void> {
    try {
        await Axios.post('/api/v1/cvat-grades', { action, values });
    } catch (e) {
        console.error('error sending grades', e);
    }
}

export const setErrorAsync =
    (error: string | Error): ThunkAction =>
    async (dispatch) => {
        const axiosErr = error as AxiosError;
        if (axiosErr?.isAxiosError) {
            const { data } = axiosErr.response || {};
            dispatch(gradesActions.setError(data.detail));
        } else {
            dispatch(gradesActions.setError(error));
        }
        setTimeout(() => {
            dispatch(gradesActions.setError(null));
        }, 3000);
    };

export const setWarningAsync =
    (warning: string | Error): ThunkAction =>
    async (dispatch) => {
        dispatch(gradesActions.setWarning(warning));
        setTimeout(() => {
            dispatch(gradesActions.setWarning(null));
        }, 3000);
    };

export const updateTaskMeta =
    (task: any, data: Record<'certificateId' | 'orderId', string>): ThunkAction =>
    async () => {
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

export const loadingGradesAsync =
    (certificateId?: string | number): ThunkAction =>
    async (dispatch) => {
        if (!certificateId) {
            dispatch(setErrorAsync(certificateNotFound('Cannot load human grades')));
            return;
        }

        try {
            dispatch(gradesActions.setLoading(true));

            const { data } = await apiCall(`/v2/robograding/scan-results/?certificate_ids=${certificateId}`);
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
                    back_centering_laser_grade: mapGradeValue(
                        result?.laser_back_scan?.centering_result?.results?.grade,
                    ),
                    back_corners_laser_grade: mapGradeValue(result?.laser_back_scan?.corners_result?.results?.grade),
                    back_edges_laser_grade: mapGradeValue(result?.laser_back_scan?.edges_result?.results?.grade),
                    back_surface_laser_grade: mapGradeValue(result?.laser_back_scan?.surface_result?.results?.grade),
                    front_centering_laser_grade: mapGradeValue(
                        result?.laser_front_scan?.centering_result?.results?.grade,
                    ),
                    front_corners_laser_grade: mapGradeValue(result?.laser_front_scan?.corners_result?.results?.grade),
                    front_edges_laser_grade: mapGradeValue(result?.laser_front_scan?.edges_result?.results?.grade),
                    front_surface_laser_grade: mapGradeValue(result?.laser_front_scan?.surface_result?.results?.grade),
                    front_overall_predicted_grade: mapGradeValue(result?.laser_front_scan?.overall_predicted_grade),
                    back_overall_predicted_grade: mapGradeValue(result?.laser_back_scan?.overall_predicted_grade),
                    front_raw_surface_minor_defect: result?.front_raw_grades?.surface_minor_defect,
                    front_raw_surface_major_defect: result?.front_raw_grades?.surface_major_defect,
                    front_raw_edge_minor_defect: result?.front_raw_grades?.edge_minor_defect,
                    front_raw_edge_major_defect: result?.front_raw_grades?.edge_major_defect,
                    front_raw_corner_minor_defect: result?.front_raw_grades?.corner_minor_defect,
                    front_raw_corner_major_defect: result?.front_raw_grades?.corner_major_defect,
                    front_raw_angle_dif: result?.front_raw_grades?.angle_dif,
                    front_raw_center_dif: result?.front_raw_grades?.center_dif,
                    front_raw_surface_grade: mapGradeValue(result?.front_raw_grades?.surface_grade),
                    front_raw_edge_grade: mapGradeValue(result?.front_raw_grades?.edge_grade),
                    front_raw_corner_grade: mapGradeValue(result?.front_raw_grades?.corner_grade),
                    front_raw_centering_grade: mapGradeValue(result?.front_raw_grades?.centering_grade),
                    back_raw_surface_minor_defect: result?.back_raw_grades?.surface_minor_defect,
                    back_raw_surface_major_defect: result?.back_raw_grades?.surface_major_defect,
                    back_raw_edge_minor_defect: result?.back_raw_grades?.edge_minor_defect,
                    back_raw_edge_major_defect: result?.back_raw_grades?.edge_major_defect,
                    back_raw_corner_minor_defect: result?.back_raw_grades?.corner_minor_defect,
                    back_raw_corner_major_defect: result?.back_raw_grades?.corner_major_defect,
                    back_raw_angle_dif: result?.back_raw_grades?.angle_dif,
                    back_raw_center_dif: result?.back_raw_grades?.center_dif,
                    back_raw_surface_grade: mapGradeValue(result?.back_raw_grades?.surface_grade),
                    back_raw_edge_grade: mapGradeValue(result?.back_raw_grades?.edge_grade),
                    back_raw_corner_grade: mapGradeValue(result?.back_raw_grades?.corner_grade),
                    back_raw_centering_grade: mapGradeValue(result?.back_raw_grades?.centering_grade),
                    front_opposite_angle: mapGradeValue(result?.laser_front_scan?.angles?.opposite_angle),
                    front_inner_outer_angle: mapGradeValue(result?.laser_front_scan?.angles?.inner_outer_angle),
                    front_distance: mapGradeValue(result?.laser_front_scan?.angles?.distance),
                    front_top_bot_angle_diff: mapGradeValue(result?.laser_front_scan?.angles?.top_bot_angle_diff),
                    front_left_right_angle_diff: mapGradeValue(result?.laser_front_scan?.angles?.left_right_angle_diff),
                    front_top_outer_top_inner_angle_diff: mapGradeValue(result?.laser_front_scan?.angles?.top_outer_top_inner_angle_diff),
                    front_bot_outer_bot_inner_angle_diff: mapGradeValue(result?.laser_front_scan?.angles?.bot_outer_bot_inner_angle_diff),
                    front_left_outer_left_inner_angle_diff: mapGradeValue(result?.laser_front_scan?.angles?.left_outer_left_inner_angle_diff),
                    front_right_outer_right_inner_angle_diff: mapGradeValue(result?.laser_front_scan?.angles?.right_outer_right_inner_angle_diff),
                    front_vertical_distance_diff: mapGradeValue(result?.laser_front_scan?.angles?.vertical_distance_diff),
                    front_horizontal_distance_diff: mapGradeValue(result?.laser_front_scan?.angles?.horizontal_distance_diff),
                    back_opposite_angle: mapGradeValue(result?.laser_back_scan?.angles?.opposite_angle),
                    back_inner_outer_angle: mapGradeValue(result?.laser_back_scan?.angles?.inner_outer_angle),
                    back_distance: mapGradeValue(result?.laser_back_scan?.angles?.distance),
                    back_top_bot_angle_diff: mapGradeValue(result?.laser_back_scan?.angles?.top_bot_angle_diff),
                    back_left_right_angle_diff: mapGradeValue(result?.laser_back_scan?.angles?.left_right_angle_diff),
                    back_top_outer_top_inner_angle_diff: mapGradeValue(result?.laser_back_scan?.angles?.top_outer_top_inner_angle_diff),
                    back_bot_outer_bot_inner_angle_diff: mapGradeValue(result?.laser_back_scan?.angles?.bot_outer_bot_inner_angle_diff),
                    back_left_outer_left_inner_angle_diff: mapGradeValue(result?.laser_back_scan?.angles?.left_outer_left_inner_angle_diff),
                    back_right_outer_right_inner_angle_diff: mapGradeValue(result?.laser_back_scan?.angles?.right_outer_right_inner_angle_diff),
                    back_vertical_distance_diff: mapGradeValue(result?.laser_back_scan?.angles?.vertical_distance_diff),
                    back_horizontal_distance_diff: mapGradeValue(result?.laser_back_scan?.angles?.horizontal_distance_diff),
                }),
            );
        } catch (error) {
            if (error.isAxiosError) {
                const { data } = error.response;
                dispatch(setErrorAsync(data.detail));
            } else {
                dispatch(setErrorAsync(error));
            }
        }

        dispatch(gradesActions.setLoading(false));
    };

interface SubmitAnnotationFrameInput {
    image?: File | Blob;
    orientation?: 'front' | 'back' | string | null;
    imageType?: 'laser' | 'cam' | string | null;
    certificateId?: string | null;
}

export const submitAnnotationFrameToGradeAsync =
    (
        input: SubmitAnnotationFrameInput & {
            withMasks?: boolean;
            noNotifications?: boolean;
            frame?: any;
            annotation?: any;
            job?: any;
            resolve?: () => void;
            reject?: (e: any) => void;
        },
    ): ThunkAction =>
    async (dispatch, getState) => {
        if (!input.orientation) {
            dispatch(setWarningAsync(orientationNotFound));
        }

        const { resolve, reject } = input;
        const state = getState() as CombinedState;
        const states: any[] = input.annotation || state.annotation?.annotations?.states || [];
        const { frame: annotationFrame } = state.annotation.player;
        const formData = new FormData();

        const theFrame = input.frame || annotationFrame;
        const frameName = theFrame.filename;

        const job = input.job || state.annotation.job.instance;
        const image = await job.frames.frameData((theFrame || annotationFrame).number);
        formData.append('image', image, frameName);

        if (!input.withMasks) {
            formData.append('without_mask', !input.withMasks);
        }

        formData.append(
            'payload',
            JSON.stringify({
                filename: frameName,
                objects: states.map((item) => ({
                    points: item.points,
                    label: item.label.name,
                    shape: item.shapeType,
                })),
                image: {
                    width: theFrame.width ?? theFrame.data.width,
                    height: theFrame.height ?? theFrame.data.height,
                },
            }),
        );

        if (input.orientation) {
            formData.append('orientation', input.orientation);
        }
        if (input.imageType) {
            formData.append('image_type', input.imageType);
        }
        if (input.certificateId) {
            formData.append('certificate_id', input.certificateId);
        }

        try {
            dispatch(gradesActions.setLoading(true));
            if (!input.noNotifications) {
                notification.info({
                    message: 'Updating RoboGrades...',
                });
            }
            const { data } = await apiCall('/cvat-to-grade/', {
                method: 'POST',
                data: formData,
            });

            if (input.orientation) {
                dispatch(
                    gradesActions.assignGrades({
                        [`${input.orientation}_centering_laser_grade`]: mapGradeValue(data?.center),
                        [`${input.orientation}_corners_laser_grade`]: mapGradeValue(data?.corner),
                        [`${input.orientation}_edges_laser_grade`]: mapGradeValue(data?.edge),
                        [`${input.orientation}_surface_laser_grade`]: mapGradeValue(data?.surface),
                        [`${input.orientation}_overall_predicted_grade`]: mapGradeValue(data?.overall),
                        [`${input.orientation}_opposite_angle`]: mapGradeValue(data?.angles?.opposite_angle),
                        [`${input.orientation}_inner_outer_angle`]: mapGradeValue(data?.angles?.inner_outer_angle),
                        [`${input.orientation}_distance`]: mapGradeValue(data?.angles?.distance),
                        [`${input.orientation}_top_bot_angle_diff`]: mapGradeValue(data?.angles?.top_bot_angle_diff),
                        [`${input.orientation}_left_right_angle_diff`]: mapGradeValue(data?.angles?.left_right_angle_diff),
                        [`${input.orientation}_top_outer_top_inner_angle_diff`]: mapGradeValue(data?.angles?.top_outer_top_inner_angle_diff),
                        [`${input.orientation}_bot_outer_bot_inner_angle_diff`]: mapGradeValue(data?.angles?.bot_outer_bot_inner_angle_diff),
                        [`${input.orientation}_left_outer_left_inner_angle_diff`]: mapGradeValue(data?.angles?.left_outer_left_inner_angle_diff),
                        [`${input.orientation}_right_outer_right_inner_angle_diff`]: mapGradeValue(data?.angles?.right_outer_right_inner_angle_diff),
                        [`${input.orientation}_vertical_distance_diff`]: mapGradeValue(data?.angles?.vertical_distance_diff),
                        [`${input.orientation}_horizontal_distance_diff`]: mapGradeValue(data?.angles?.horizontal_distance_diff),
                    }),
                );
            }

            if (!input.noNotifications) {
                notification.success({
                    message: 'RoboGrades has been updated successfully.',
                });
            }
            if (resolve) {
                resolve();
            }
        } catch (e) {
            if (!input.noNotifications) {
                notification.error({
                    message: "RoboGrades couldn't be updated.",
                });
            }
            dispatch(setErrorAsync(e));
            if (reject) {
                reject(e);
            }
        }
        dispatch(gradesActions.setLoading(false));
    };

export const submitAnnotationFrameToRawGradeAsync =
    (
        input: SubmitAnnotationFrameInput & {
            noNotifications?: boolean;
            frame?: any;
            annotation?: any;
            job?: any;
            resolve?: () => void;
            reject?: (e: any) => void;
        },
    ): ThunkAction =>
    async (dispatch, getState) => {
        if (!input.orientation) {
            dispatch(setWarningAsync(orientationNotFound));
        }

        const { resolve, reject } = input;
        const state = getState() as CombinedState;
        const states: any[] = input.annotation || state.annotation?.annotations?.states || [];
        const { frame: annotationFrame } = state.annotation.player;
        const formData = new FormData();

        const theFrame = input.frame || annotationFrame;
        const frameName = theFrame.filename;

        const job = input.job || state.annotation.job.instance;
        const image = await job.frames.frameData((theFrame || annotationFrame).number);
        formData.append('image', image, frameName);

        formData.append(
            'payload',
            JSON.stringify({
                filename: frameName,
                objects: states.map((item) => ({
                    points: item.points,
                    label: item.label.name,
                    shape: item.shapeType,
                })),
                image: {
                    width: theFrame.width ?? theFrame.data.width,
                    height: theFrame.height ?? theFrame.data.height,
                },
            }),
        );

        if (input.orientation) {
            formData.append('orientation', input.orientation);
        }
        if (input.imageType) {
            formData.append('image_type', input.imageType);
        }
        if (input.certificateId) {
            formData.append('certificate_id', input.certificateId);
        }

        try {
            dispatch(gradesActions.setLoading(true));
            if (!input.noNotifications) {
                notification.info({
                    message: 'Updating Raw RoboGrades...',
                });
            }
            const { data } = await apiCall('/generate-raw-grades/', {
                method: 'POST',
                data: formData,
            });

            if (input.orientation) {
                dispatch(
                    gradesActions.assignGrades({
                        [`${input.orientation}_raw_surface_minor_defect`]: data?.surface_minor_defect,
                        [`${input.orientation}_raw_surface_major_defect`]: data?.surface_major_defect,
                        [`${input.orientation}_raw_edge_minor_defect`]: data?.edge_minor_defect,
                        [`${input.orientation}_raw_edge_major_defect`]: data?.edge_major_defect,
                        [`${input.orientation}_raw_corner_minor_defect`]: data?.corner_minor_defect,
                        [`${input.orientation}_raw_corner_major_defect`]: data?.corner_major_defect,
                        [`${input.orientation}_raw_angle_dif`]: data?.angle_dif,
                        [`${input.orientation}_raw_center_dif`]: data?.center_dif,
                        [`${input.orientation}_raw_surface_grade`]: mapGradeValue(data?.surface_grade),
                        [`${input.orientation}_raw_edge_grade`]: mapGradeValue(data?.edge_grade),
                        [`${input.orientation}_raw_corner_grade`]: mapGradeValue(data?.corner_grade),
                        [`${input.orientation}_raw_centering_grade`]: mapGradeValue(data?.centering_grade),
                    }),
                );
            }

            if (!input.noNotifications) {
                notification.success({
                    message: 'Raw RoboGrades has been updated successfully.',
                });
            }
            if (resolve) {
                resolve();
            }
        } catch (e) {
            if (!input.noNotifications) {
                notification.error({
                    message: "Raw RoboGrades couldn't be updated.",
                });
            }
            dispatch(setErrorAsync(e));
            if (reject) {
                reject(e);
            }
        }
        dispatch(gradesActions.setLoading(false));
    };

export const submitHumanGradesAsync =
    (certificateId?: string | number | null): ThunkAction =>
    async (dispatch, getState) => {
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
            dispatch(gradesActions.setLoading(true));
            notification.info({
                message: 'Updating human grades...',
            });

            const data = {
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
            };

            const [{ data: res }] = await Promise.all([
                apiCall(`/v2/robograding/certificates/?certificate_id=${certificateId}`, {
                    method: 'PATCH',
                    data,
                }),
                sendGrades('human_grades', {
                    certificateId,
                    grades: data,
                }),
            ]);

            dispatch(
                gradesActions.assignGrades({
                    back_centering_human_grade: mapGradeValue(res.back_centering_human_grade),
                    back_corners_human_grade: mapGradeValue(res.back_corners_human_grade),
                    back_edges_human_grade: mapGradeValue(res.back_edges_human_grade),
                    back_surface_human_grade: mapGradeValue(res.back_surface_human_grade),
                    front_centering_human_grade: mapGradeValue(res.front_centering_human_grade),
                    front_corners_human_grade: mapGradeValue(res.front_corners_human_grade),
                    front_edges_human_grade: mapGradeValue(res.front_edges_human_grade),
                    front_surface_human_grade: mapGradeValue(res.front_surface_human_grade),
                }),
            );

            notification.success({
                message: 'Human grades has been updated successfully.',
            });
        } catch (e) {
            notification.error({
                message: "Human grades couldn't be updated.",
            });
            dispatch(setErrorAsync(e));
        }

        dispatch(gradesActions.setLoading(false));
    };
