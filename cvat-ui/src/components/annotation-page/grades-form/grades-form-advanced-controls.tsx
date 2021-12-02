// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
import React, { useCallback } from 'react';
import './grades-form-advanced-controls.scss';
import Button from 'antd/lib/button';

interface Props {
    onRobogradesAndMasks(): void;
}

function GradesFormAdvancedControls({ onRobogradesAndMasks }: Props): JSX.Element {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const handleToggle = useCallback((): void => {
        setIsExpanded((prev) => !prev);
    }, []);

    return (
        <>
            <div className='grades-form-advanced-controls-toggle'>
                <Button type='link' block onClick={handleToggle}>
                    {isExpanded ? 'Hide Advanced' : 'Advanced'}
                </Button>
            </div>
            {isExpanded && (
                <Button block onClick={onRobogradesAndMasks}>
                    Generate Robogrades & Masks
                </Button>
            )}
        </>
    );
}

export default GradesFormAdvancedControls;
