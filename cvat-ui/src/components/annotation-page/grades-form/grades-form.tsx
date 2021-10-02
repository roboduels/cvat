// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
import React, { useCallback } from 'react';
import Typography from 'antd/lib/typography';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import { CloseCircleOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { setGradesFormState } from '../../../actions/annotation-actions';

export function GradesForm(): JSX.Element | null {
    const dispatch = useDispatch();
    const open = useSelector((state) => state.annotation.gradesFrom.open);

    const handleClose = useCallback(() => {
        dispatch(setGradesFormState(false));
    }, [dispatch]);

    if (!open) {
        return null;
    }

    return (
        <div className='grades-form'>
            <div className='grades-form-info'>
                <Typography.Text className='grades-form-info-typography'>
                    <b>Certificate ID</b>
                    : #00000501 [Charizard Base Set (4/102)]
                </Typography.Text>
                <Typography.Text className='grades-form-info-typography'>
                    <b>Order ID</b>
                    : #RG00000012
                </Typography.Text>
            </div>

            <Row>
                <Col span={20}>
                    <section className='grades-form-section'>
                        <Typography.Text strong>Human Grades</Typography.Text>
                        <Row>
                            <Col span={10}>
                                <Row gutter={[16, 16]}>
                                    <Col span={6}>
                                        <Input placeholder='Front centering' />
                                    </Col>
                                    <Col span={6}>
                                        <Input placeholder='Front edges' />
                                    </Col>
                                    <Col span={6}>
                                        <Input placeholder='Front corners' />
                                    </Col>
                                    <Col span={6}>
                                        <Input placeholder='Front surface' />
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={10} offset={1}>
                                <Row gutter={[16, 16]}>
                                    <Col span={6}>
                                        <Input placeholder='Back centering' />
                                    </Col>
                                    <Col span={6}>
                                        <Input placeholder='Back edges' />
                                    </Col>
                                    <Col span={6}>
                                        <Input placeholder='Back corners' />
                                    </Col>
                                    <Col span={6}>
                                        <Input placeholder='Back surface' />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </section>

                    <section className='grades-form-section'>
                        <Typography.Text strong>Robo Grades</Typography.Text>
                        <Row>
                            <Col span={10}>
                                <Row gutter={[16, 16]}>
                                    <Col span={6}>
                                        <Input placeholder='Front centering' />
                                    </Col>
                                    <Col span={6}>
                                        <Input placeholder='Front edges' />
                                    </Col>
                                    <Col span={6}>
                                        <Input placeholder='Front corners' />
                                    </Col>
                                    <Col span={6}>
                                        <Input placeholder='Front surface' />
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={10} offset={1}>
                                <Row gutter={[16, 16]}>
                                    <Col span={6}>
                                        <Input placeholder='Back centering' />
                                    </Col>
                                    <Col span={6}>
                                        <Input placeholder='Back edges' />
                                    </Col>
                                    <Col span={6}>
                                        <Input placeholder='Back corners' />
                                    </Col>
                                    <Col span={6}>
                                        <Input placeholder='Back surface' />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </section>
                </Col>
                <Col span={4} style={{ display: 'flex' }}>
                    <Row align='bottom' justify='end' style={{ flex: '1 1 auto' }}>
                        <Button type='primary'>Generate Robo grades</Button>
                    </Row>
                </Col>
            </Row>

            <Button className='grades-form-close' shape='circle' icon={<CloseCircleOutlined />} onClick={handleClose} />
        </div>
    );
}

export default GradesForm;
