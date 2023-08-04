// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
import React, { useCallback, useState } from 'react';
import './styles.scss';
import Button from 'antd/lib/button';
import Space from 'antd/lib/space';
import Switch from 'antd/lib/switch';
import Typography from 'antd/lib/typography';

interface Props {
    onGenerateRobogradesAndMasks(): void;
    onGenerateRawRobogrades(): void;
    enhancedRobogradesVisibility: boolean;
    robogradesVisibility: boolean;
    rawRobogradesVisibility: boolean;
    centeringAnglesVisibility: boolean;
    handleEnhancedRobogradesVisibility(): void;
    handleRobogradesVisibility(): void;
    handleRawRobogradesVisibility(): void;
    handleCenteringAnglesVisibility(): void;
}

function GradesFormAdvancedControls({
    onGenerateRobogradesAndMasks,
    onGenerateRawRobogrades,
    enhancedRobogradesVisibility,
    robogradesVisibility,
    rawRobogradesVisibility,
    centeringAnglesVisibility,
    handleEnhancedRobogradesVisibility,
    handleRobogradesVisibility,
    handleRawRobogradesVisibility,
    handleCenteringAnglesVisibility,
}: Props): JSX.Element {
    const [isExpanded, setIsExpanded] = useState(false);

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
                <Space direction='vertical' style={{ width: '100%' }}>
                    <Button block onClick={onGenerateRobogradesAndMasks}>
                        Generate Robogrades & Masks
                    </Button>
                    <Button block onClick={onGenerateRawRobogrades}>
                        Generate Raw Robogrades
                    </Button>
                    <div className='grades-form-info-typography'>
                        <Switch checked={enhancedRobogradesVisibility} onChange={handleEnhancedRobogradesVisibility} />
                        <Typography.Text>&nbsp;Enhanced Robogrades</Typography.Text>
                    </div>
                    <div className='grades-form-info-typography'>
                        <Switch checked={robogradesVisibility} onChange={handleRobogradesVisibility} />
                        <Typography.Text>&nbsp;Robogrades</Typography.Text>
                    </div>
                    <div className='grades-form-info-typography'>
                        <Switch checked={rawRobogradesVisibility} onChange={handleRawRobogradesVisibility} />
                        <Typography.Text>&nbsp;Raw Robogrades</Typography.Text>
                    </div>
                    <div className='grades-form-info-typography'>
                        <Switch checked={rawRobogradesVisibility} onChange={handleCenteringAnglesVisibility} />
                        <Typography.Text>&nbsp;Centering Angles</Typography.Text>
                    </div>
                </Space>
            )}
        </>
    );
}

export default GradesFormAdvancedControls;
