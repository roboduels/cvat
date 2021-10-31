// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
import { CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import Button from 'antd/lib/button';
import Col from 'antd/lib/col';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import Row from 'antd/lib/row';
import Typography from 'antd/lib/typography';
import { sum } from 'lodash';
import React, {
    useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setGradesFormState } from '../../../actions/annotation-actions';
import {
    gradesActions,
    loadingGradesAsync,
    submitAnnotationFrameToGradeAsync,
    submitHumanGradesAsync,
    updateTaskMeta,
} from '../../../actions/grades-actions';
import { CombinedState } from '../../../reducers/interfaces';
import { parseFilename } from '../../../utils/grades';

interface Props {
    task: {
        orderId: string;
        certificateId: string;
    };
}

export function GradesForm({ task }: Props): JSX.Element | null {
    const formRef = useRef<FormInstance<CombinedState['grades']['values']>>(null);
    const [formTimestamp, setFormTimestamp] = useState(0);
    const [orderId, setOrderId] = useState(task?.orderId);
    const [certificateId, setCertificateId] = useState(task?.certificateId);
    const dispatch = useDispatch();
    const open = useSelector((state: CombinedState) => state.annotation.gradesFrom.open);
    const isLoading = useSelector((state: CombinedState) => state.grades.loading);
    const error = useSelector((state: CombinedState) => state.grades.error);
    const warning = useSelector((state: CombinedState) => state.grades.warning);
    const values = useSelector((state: CombinedState) => state.grades.values);
    const frameFilename = useSelector((state: CombinedState) => state.annotation.player.frame.filename);
    const frameOptions = useMemo(() => {
        const options = parseFilename(frameFilename);

        if (orderId) {
            options.orderId = orderId;
        }

        if (certificateId) {
            options.certificateId = certificateId;
        }

        return options;
    }, [frameFilename, task, orderId, certificateId]);

    const hasErrorOrWarning = !!(warning || error);

    const handleClose = useCallback(() => {
        dispatch(setGradesFormState(false));
    }, [dispatch]);

    const handleSubmit = useCallback(async () => {
        dispatch(submitAnnotationFrameToGradeAsync(frameOptions));
        formRef.current?.setFieldsValue({});
    }, [frameOptions]);

    const handleUpdate = useCallback(async () => {
        const formValues = await formRef.current?.validateFields();
        if (formValues) {
            dispatch(gradesActions.setGrades(formValues));
            dispatch(submitHumanGradesAsync(frameOptions.certificateId));
        }
    }, [frameOptions]);

    const handleFieldsChange = useCallback(async () => {
        setFormTimestamp(new Date().getTime());
    }, []);

    const handleOrderId = useCallback(async (value: string) => {
        setOrderId(value);
    }, []);

    const handleCertificateId = useCallback(async (value: string) => {
        setCertificateId(value);
    }, []);

    const handleCommitTask = useCallback(async () => {
        setOrderId((orderValue: string) => {
            setCertificateId((certificateValue: string) => {
                if (orderValue !== task.orderId || certificateValue !== task.certificateId) {
                    dispatch(updateTaskMeta(task, { orderId: orderValue, certificateId: certificateValue }));
                }
                return certificateValue;
            });
            return orderValue;
        });
    }, [task, setOrderId, setCertificateId]);

    const computeTotal = (list: string[]): number =>
        sum(list.map((value) => parseFloat(`${value || 0}`))) / list.length;

    const computedHumanFrontTotal = useMemo(
        (): number =>
            computeTotal([
                formRef.current?.getFieldValue('front_centering_human_grade'),
                formRef.current?.getFieldValue('front_edges_human_grade'),
                formRef.current?.getFieldValue('front_corners_human_grade'),
                formRef.current?.getFieldValue('front_surface_human_grade'),
            ]),
        [formTimestamp],
    );

    const computedHumanBackTotal = useMemo(
        (): number =>
            computeTotal([
                formRef.current?.getFieldValue('back_centering_human_grade'),
                formRef.current?.getFieldValue('back_edges_human_grade'),
                formRef.current?.getFieldValue('back_corners_human_grade'),
                formRef.current?.getFieldValue('back_surface_human_grade'),
            ]),
        [formTimestamp],
    );

    const computedTotal = useMemo(() => computedHumanBackTotal * 0.4 + computedHumanFrontTotal * 0.6, [
        computedHumanBackTotal,
        computedHumanFrontTotal,
    ]);

    useEffect(() => {
        if (open) {
            dispatch(loadingGradesAsync(frameOptions.certificateId));
        }
    }, [open, frameOptions.certificateId]);

    useEffect(() => {
        setOrderId((prev) => prev || task.orderId);
    }, [task?.orderId]);

    useEffect(() => {
        setCertificateId((prev) => prev || task.certificateId);
    }, [task?.certificateId]);

    useEffect(() => {
        formRef.current?.setFieldsValue(values);
    }, [values]);

    if (!open) {
        return null;
    }

    return (
        <div className='grades-form'>
            <Row>
                <Col span={8}>
                    <div className='grades-form-info'>
                        <div className='grades-form-info-typography'>
                            <Typography.Text strong>Certificate ID:&nbsp;</Typography.Text>
                            <Typography.Text
                                editable={{
                                    onChange: handleCertificateId,
                                    onEnd: handleCommitTask,
                                }}
                            >
                                {String(frameOptions.certificateId || '')}
                            </Typography.Text>
                            {frameOptions?.cardName ? (
                                <Typography.Text>
                                    #
                                    {frameOptions.cardName}
                                </Typography.Text>
                            ) : null}
                        </div>

                        <div className='grades-form-info-typography'>
                            <Typography.Text strong>Order ID:&nbsp;</Typography.Text>
                            <Typography.Text
                                editable={{
                                    onChange: handleOrderId,
                                    onEnd: handleCommitTask,
                                }}
                            >
                                {String(frameOptions.orderId || '')}
                            </Typography.Text>
                        </div>
                        {frameOptions.orientation ? (
                            <div className='grades-form-info-typography'>
                                <Typography.Text strong>Orientation:&nbsp;</Typography.Text>
                                <Typography.Text>{frameOptions.orientation}</Typography.Text>
                            </div>
                        ) : null}
                        {frameOptions.imageType ? (
                            <div className='grades-form-info-typography'>
                                <Typography.Text strong>Image Type:&nbsp;</Typography.Text>
                                <Typography.Text>{frameOptions.imageType}</Typography.Text>
                            </div>
                        ) : null}
                    </div>
                </Col>
                <Col span={8}>
                    <Row>
                        <Col span={8}>
                            <Typography.Text strong>Total Front:&nbsp;</Typography.Text>
                            <Typography.Text>{computedHumanFrontTotal.toFixed(2)}</Typography.Text>
                        </Col>
                        <Col span={8}>
                            <Typography.Text strong>Total Back:&nbsp;</Typography.Text>
                            <Typography.Text>{computedHumanBackTotal.toFixed(2)}</Typography.Text>
                        </Col>
                        <Col span={8}>
                            <Typography.Text strong>Total Overall:&nbsp;</Typography.Text>
                            <Typography.Text>{computedTotal.toFixed(2)}</Typography.Text>
                        </Col>
                    </Row>
                </Col>
                {hasErrorOrWarning ? (
                    <Col span={8}>
                        <div className='grades-form-error'>
                            {error ? (
                                <Typography.Text className='grades-form-error-typography'>
                                    {typeof error === 'string' ? error : error.message}
                                </Typography.Text>
                            ) : null}
                            {warning ? (
                                <Typography.Text className='grades-form-warning-typography'>
                                    {typeof warning === 'string' ? warning : warning.message}
                                </Typography.Text>
                            ) : null}
                        </div>
                    </Col>
                ) : null}
            </Row>

            <Row>
                <Col span={18}>
                    <Form
                        ref={formRef}
                        name='grades_form'
                        layout='vertical'
                        initialValues={values}
                        onFieldsChange={handleFieldsChange}
                    >
                        <section className='grades-form-section'>
                            <Typography.Text strong>Human Grades</Typography.Text>
                            <Row>
                                <Col span={10}>
                                    <Row gutter={[16, 16]}>
                                        <Col span={6}>
                                            <Form.Item label='Front centering' name='front_centering_human_grade'>
                                                <Input type='number' max={10} min={0} step={1} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Front edges' name='front_edges_human_grade'>
                                                <Input type='number' max={10} min={0} step={1} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Front corners' name='front_corners_human_grade'>
                                                <Input type='number' max={10} min={0} step={1} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Front surface' name='front_surface_human_grade'>
                                                <Input type='number' max={10} min={0} step={1} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={10} offset={1}>
                                    <Row gutter={[16, 16]}>
                                        <Col span={6}>
                                            <Form.Item label='Back centering' name='back_centering_human_grade'>
                                                <Input type='number' max={10} min={0} step={1} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Back edges' name='back_edges_human_grade'>
                                                <Input type='number' max={10} min={0} step={1} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Back corners' name='back_corners_human_grade'>
                                                <Input type='number' max={10} min={0} step={1} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Back surface' name='back_surface_human_grade'>
                                                <Input type='number' max={10} min={0} step={1} />
                                            </Form.Item>
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
                                            <Form.Item label='Front centering' name='front_centering_laser_grade'>
                                                <Input readOnly />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Front edges' name='front_edges_laser_grade'>
                                                <Input readOnly />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Front corners' name='front_corners_laser_grade'>
                                                <Input readOnly />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Front surface' name='front_surface_laser_grade'>
                                                <Input readOnly />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={10} offset={1}>
                                    <Row gutter={[16, 16]}>
                                        <Col span={6}>
                                            <Form.Item label='Back centering' name='back_centering_laser_grade'>
                                                <Input readOnly />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Back edges' name='back_edges_laser_grade'>
                                                <Input readOnly />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Back corners' name='back_corners_laser_grade'>
                                                <Input readOnly />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Back surface' name='back_surface_laser_grade'>
                                                <Input readOnly />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </section>
                    </Form>
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
                        {isLoading ? (
                            <div className='grades-form-loader'>
                                <LoadingOutlined />
                                <span className='loading-text'>Loading...</span>
                            </div>
                        ) : null}
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
