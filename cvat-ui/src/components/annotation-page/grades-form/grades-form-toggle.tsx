// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
import React from 'react';
import { BarcodeOutlined } from '@ant-design/icons';
import Button from 'antd/lib/button';
import Tooltip from 'antd/lib/tooltip';

interface Props {
    open: boolean;
    onClick(): void;
}

export function GradesFormToggle({ open, onClick }: Props): JSX.Element {
    return (
        <Tooltip placement='bottom' title={open ? 'Close grades form' : 'Open grades form'}>
            <Button icon={<BarcodeOutlined />} className='cvat-top-bar-grades-button' onClick={onClick}>
                Grades
            </Button>
        </Tooltip>
    );
}

export default GradesFormToggle;
