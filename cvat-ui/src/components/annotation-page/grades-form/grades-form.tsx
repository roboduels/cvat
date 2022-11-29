// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
import { CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import Button from 'antd/lib/button';
import Collapse from 'antd/lib/collapse';
import Col from 'antd/lib/col';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import Row from 'antd/lib/row';
import Typography from 'antd/lib/typography';
import Divider from 'antd/lib/divider';
import Card from 'antd/lib/card';
import Table from 'antd/lib/table';
import { sum, min } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Space from 'antd/lib/space';
import { setGradesFormState } from '../../../actions/annotation-actions';
import {
    gradesActions,
    loadingGradesAsync,
    submitAnnotationFrameToGradeAsync,
    submitAnnotationFrameToRawGradeAsync,
    submitHumanGradesAsync,
    updateTaskMeta,
} from '../../../actions/grades-actions';
import { CombinedState } from '../../../reducers/interfaces';
import { parseFilename } from '../../../utils/grades';
import { nth } from '../../../utils/math';
import GradesFormAdvancedControls from './grades-form-advanced-controls';
import './styles.scss';

const { Panel } = Collapse;

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
    const [computedHumanFrontTotal, setComputedHumanFrontTotal] = useState(0);
    const [computedHumanBackTotal, setComputedHumanBackTotal] = useState(0);
    const [computedRobogradesFrontTotal, setComputedRobogradesFrontTotal] = useState(0);
    const [computedRobogradesBackTotal, setComputedRobogradesBackTotal] = useState(0);
    const [computedRawRobogradesFrontTotal, setComputedRawRobogradesFrontTotal] = useState(0);
    const [computedRawRobogradesBackTotal, setComputedRawRobogradesBackTotal] = useState(0);
    const [computedLowestTotal, setComputedLowestTotal] = useState(0);
    const [enhancedRobogradesVisibility, setEnhancedRobogradesVisibility] = useState(true);
    const [robogradesVisibility, setRobogradesVisibility] = useState(true);
    const [rawRobogradesVisibility, setRawRobogradesVisibility] = useState(true);
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

    const handleRobogrades = useCallback(async () => {
        dispatch(submitAnnotationFrameToGradeAsync(frameOptions));
        formRef.current?.setFieldsValue({});
    }, [frameOptions]);

    const handleRobogradesAndMasks = useCallback(async () => {
        dispatch(submitAnnotationFrameToGradeAsync({ ...frameOptions, withMasks: true }));
        formRef.current?.setFieldsValue({});
    }, [frameOptions]);

    const handleRawRobogrades = useCallback(async () => {
        dispatch(submitAnnotationFrameToRawGradeAsync(frameOptions));
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

    const computeRawGradePercentile = (grade: string | number | undefined): string => {
        if (grade === undefined) {
            return '-';
        }
        const percentage = 100 - grade;
        return `${percentage}${nth(percentage)}%`;
    };

    const computeTotal = (list: string[] | number[]): number =>
        (sum(list.map((value) => parseFloat(`${value || 0}`))) / list.length).toFixed(2);

    const computeTotalOverall = (front: number | string, back: number | string): number =>
        (0.6 * front + 0.4 * back).toFixed(2);

    const roundBy25 = (num: string | number) => (Math.round(num * 4) / 4).toFixed(2);

    useEffect(() => {
        setComputedHumanFrontTotal(
            computeTotal([
                formRef.current?.getFieldValue('front_centering_human_grade'),
                formRef.current?.getFieldValue('front_edges_human_grade'),
                formRef.current?.getFieldValue('front_corners_human_grade'),
                formRef.current?.getFieldValue('front_surface_human_grade'),
            ]),
        );
        setComputedHumanBackTotal(
            computeTotal([
                formRef.current?.getFieldValue('back_centering_human_grade'),
                formRef.current?.getFieldValue('back_edges_human_grade'),
                formRef.current?.getFieldValue('back_corners_human_grade'),
                formRef.current?.getFieldValue('back_surface_human_grade'),
            ]),
        );
        setComputedRobogradesFrontTotal(
            computeTotal([
                formRef.current?.getFieldValue('front_centering_laser_grade'),
                formRef.current?.getFieldValue('front_edges_laser_grade'),
                formRef.current?.getFieldValue('front_corners_laser_grade'),
                formRef.current?.getFieldValue('front_surface_laser_grade'),
            ]),
        );
        setComputedRobogradesBackTotal(
            computeTotal([
                formRef.current?.getFieldValue('back_centering_laser_grade'),
                formRef.current?.getFieldValue('back_edges_laser_grade'),
                formRef.current?.getFieldValue('back_corners_laser_grade'),
                formRef.current?.getFieldValue('back_surface_laser_grade'),
            ]),
        );
        setComputedRawRobogradesFrontTotal(
            computeTotal([
                formRef.current?.getFieldValue('front_raw_centering_grade'),
                formRef.current?.getFieldValue('front_raw_edge_grade'),
                formRef.current?.getFieldValue('front_raw_corner_grade'),
                formRef.current?.getFieldValue('front_raw_surface_grade'),
            ]),
        );
        setComputedRawRobogradesBackTotal(
            computeTotal([
                formRef.current?.getFieldValue('back_raw_centering_grade'),
                formRef.current?.getFieldValue('back_raw_edge_grade'),
                formRef.current?.getFieldValue('back_raw_corner_grade'),
                formRef.current?.getFieldValue('back_raw_surface_grade'),
            ]),
        );
        setComputedLowestTotal(
            min([
                parseFloat(
                    computeTotalOverall(
                        formRef.current?.getFieldValue('front_centering_laser_grade'),
                        formRef.current?.getFieldValue('back_centering_laser_grade'),
                    ),
                ),
                parseFloat(
                    computeTotalOverall(
                        formRef.current?.getFieldValue('front_edges_laser_grade'),
                        formRef.current?.getFieldValue('back_edges_laser_grade'),
                    ),
                ),
                parseFloat(
                    computeTotalOverall(
                        formRef.current?.getFieldValue('front_corners_laser_grade'),
                        formRef.current?.getFieldValue('back_corners_laser_grade'),
                    ),
                ),
                parseFloat(
                    computeTotalOverall(
                        formRef.current?.getFieldValue('front_surface_laser_grade'),
                        formRef.current?.getFieldValue('back_surface_laser_grade'),
                    ),
                ),
            ]),
        );
    }, [formTimestamp]);

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
        setComputedHumanFrontTotal(
            computeTotal([
                values?.front_centering_human_grade,
                values?.front_edges_human_grade,
                values?.front_corners_human_grade,
                values?.front_surface_human_grade,
            ]),
        );
        setComputedHumanBackTotal(
            computeTotal([
                values?.back_centering_human_grade,
                values?.back_edges_human_grade,
                values?.back_corners_human_grade,
                values?.back_surface_human_grade,
            ]),
        );
        setComputedRobogradesFrontTotal(
            computeTotal([
                values?.front_centering_laser_grade,
                values?.front_edges_laser_grade,
                values?.front_corners_laser_grade,
                values?.front_surface_laser_grade,
            ]),
        );
        setComputedRobogradesBackTotal(
            computeTotal([
                values?.back_centering_laser_grade,
                values?.back_edges_laser_grade,
                values?.back_corners_laser_grade,
                values?.back_surface_laser_grade,
            ]),
        );
        setComputedRawRobogradesFrontTotal(
            computeTotal([
                values?.front_raw_centering_grade,
                values?.front_raw_edge_grade,
                values?.front_raw_corner_grade,
                values?.front_raw_surface_grade,
            ]),
        );
        setComputedRawRobogradesBackTotal(
            computeTotal([
                values?.back_raw_centering_grade,
                values?.back_raw_edge_grade,
                values?.back_raw_corner_grade,
                values?.back_raw_surface_grade,
            ]),
        );
        setComputedLowestTotal(
            min([
                parseFloat(
                    computeTotalOverall(values?.front_centering_laser_grade, values?.back_centering_laser_grade),
                ),
                parseFloat(computeTotalOverall(values?.front_edges_laser_grade, values?.back_edges_laser_grade)),
                parseFloat(computeTotalOverall(values?.front_corners_laser_grade, values?.back_corners_laser_grade)),
                parseFloat(computeTotalOverall(values?.front_surface_laser_grade, values?.back_surface_laser_grade)),
            ]),
        );
    }, [values]);

    if (!open) {
        return null;
    }

    const totalGradesColumns = [
        {
            title: '',
            dataIndex: 'gradeType',
            key: 'gradeType',
            render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
        },
        {
            title: <Typography.Text strong>Total Front</Typography.Text>,
            dataIndex: 'totalFront',
            key: 'totalFront',
        },
        {
            title: <Typography.Text strong>Total Back</Typography.Text>,
            dataIndex: 'totalBack',
            key: 'totalBack',
        },
        {
            title: <Typography.Text strong>Total Overall</Typography.Text>,
            dataIndex: 'totalOverall',
            key: 'totalOverall',
            render: (text: string | number, record: any) =>
                record.gradeType === 'Robogrades' && parseFloat(computedLowestTotal) + 1.0 < parseFloat(text) ? (
                    <>
                        <Typography.Text delete>{text}</Typography.Text>
                        {` ${
                            parseFloat(computedLowestTotal) + 1.0 > 10.0
                                ? (10).toFixed(2)
                                : (parseFloat(computedLowestTotal) + 1.0).toFixed(2)
                        }`}
                    </>
                ) : (
                    text
                ),
        },
    ];

    const totalGradesRows = [
        {
            gradeType: 'Enhanced Robogrades',
            totalFront: computedHumanFrontTotal,
            totalBack: computedHumanBackTotal,
            totalOverall: computeTotalOverall(computedHumanFrontTotal, computedHumanBackTotal),
        },
        {
            gradeType: 'Robogrades',
            totalFront: computedRobogradesFrontTotal,
            totalBack: computedRobogradesBackTotal,
            totalOverall: computeTotalOverall(computedRobogradesFrontTotal, computedRobogradesBackTotal),
        },
        {
            gradeType: 'Raw Robogrades',
            totalFront: computedRawRobogradesFrontTotal,
            totalBack: computedRawRobogradesBackTotal,
            totalOverall: computeTotalOverall(computedRawRobogradesFrontTotal, computedRawRobogradesBackTotal),
        },
        {
            gradeType: 'Predicted Overall RoboGrade (no subgrades)',
            totalFront: values?.front_overall_predicted_grade,
            totalBack: values?.back_overall_predicted_grade,
            totalOverall: computeTotalOverall(
                values?.front_overall_predicted_grade,
                values?.back_overall_predicted_grade,
            ),
        },
    ];

    return (
        <div className='grades-form'>
            <Row>
                <Col span={7}>
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
                                <Typography.Text>#{frameOptions.cardName}</Typography.Text>
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
                <Col span={12} className='grades-form-overall-grades'>
                    <Collapse defaultActiveKey={['1']}>
                        <Panel header='Overall Robogrades' key='1'>
                            <Table
                                columns={totalGradesColumns}
                                dataSource={totalGradesRows}
                                pagination={false}
                                size='small'
                            />
                        </Panel>
                    </Collapse>
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

            <Form
                ref={formRef}
                name='grades_form'
                layout='vertical'
                initialValues={values}
                onFieldsChange={handleFieldsChange}
            >
                <Row gutter={8} className='grades-form-section'>
                    {enhancedRobogradesVisibility ? (
                        <Col span={8}>
                            <Collapse defaultActiveKey={['1']}>
                                <Panel header='Enhanced Robogrades' key='1'>
                                    <Typography.Text strong className='grades-form-inner-title'>
                                        Front of Card
                                    </Typography.Text>
                                    <Row gutter={[8, 16]}>
                                        <Col span={6}>
                                            <Form.Item label='Centering' name='front_centering_human_grade'>
                                                <Input type='number' max={10} min={0} step={0.5} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Surface' name='front_surface_human_grade'>
                                                <Input type='number' max={10} min={0} step={0.5} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Edges' name='front_edges_human_grade'>
                                                <Input type='number' max={10} min={0} step={0.5} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Corners' name='front_corners_human_grade'>
                                                <Input type='number' max={10} min={0} step={0.5} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Divider className='grades-form-separator' />
                                    <Typography.Text strong className='grades-form-inner-title'>
                                        Back of Card
                                    </Typography.Text>
                                    <Row gutter={[8, 16]}>
                                        <Col span={6}>
                                            <Form.Item label='Centering' name='back_centering_human_grade'>
                                                <Input type='number' max={10} min={0} step={0.5} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Surface' name='back_surface_human_grade'>
                                                <Input type='number' max={10} min={0} step={0.5} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Edges' name='back_edges_human_grade'>
                                                <Input type='number' max={10} min={0} step={0.5} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Corners' name='back_corners_human_grade'>
                                                <Input type='number' max={10} min={0} step={0.5} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Panel>
                            </Collapse>
                        </Col>
                    ) : null}
                    {robogradesVisibility ? (
                        <Col span={7}>
                            <Collapse defaultActiveKey={['1']}>
                                <Panel header='Robogrades' key='1'>
                                    <Typography.Text strong className='grades-form-inner-title'>
                                        Front of Card
                                    </Typography.Text>
                                    <Row gutter={[8, 16]}>
                                        <Col span={6}>
                                            <Form.Item label='Centering' name='front_centering_laser_grade'>
                                                <Input type='number' controls={false} formatter={roundBy25} readOnly />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Surface' name='front_surface_laser_grade'>
                                                <Input type='number' controls={false} formatter={roundBy25} readOnly />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Edges' name='front_edges_laser_grade'>
                                                <Input type='number' controls={false} formatter={roundBy25} readOnly />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Corners' name='front_corners_laser_grade'>
                                                <Input type='number' controls={false} formatter={roundBy25} readOnly />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Divider className='grades-form-separator' />
                                    <Typography.Text strong className='grades-form-inner-title'>
                                        Back of Card
                                    </Typography.Text>
                                    <Row gutter={[8, 16]}>
                                        <Col span={6}>
                                            <Form.Item label='Centering' name='back_centering_laser_grade'>
                                                <Input type='number' controls={false} formatter={roundBy25} readOnly />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Surface' name='back_surface_laser_grade'>
                                                <Input type='number' controls={false} formatter={roundBy25} readOnly />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Edges' name='back_edges_laser_grade'>
                                                <Input type='number' controls={false} formatter={roundBy25} readOnly />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label='Corners' name='back_corners_laser_grade'>
                                                <Input type='number' controls={false} formatter={roundBy25} readOnly />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Panel>
                            </Collapse>
                        </Col>
                    ) : null}
                    {frameOptions.orientation && rawRobogradesVisibility ? (
                        <Col span={4}>
                            <Collapse defaultActiveKey={['1']}>
                                <Panel header='Raw Robogrades' key='1'>
                                    <div className='grades-form-info'>
                                        <div className='grades-form-raw-grades'>
                                            <div>
                                                <Typography.Text strong>Surface:&nbsp;</Typography.Text>
                                                <Typography.Text>
                                                    {values?.[`${frameOptions.orientation}_raw_surface_grade`]}
                                                </Typography.Text>
                                            </div>
                                            <div className='grades-form-raw-grades-info'>
                                                <Typography.Text>
                                                    {`(minor: ${computeRawGradePercentile(
                                                        values?.[
                                                            `${frameOptions.orientation}_raw_surface_minor_defect`
                                                        ]?.[1],
                                                    )}, major: ${computeRawGradePercentile(
                                                        values?.[
                                                            `${frameOptions.orientation}_raw_surface_major_defect`
                                                        ]?.[1],
                                                    )})`}
                                                </Typography.Text>
                                            </div>
                                        </div>

                                        <div className='grades-form-raw-grades'>
                                            <div>
                                                <Typography.Text strong>Corner:&nbsp;</Typography.Text>
                                                <Typography.Text>
                                                    {values?.[`${frameOptions.orientation}_raw_corner_grade`]}
                                                </Typography.Text>
                                            </div>
                                            <div className='grades-form-raw-grades-info'>
                                                <Typography.Text>
                                                    {`(minor: ${computeRawGradePercentile(
                                                        values?.[
                                                            `${frameOptions.orientation}_raw_corner_minor_defect`
                                                        ]?.[1],
                                                    )}, major: ${computeRawGradePercentile(
                                                        values?.[
                                                            `${frameOptions.orientation}_raw_corner_major_defect`
                                                        ]?.[1],
                                                    )})`}
                                                </Typography.Text>
                                            </div>
                                        </div>

                                        <div className='grades-form-raw-grades'>
                                            <div>
                                                <Typography.Text strong>Edges:&nbsp;</Typography.Text>
                                                <Typography.Text>
                                                    {values?.[`${frameOptions.orientation}_raw_edge_grade`]}
                                                </Typography.Text>
                                            </div>
                                            <div className='grades-form-raw-grades-info'>
                                                <Typography.Text>
                                                    {`(minor: ${computeRawGradePercentile(
                                                        values?.[
                                                            `${frameOptions.orientation}_raw_edge_minor_defect`
                                                        ]?.[1],
                                                    )}, major: ${computeRawGradePercentile(
                                                        values?.[
                                                            `${frameOptions.orientation}_raw_edge_major_defect`
                                                        ]?.[1],
                                                    )})`}
                                                </Typography.Text>
                                            </div>
                                        </div>

                                        <div className='grades-form-raw-grades'>
                                            <div>
                                                <Typography.Text strong>Centering:&nbsp;</Typography.Text>
                                                <Typography.Text>
                                                    {values?.[`${frameOptions.orientation}_raw_centering_grade`]}
                                                </Typography.Text>
                                            </div>
                                            <div className='grades-form-raw-grades-info'>
                                                <Typography.Text>
                                                    {`(angle: ${computeRawGradePercentile(
                                                        values?.[`${frameOptions.orientation}_raw_angle_dif`]?.[1],
                                                    )}, center: ${computeRawGradePercentile(
                                                        values?.[`${frameOptions.orientation}_raw_center_dif`]?.[1],
                                                    )})`}
                                                </Typography.Text>
                                            </div>
                                        </div>
                                    </div>
                                </Panel>
                            </Collapse>
                        </Col>
                    ) : null}
                    <Col span={4} style={{ display: 'flex' }}>
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
                            <Space direction='vertical' style={{ width: '100%' }}>
                                <Button type='primary' onClick={handleUpdate} block>
                                    Update grades
                                </Button>
                                <Button type='primary' onClick={handleRobogrades} block>
                                    Generate Robogrades
                                </Button>
                                <GradesFormAdvancedControls
                                    onGenerateRobogradesAndMasks={handleRobogradesAndMasks}
                                    onGenerateRawRobogrades={handleRawRobogrades}
                                    enhancedRobogradesVisibility={enhancedRobogradesVisibility}
                                    robogradesVisibility={robogradesVisibility}
                                    rawRobogradesVisibility={rawRobogradesVisibility}
                                    handleEnhancedRobogradesVisibility={setEnhancedRobogradesVisibility}
                                    handleRobogradesVisibility={setRobogradesVisibility}
                                    handleRawRobogradesVisibility={setRawRobogradesVisibility}
                                />
                            </Space>
                        </div>
                    </Col>
                </Row>
            </Form>

            <Button className='grades-form-close' shape='circle' icon={<CloseCircleOutlined />} onClick={handleClose} />
        </div>
    );
}

export default GradesForm;
