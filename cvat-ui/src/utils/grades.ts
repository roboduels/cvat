// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
interface ParsedFilename {
    orderId: string;
    certificateId: string;
    cardName: string;
    orientation: 'front' | 'back';
    imageType: 'laser' | 'cam';
    extension: string;
}

const NicknameDefinitions: [number, string][] = [
    [10, 'GEM-MT'],
    [9.5, 'MINT+'],
    [9.0, 'MINT'],
    [8.5, 'NM-MT+'],
    [8.0, 'NM-MT'],
    [7.5, 'NM+'],
    [7.0, 'NM'],
    [6.5, 'EX-MT+'],
    [6.0, 'EX-MT'],
    [5.5, 'EX+'],
    [5.0, 'EX'],
    [4.5, 'VG-EX+'],
    [4.0, 'VG-EX'],
    [3.5, 'VG+'],
    [3.0, 'VG'],
    [2.5, 'GOOD+'],
    [2.0, 'GOOD'],
    [1.5, 'FR'],
    [1.0, 'PR'],
];

function roundOverallGrade(value: number): number {
    const roundedValue = parseInt(`${value}`, 10);
    let rest = value - roundedValue;

    switch (true) {
        case rest > 0.2501 && rest <= 0.7501:
            rest = 0.5;
            break;
        case rest > 0.75:
            rest = 1;
            break;
        default:
            rest = 0;
    }

    return roundedValue + rest;
}

export const mapGradeValue = (value?: number | string | null): number => {
    if (typeof value === 'number') {
        return value;
    }

    return Number(`${value}`.replace(/,/g, '.').trim()) || 0;
};

export const parseFilename = (filename: string): ParsedFilename => {
    const segments = filename.split('-+');
    const orderId = segments[0] || '';
    const certificateId = segments[1] || '';
    const imageFilename = segments[2] || '';
    const matches = imageFilename.match(/^((.*)[_-])?(front|back)[_-](laser|cam)\.(.*)$/i) || [];
    const cardName = (matches[1] || '').replace(certificateId, '').replace(/^[_-]/, '').replace(/[_-]$/, '');
    const orientation = matches[3] as any;
    const imageType = matches[4] as any;
    const extension = matches[5];

    return {
        orderId,
        certificateId,
        cardName,
        orientation,
        imageType,
        extension,
    };
};

export function calculateOverall(front: number | string, back: number | string): number {
    const value = 0.6 * mapGradeValue(front) + 0.4 * mapGradeValue(back);

    return Math.round(value * 10) / 10;
}

export function calculateAllOverall(...values: (number | string)[]): number {
    const sum = values.reduce((accum: number, value) => accum + mapGradeValue(value), 0);
    return roundOverallGrade(sum / values.length);
}

export function getGradeNickname(value: number | string): string {
    const value$ = mapGradeValue(value);
    let valueNickname = 'N/A';

    for (const definition of NicknameDefinitions) {
        const [min, nickname] = definition;
        if (value$ >= min) {
            valueNickname = nickname;
            break;
        }
    }

    return valueNickname;
}
