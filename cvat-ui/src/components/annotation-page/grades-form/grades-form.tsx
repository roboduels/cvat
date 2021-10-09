// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
import React, {
    ChangeEvent, useCallback, useEffect, useMemo,
} from 'react';
import Typography from 'antd/lib/typography';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import { CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { setGradesFormState } from '../../../actions/annotation-actions';
import { CombinedState } from '../../../reducers/interfaces';
import {
    gradesActions,
    loadingGradesAsync,
    submitAnnotationFrameToGradeAsync,
    submitHumanGradesAsync,
} from '../../../actions/grades-actions';
import { parseFilename } from '../../../utils/grades';

export function GradesForm(): JSX.Element | null {
    const dispatch = useDispatch();
    const open = useSelector((state: CombinedState) => state.annotation.gradesFrom.open);
    const isLoading = useSelector((state: CombinedState) => state.grades.loading);
    const error = useSelector((state: CombinedState) => state.grades.error);
    const values = useSelector((state: CombinedState) => state.grades.values);
    const frameFilename = useSelector((state: CombinedState) => state.annotation.player.frame.filename);
    const frameOptions = useMemo(() => parseFilename(frameFilename), [frameFilename]);

    const handleClose = useCallback(() => {
        dispatch(setGradesFormState(false));
    }, [dispatch]);

    const handleSubmit = useCallback(async () => {
        dispatch(submitAnnotationFrameToGradeAsync(frameOptions.orientation!));
    }, []);
    const handleUpdate = useCallback(async () => {
        dispatch(submitHumanGradesAsync(frameOptions.certificateId!));
    }, []);

    const handleChangeGrade = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
        dispatch(gradesActions.updateValue(event.target.name, event.target.value));
    }, []);

    useEffect(() => {
        dispatch(loadingGradesAsync(frameOptions.certificateId!));
    }, []);

    if (!open) {
        return null;
    }

    if (isLoading) {
        return (
            <div className='grades-form loading'>
                <LoadingOutlined />
            </div>
        );
    }

    return (
        <div className='grades-form'>
            <Row>
                <Col span={error ? 12 : 24}>
                    <div className='grades-form-info'>
                        <Typography.Text className='grades-form-info-typography'>
                            <b>Certificate ID</b>
                            :
                            {' '}
                            <span>{frameOptions?.certificateId ? `#${frameOptions.certificateId}` : 'Unknown'}</span>
                            {' '}
                            <span>
                                [
                                {frameOptions?.cardName ? `#${frameOptions.cardName}` : 'N/A'}
                                ]
                            </span>
                        </Typography.Text>
                        <Typography.Text className='grades-form-info-typography'>
                            <b>Order ID</b>
                            :
                            {frameOptions?.orderNumber ? `#${frameOptions.orderNumber}` : 'N/A'}
                        </Typography.Text>
                    </div>
                </Col>
                {error ? (
                    <Col span={12}>
                        <div className='grades-form-error'>
                            <Typography.Text className='grades-form-error-typography'>
                                {typeof error === 'string' ? error : error.message}
                            </Typography.Text>
                        </div>
                    </Col>
                ) : null}
            </Row>

            <Row>
                <Col span={18}>
                    <section className='grades-form-section'>
                        <Typography.Text strong>Human Grades</Typography.Text>
                        <Row>
                            <Col span={10}>
                                <Row gutter={[16, 16]}>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Front centering'
                                            value={values.front_centering_human_grade}
                                            name='front_centering_human_grade'
                                            onChange={handleChangeGrade}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Front edges'
                                            value={values.front_edges_human_grade}
                                            name='front_edges_human_grade'
                                            onChange={handleChangeGrade}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Front corners'
                                            value={values.front_corners_human_grade}
                                            name='front_corners_human_grade'
                                            onChange={handleChangeGrade}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Front surface'
                                            value={values.front_surface_human_grade}
                                            name='front_surface_human_grade'
                                            onChange={handleChangeGrade}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={10} offset={1}>
                                <Row gutter={[16, 16]}>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Back centering'
                                            value={values.back_centering_human_grade}
                                            name='back_centering_human_grade'
                                            onChange={handleChangeGrade}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Back edges'
                                            value={values.back_edges_human_grade}
                                            name='back_edges_human_grade'
                                            onChange={handleChangeGrade}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Back corners'
                                            value={values.back_corners_human_grade}
                                            name='back_corners_human_grade'
                                            onChange={handleChangeGrade}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Back surface'
                                            value={values.back_surface_human_grade}
                                            name='back_surface_human_grade'
                                            onChange={handleChangeGrade}
                                        />
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
                                        <Input
                                            placeholder='Front centering'
                                            value={values.front_centering_laser_grade}
                                            name='front_centering_laser_grade'
                                            onChange={handleChangeGrade}
                                            readOnly
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Front edges'
                                            value={values.front_edges_laser_grade}
                                            name='front_edges_laser_grade'
                                            onChange={handleChangeGrade}
                                            readOnly
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Front corners'
                                            value={values.front_corners_laser_grade}
                                            name='front_corners_laser_grade'
                                            onChange={handleChangeGrade}
                                            readOnly
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Front surface'
                                            value={values.front_surface_laser_grade}
                                            name='front_surface_laser_grade'
                                            onChange={handleChangeGrade}
                                            readOnly
                                        />
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={10} offset={1}>
                                <Row gutter={[16, 16]}>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Back centering'
                                            value={values.back_centering_laser_grade}
                                            name='back_centering_laser_grade'
                                            onChange={handleChangeGrade}
                                            readOnly
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Back edges'
                                            value={values.back_edges_laser_grade}
                                            name='back_edges_laser_grade'
                                            onChange={handleChangeGrade}
                                            readOnly
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Back corners'
                                            value={values.back_corners_laser_grade}
                                            name='back_corners_laser_grade'
                                            onChange={handleChangeGrade}
                                            readOnly
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Input
                                            placeholder='Back surface'
                                            value={values.back_surface_laser_grade}
                                            name='back_surface_laser_grade'
                                            onChange={handleChangeGrade}
                                            readOnly
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </section>
                </Col>
                <Col span={6} style={{ display: 'flex' }}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: '1 1 auto',
                            alignItems: 'flex-end',
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Button type='primary' onClick={handleUpdate} style={{ marginBottom: 8, width: '100%' }}>
                            Update grades
                        </Button>
                        <Button type='primary' onClick={handleSubmit} style={{ width: '100%' }}>
                            Generate Robo grades
                        </Button>
                    </div>
                </Col>
            </Row>

            <Button className='grades-form-close' shape='circle' icon={<CloseCircleOutlined />} onClick={handleClose} />
        </div>
    );
}

export default GradesForm;
