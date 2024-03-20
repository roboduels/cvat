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
        front_overall_predicted_grade: 0,
        back_overall_predicted_grade: 0,
        front_raw_surface_minor_defect: [0, 0],
        front_raw_surface_major_defect: [0, 0],
        front_raw_edge_minor_defect: [0, 0],
        front_raw_edge_major_defect: [0, 0],
        front_raw_corner_minor_defect: [0, 0],
        front_raw_corner_major_defect: [0, 0],
        front_raw_angle_dif: [0, 0],
        front_raw_center_dif: [0, 0],
        front_raw_surface_grade: 0,
        front_raw_edge_grade: 0,
        front_raw_corner_grade: 0,
        front_raw_centering_grade: 0,
        back_raw_surface_minor_defect: [0, 0],
        back_raw_surface_major_defect: [0, 0],
        back_raw_edge_minor_defect: [0, 0],
        back_raw_edge_major_defect: [0, 0],
        back_raw_corner_minor_defect: [0, 0],
        back_raw_corner_major_defect: [0, 0],
        back_raw_angle_dif: [0, 0],
        back_raw_center_dif: [0, 0],
        back_raw_surface_grade: 0,
        back_raw_edge_grade: 0,
        back_raw_corner_grade: 0,
        back_raw_centering_grade: 0,
        front_opposite_angle: 0,
        front_inner_outer_angle: 0,
        front_distance: 0,
        front_top_bot_angle_diff: 0,
        front_left_right_angle_diff: 0,
        front_top_outer_top_inner_angle_diff: 0,
        front_bot_outer_bot_inner_angle_diff: 0,
        front_left_outer_left_inner_angle_diff: 0,
        front_right_outer_right_inner_angle_diff: 0,
        front_vertical_distance_diff: 0,
        front_horizontal_distance_diff: 0,
        back_opposite_angle: 0,
        back_inner_outer_angle: 0,
        back_distance: 0,
        back_top_bot_angle_diff: 0,
        back_left_right_angle_diff: 0,
        back_top_outer_top_inner_angle_diff: 0,
        back_bot_outer_bot_inner_angle_diff: 0,
        back_left_outer_left_inner_angle_diff: 0,
        back_right_outer_right_inner_angle_diff: 0,
        back_vertical_distance_diff: 0,
        back_horizontal_distance_diff: 0,
        front_boosted_centering_laser_grade: 0,
        front_boosted_corners_laser_grade: 0,
        front_boosted_edges_laser_grade: 0,
        front_boosted_surface_laser_grade: 0,
        back_boosted_centering_laser_grade: 0,
        back_boosted_corners_laser_grade: 0,
        back_boosted_edges_laser_grade: 0,
        back_boosted_surface_laser_grade: 0,
        front_boosted_overall_from_subgrades: 0,
        back_boosted_overall_from_subgrades: 0,
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
