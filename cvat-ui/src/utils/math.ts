// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

export function clamp(value: number, min: number, max: number): number {
    return Math.max(Math.min(value, max), min);
}

export function shift<T>(array: Array<T>, k: number): Array<T> {
    if (k % array.length !== 0) {
        return array.slice(k % array.length).concat(array.slice(0, k % array.length));
    }
    return array;
}

export interface Point {
    x: number;
    y: number;
}

export function numberArrayToPoints(coordinates: number[]): Point[] {
    return coordinates.reduce((acc: Point[], _: number, index: number): Point[] => {
        if (index % 2) {
            acc.push({
                x: coordinates[index - 1],
                y: coordinates[index],
            });
        }

        return acc;
    }, []);
}

export function pointsToNumberArray(points: Point[]): number[] {
    return points.reduce((acc: number[], point: Point): number[] => {
        acc.push(point.x, point.y);
        return acc;
    }, []);
}

export function nth(value: number): string {
    if (value > 3 && value < 21) return 'th';
    switch (value % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}
