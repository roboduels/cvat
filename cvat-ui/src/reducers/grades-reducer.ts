// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { GradesState } from './interfaces';
import { GradesActionsTypes } from '../actions/grades-actions';
import { mapGradeValue } from '../utils/grades';

const defaultState: GradesState = {
    loading: false,
    error: null,
    warning: null,
    values: {
        front_centering_human_grade: 0,
        front_corners_human_grade: 0,
        front_edges_human_grade: 0,
        front_surface_human_grade: 0,
        back_centering_human_grade: 0,
        back_corners_human_grade: 0,
        back_edges_human_grade: 0,
        back_surface_human_grade: 0,
        front_centering_laser_grade: 0,
        front_corners_laser_grade: 0,
        front_edges_laser_grade: 0,
        front_surface_laser_grade: 0,
        back_centering_laser_grade: 0,
        back_corners_laser_grade: 0,
        back_edges_laser_grade: 0,
        back_surface_laser_grade: 0,
    },
};

export default function (state: GradesState = defaultState, action: any): GradesState {
    switch (action.type as GradesActionsTypes) {
        case GradesActionsTypes.SET_ERROR:
            return { ...state, error: action.payload.error };
        case GradesActionsTypes.SET_WARNING:
            return { ...state, warning: action.payload.warning };
        case GradesActionsTypes.SET_LOADING:
            return { ...state, loading: action.payload.loading };
        case GradesActionsTypes.LOAD_VALUES:
            return { ...state, values: action.payload.values };
        case GradesActionsTypes.ASSIGN_VALUES:
            return {
                ...state,
                values: {
                    ...state.values,
                    ...action.payload.values,
                },
            };
        case GradesActionsTypes.UPDATE_VALUE:
            return {
                ...state,
                values: {
                    ...state.values,
                    [action.payload.key]: mapGradeValue(action.payload.value),
                },
            };
        default:
            return state;
    }
}
