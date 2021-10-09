// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
export const mapGradeValue = (value?: number | string | null) => Number(`${value}`.replace(/,/g, '.').trim());
export const parseFilename = (filename: string) => {
    const matches = filename.match(/^((RG)?\d+)-\+(\d+)-\+(\d+)_(.*)[-_](front|back)[_-](laser|cam)\.(.*)$/i);

    if (!matches) {
        return {};
    }

    return {
        orderNumber: matches[1],
        certificateId: matches[3],
        cardName: matches[5],
        orientation: matches[6],
        imageType: matches[7],
        extension: matches[8],
    };
};
