// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, { MutableRefObject } from 'react';
import { connect } from 'react-redux';
import Icon, { LoadingOutlined } from '@ant-design/icons';
import Popover from 'antd/lib/popover';
import Select from 'antd/lib/select';
import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import Text from 'antd/lib/typography/Text';
import Tabs from 'antd/lib/tabs';
import { Row, Col } from 'antd/lib/grid';
import notification from 'antd/lib/notification';
import message from 'antd/lib/message';
import Progress from 'antd/lib/progress';
import InputNumber from 'antd/lib/input-number';

import { AIToolsIcon } from 'icons';
import { Canvas, convertShapesForInteractor } from 'cvat-canvas-wrapper';
import range from 'utils/range';
import getCore from 'cvat-core-wrapper';
import openCVWrapper from 'utils/opencv-wrapper/opencv-wrapper';
import {
    CombinedState, ActiveControl, Model, ObjectType, ShapeType,
} from 'reducers/interfaces';
import {
    interactWithCanvas,
    fetchAnnotationsAsync,
    updateAnnotationsAsync,
    createAnnotationsAsync,
} from 'actions/annotation-actions';
import DetectorRunner from 'components/model-runner-modal/detector-runner';
import LabelSelector from 'components/label-selector/label-selector';
import ApproximationAccuracy, {
    thresholdFromAccuracy,
} from 'components/annotation-page/standard-workspace/controls-side-bar/approximation-accuracy';
import withVisibilityHandling from './handle-popover-visibility';

interface StateToProps {
    canvasInstance: Canvas;
    labels: any[];
    states: any[];
    activeLabelID: number;
    jobInstance: any;
    isActivated: boolean;
    frame: number;
    interactors: Model[];
    detectors: Model[];
    trackers: Model[];
    curZOrder: number;
    aiToolsRef: MutableRefObject<any>;
    defaultApproxPolyAccuracy: number;
}

interface DispatchToProps {
    onInteractionStart(activeInteractor: Model, activeLabelID: number): void;
    updateAnnotations(statesToUpdate: any[]): void;
    createAnnotations(sessionInstance: any, frame: number, statesToCreate: any[]): void;
    fetchAnnotations(): void;
}

const core = getCore();
const CustomPopover = withVisibilityHandling(Popover, 'tools-control');

function mapStateToProps(state: CombinedState): StateToProps {
    const { annotation } = state;
    const { settings } = state;
    const { number: frame } = annotation.player.frame;
    const { instance: jobInstance } = annotation.job;
    const { instance: canvasInstance, activeControl } = annotation.canvas;
    const { models } = state;
    const { interactors, detectors, trackers } = models;

    return {
        interactors,
        detectors,
        trackers,
        isActivated: activeControl === ActiveControl.AI_TOOLS,
        activeLabelID: annotation.drawing.activeLabelID,
        labels: annotation.job.labels,
        states: annotation.annotations.states,
        canvasInstance: canvasInstance as Canvas,
        jobInstance,
        frame,
        curZOrder: annotation.annotations.zLayer.cur,
        aiToolsRef: annotation.aiToolsRef,
        defaultApproxPolyAccuracy: settings.workspace.defaultApproxPolyAccuracy,
    };
}

const mapDispatchToProps = {
    onInteractionStart: interactWithCanvas,
    updateAnnotations: updateAnnotationsAsync,
    createAnnotations: createAnnotationsAsync,
    fetchAnnotations: fetchAnnotationsAsync,
};

type Props = StateToProps & DispatchToProps;
interface State {
    activeInteractor: Model | null;
    activeLabelID: number;
    activeTracker: Model | null;
    trackingProgress: number | null;
    trackingFrames: number;
    fetching: boolean;
    pointsRecieved: boolean;
    approxPolyAccuracy: number;
    mode: 'detection' | 'interaction' | 'tracking';
}

export class ToolsControlComponent extends React.PureComponent<Props, State> {
    private interactionIsAborted: boolean;
    private interactionIsDone: boolean;
    private latestResponseResult: number[][];
    private latestResult: number[][];

    public constructor(props: Props) {
        super(props);
        this.state = {
            activeInteractor: props.interactors.length ? props.interactors[0] : null,
            activeTracker: props.trackers.length ? props.trackers[0] : null,
            activeLabelID: props.labels.length ? props.labels[0].id : null,
            approxPolyAccuracy: props.defaultApproxPolyAccuracy,
            trackingProgress: null,
            trackingFrames: 10,
            fetching: false,
            pointsRecieved: false,
            mode: 'interaction',
        };

        this.latestResponseResult = [];
        this.latestResult = [];
        this.interactionIsAborted = false;
        this.interactionIsDone = false;
    }

    public componentDidMount(): void {
        const { canvasInstance, aiToolsRef } = this.props;
        aiToolsRef.current = this;
        canvasInstance.html().addEventListener('canvas.interacted', this.interactionListener);
        canvasInstance.html().addEventListener('canvas.canceled', this.cancelListener);
    }

    public componentDidUpdate(prevProps: Props, prevState: State): void {
        const { isActivated, defaultApproxPolyAccuracy, canvasInstance } = this.props;
        const { approxPolyAccuracy, activeInteractor } = this.state;

        if (prevProps.isActivated && !isActivated) {
            window.removeEventListener('contextmenu', this.contextmenuDisabler);
        } else if (!prevProps.isActivated && isActivated) {
            // reset flags when start interaction/tracking
            this.setState({
                approxPolyAccuracy: defaultApproxPolyAccuracy,
                pointsRecieved: false,
            });
            this.latestResult = [];
            this.latestResponseResult = [];
            this.interactionIsDone = false;
            this.interactionIsAborted = false;
            window.addEventListener('contextmenu', this.contextmenuDisabler);
        }

        if (prevState.approxPolyAccuracy !== approxPolyAccuracy) {
            if (isActivated && activeInteractor !== null && this.latestResponseResult.length) {
                this.approximateResponsePoints(this.latestResponseResult).then((points: number[][]) => {
                    this.latestResult = points;
                    canvasInstance.interact({
                        enabled: true,
                        intermediateShape: {
                            shapeType: ShapeType.POLYGON,
                            points: this.latestResult.flat(),
                        },
                    });
                });
            }
        }
    }

    public componentWillUnmount(): void {
        const { canvasInstance, aiToolsRef } = this.props;
        aiToolsRef.current = undefined;
        canvasInstance.html().removeEventListener('canvas.interacted', this.interactionListener);
        canvasInstance.html().removeEventListener('canvas.canceled', this.cancelListener);
    }

    private contextmenuDisabler = (e: MouseEvent): void => {
        if (
            e.target &&
            (e.target as Element).classList &&
            (e.target as Element).classList.toString().includes('ant-modal')
        ) {
            e.preventDefault();
        }
    };

    private cancelListener = async (): Promise<void> => {
        const { isActivated } = this.props;
        const { fetching } = this.state;
        this.latestResult = [];

        if (isActivated) {
            if (fetching && !this.interactionIsDone) {
                // user pressed ESC
                this.setState({ fetching: false });
                this.interactionIsAborted = true;
            }
        }
    };

    private onInteraction = async (e: Event): Promise<void> => {
        const {
            frame,
            labels,
            curZOrder,
            jobInstance,
            isActivated,
            activeLabelID,
            canvasInstance,
            createAnnotations,
        } = this.props;
        const { activeInteractor, fetching } = this.state;

        if (!isActivated) {
            return;
        }

        try {
            this.interactionIsDone = (e as CustomEvent).detail.isDone;
            const interactor = activeInteractor as Model;

            if ((e as CustomEvent).detail.shapesUpdated) {
                this.setState({ fetching: true });
                try {
                    this.latestResponseResult = await core.lambda.call(jobInstance.task, interactor, {
                        frame,
                        pos_points: convertShapesForInteractor((e as CustomEvent).detail.shapes, 0),
                        neg_points: convertShapesForInteractor((e as CustomEvent).detail.shapes, 2),
                    });

                    this.latestResult = this.latestResponseResult;

                    if (this.interactionIsAborted) {
                        // while the server request
                        // user has cancelled interaction (for example pressed ESC)
                        // need to clean variables that have been just set
                        this.latestResult = [];
                        this.latestResponseResult = [];
                        return;
                    }

                    this.latestResult = await this.approximateResponsePoints(this.latestResponseResult);
                } finally {
                    this.setState({ fetching: false, pointsRecieved: !!this.latestResult.length });
                }
            }

            if (!this.latestResult.length) {
                return;
            }

            if (this.interactionIsDone && !fetching) {
                const object = new core.classes.ObjectState({
                    frame,
                    objectType: ObjectType.SHAPE,
                    label: labels.length ? labels.filter((label: any) => label.id === activeLabelID)[0] : null,
                    shapeType: ShapeType.POLYGON,
                    points: this.latestResult.flat(),
                    occluded: false,
                    zOrder: curZOrder,
                });

                createAnnotations(jobInstance, frame, [object]);
            } else {
                canvasInstance.interact({
                    enabled: true,
                    intermediateShape: {
                        shapeType: ShapeType.POLYGON,
                        points: this.latestResult.flat(),
                    },
                });
            }
        } catch (err) {
            notification.error({
                description: err.toString(),
                message: 'Interaction error occured',
            });
        }
    };

    private onTracking = async (e: Event): Promise<void> => {
        const {
            isActivated, jobInstance, frame, curZOrder, fetchAnnotations,
        } = this.props;

        if (!isActivated) {
            return;
        }

        const { activeLabelID } = this.state;
        const [label] = jobInstance.task.labels.filter((_label: any): boolean => _label.id === activeLabelID);

        const { isDone, shapesUpdated } = (e as CustomEvent).detail;
        if (!isDone || !shapesUpdated) {
            return;
        }

        this.interactionIsDone = true;
        try {
            const { points } = (e as CustomEvent).detail.shapes[0];
            const state = new core.classes.ObjectState({
                shapeType: ShapeType.RECTANGLE,
                objectType: ObjectType.TRACK,
                zOrder: curZOrder,
                label,
                points,
                frame,
                occluded: false,
                source: 'auto',
                attributes: {},
            });

            const [clientID] = await jobInstance.annotations.put([state]);

            // update annotations on a canvas
            fetchAnnotations();

            const states = await jobInstance.annotations.get(frame);
            const [objectState] = states.filter((_state: any): boolean => _state.clientID === clientID);
            await this.trackState(objectState);
        } catch (err) {
            notification.error({
                description: err.toString(),
                message: 'Tracking error occured',
            });
        }
    };

    private interactionListener = async (e: Event): Promise<void> => {
        const { mode } = this.state;

        if (mode === 'interaction') {
            await this.onInteraction(e);
        }

        if (mode === 'tracking') {
            await this.onTracking(e);
        }
    };

    private setActiveInteractor = (value: string): void => {
        const { interactors } = this.props;
        this.setState({
            activeInteractor: interactors.filter((interactor: Model) => interactor.id === value)[0],
        });
    };

    private setActiveTracker = (value: string): void => {
        const { trackers } = this.props;
        this.setState({
            activeTracker: trackers.filter((tracker: Model) => tracker.id === value)[0],
        });
    };

    private async approximateResponsePoints(points: number[][]): Promise<number[][]> {
        const { approxPolyAccuracy } = this.state;
        if (points.length > 3) {
            if (!openCVWrapper.isInitialized) {
                const hide = message.loading('OpenCV.js initialization..');
                try {
                    await openCVWrapper.initialize(() => {});
                } finally {
                    hide();
                }
            }

            const threshold = thresholdFromAccuracy(approxPolyAccuracy);
            return openCVWrapper.contours.approxPoly(points, threshold);
        }

        return points;
    }

    public async trackState(state: any): Promise<void> {
        const { jobInstance, frame, fetchAnnotations } = this.props;
        const { activeTracker, trackingFrames } = this.state;
        const { clientID, points } = state;

        const tracker = activeTracker as Model;
        try {
            this.setState({ trackingProgress: 0, fetching: true });
            let response = await core.lambda.call(jobInstance.task, tracker, {
                task: jobInstance.task,
                frame,
                shape: points,
            });

            for (const offset of range(1, trackingFrames + 1)) {
                /* eslint-disable no-await-in-loop */
                const states = await jobInstance.annotations.get(frame + offset);
                const [objectState] = states.filter((_state: any): boolean => _state.clientID === clientID);
                response = await core.lambda.call(jobInstance.task, tracker, {
                    task: jobInstance.task,
                    frame: frame + offset,
                    shape: response.points,
                    state: response.state,
                });

                const reduced = response.shape.reduce(
                    (acc: number[], value: number, index: number): number[] => {
                        if (index % 2) {
                            // y
                            acc[1] = Math.min(acc[1], value);
                            acc[3] = Math.max(acc[3], value);
                        } else {
                            // x
                            acc[0] = Math.min(acc[0], value);
                            acc[2] = Math.max(acc[2], value);
                        }
                        return acc;
                    },
                    [
                        Number.MAX_SAFE_INTEGER,
                        Number.MAX_SAFE_INTEGER,
                        Number.MIN_SAFE_INTEGER,
                        Number.MIN_SAFE_INTEGER,
                    ],
                );

                objectState.points = reduced;
                await objectState.save();

                this.setState({ trackingProgress: offset / trackingFrames });
            }
        } finally {
            this.setState({ trackingProgress: null, fetching: false });
            fetchAnnotations();
        }
    }

    public trackingAvailable(): boolean {
        const { activeTracker, trackingFrames } = this.state;
        const { trackers } = this.props;

        return !!trackingFrames && !!trackers.length && activeTracker !== null;
    }

    private renderLabelBlock(): JSX.Element {
        const { labels } = this.props;
        const { activeLabelID } = this.state;
        return (
            <>
                <Row justify='start'>
                    <Col>
                        <Text className='cvat-text-color'>Label</Text>
                    </Col>
                </Row>
                <Row justify='center'>
                    <Col span={24}>
                        <LabelSelector
                            style={{ width: '100%' }}
                            labels={labels}
                            value={activeLabelID}
                            onChange={(value: any) => this.setState({ activeLabelID: value.id })}
                        />
                    </Col>
                </Row>
            </>
        );
    }

    private renderTrackerBlock(): JSX.Element {
        const {
            trackers, canvasInstance, jobInstance, frame, onInteractionStart,
        } = this.props;
        const {
            activeTracker, activeLabelID, fetching, trackingFrames,
        } = this.state;

        if (!trackers.length) {
            return (
                <Row justify='center' align='middle' style={{ marginTop: '5px' }}>
                    <Col>
                        <Text type='warning' className='cvat-text-color'>
                            No available trackers found
                        </Text>
                    </Col>
                </Row>
            );
        }

        return (
            <>
                <Row justify='start'>
                    <Col>
                        <Text className='cvat-text-color'>Tracker</Text>
                    </Col>
                </Row>
                <Row align='middle' justify='center'>
                    <Col span={24}>
                        <Select
                            style={{ width: '100%' }}
                            defaultValue={trackers[0].name}
                            onChange={this.setActiveTracker}
                        >
                            {trackers.map(
                                (tracker: Model): JSX.Element => (
                                    <Select.Option value={tracker.id} title={tracker.description} key={tracker.id}>
                                        {tracker.name}
                                    </Select.Option>
                                ),
                            )}
                        </Select>
                    </Col>
                </Row>
                <Row align='middle' justify='start' style={{ marginTop: '5px' }}>
                    <Col>
                        <Text>Tracking frames</Text>
                    </Col>
                    <Col offset={2}>
                        <InputNumber
                            value={trackingFrames}
                            step={1}
                            min={1}
                            precision={0}
                            max={jobInstance.stopFrame - frame}
                            onChange={(value: number | undefined | string | null): void => {
                                if (typeof value !== 'undefined' && value !== null) {
                                    this.setState({
                                        trackingFrames: +value,
                                    });
                                }
                            }}
                        />
                    </Col>
                </Row>
                <Row align='middle' justify='end'>
                    <Col>
                        <Button
                            type='primary'
                            loading={fetching}
                            className='cvat-tools-track-button'
                            disabled={!activeTracker || fetching || frame === jobInstance.stopFrame}
                            onClick={() => {
                                this.setState({ mode: 'tracking' });

                                if (activeTracker) {
                                    canvasInstance.cancel();
                                    canvasInstance.interact({
                                        shapeType: 'rectangle',
                                        enabled: true,
                                    });

                                    onInteractionStart(activeTracker, activeLabelID);
                                }
                            }}
                        >
                            Track
                        </Button>
                    </Col>
                </Row>
            </>
        );
    }

    private renderInteractorBlock(): JSX.Element {
        const { interactors, canvasInstance, onInteractionStart } = this.props;
        const { activeInteractor, activeLabelID, fetching } = this.state;

        if (!interactors.length) {
            return (
                <Row justify='center' align='middle' style={{ marginTop: '5px' }}>
                    <Col>
                        <Text type='warning' className='cvat-text-color'>
                            No available interactors found
                        </Text>
                    </Col>
                </Row>
            );
        }

        return (
            <>
                <Row justify='start'>
                    <Col>
                        <Text className='cvat-text-color'>Interactor</Text>
                    </Col>
                </Row>
                <Row align='middle' justify='center'>
                    <Col span={24}>
                        <Select
                            style={{ width: '100%' }}
                            defaultValue={interactors[0].name}
                            onChange={this.setActiveInteractor}
                        >
                            {interactors.map(
                                (interactor: Model): JSX.Element => (
                                    <Select.Option
                                        value={interactor.id}
                                        title={interactor.description}
                                        key={interactor.id}
                                    >
                                        {interactor.name}
                                    </Select.Option>
                                ),
                            )}
                        </Select>
                    </Col>
                </Row>
                <Row align='middle' justify='end'>
                    <Col>
                        <Button
                            type='primary'
                            loading={fetching}
                            className='cvat-tools-interact-button'
                            disabled={!activeInteractor || fetching}
                            onClick={() => {
                                this.setState({ mode: 'interaction' });

                                if (activeInteractor) {
                                    canvasInstance.cancel();
                                    canvasInstance.interact({
                                        shapeType: 'points',
                                        enabled: true,
                                        ...activeInteractor.params.canvas,
                                    });

                                    onInteractionStart(activeInteractor, activeLabelID);
                                }
                            }}
                        >
                            Interact
                        </Button>
                    </Col>
                </Row>
            </>
        );
    }

    private renderDetectorBlock(): JSX.Element {
        const {
            jobInstance, detectors, curZOrder, frame, createAnnotations,
        } = this.props;

        if (!detectors.length) {
            return (
                <Row justify='center' align='middle' style={{ marginTop: '5px' }}>
                    <Col>
                        <Text type='warning' className='cvat-text-color'>
                            No available detectors found
                        </Text>
                    </Col>
                </Row>
            );
        }

        return (
            <DetectorRunner
                withCleanup={false}
                models={detectors}
                task={jobInstance.task}
                runInference={async (task: any, model: Model, body: object) => {
                    try {
                        this.setState({ mode: 'detection', fetching: true });
                        const result = await core.lambda.call(task, model, { ...body, frame });
                        const states = result.map(
                            (data: any): any =>
                                new core.classes.ObjectState({
                                    shapeType: data.type,
                                    label: task.labels.filter((label: any): boolean => label.name === data.label)[0],
                                    points: data.points,
                                    objectType: ObjectType.SHAPE,
                                    frame,
                                    occluded: false,
                                    source: 'auto',
                                    attributes: {},
                                    zOrder: curZOrder,
                                }),
                        );

                        createAnnotations(jobInstance, frame, states);
                    } catch (error) {
                        notification.error({
                            description: error.toString(),
                            message: 'Detection error occured',
                        });
                    } finally {
                        this.setState({ fetching: false });
                    }
                }}
            />
        );
    }

    private renderPopoverContent(): JSX.Element {
        return (
            <div className='cvat-tools-control-popover-content'>
                <Row justify='start'>
                    <Col>
                        <Text className='cvat-text-color' strong>
                            AI Tools
                        </Text>
                    </Col>
                </Row>
                <Tabs type='card' tabBarGutter={8}>
                    <Tabs.TabPane key='interactors' tab='Interactors'>
                        {this.renderLabelBlock()}
                        {this.renderInteractorBlock()}
                    </Tabs.TabPane>
                    <Tabs.TabPane key='detectors' tab='Detectors'>
                        {this.renderDetectorBlock()}
                    </Tabs.TabPane>
                    <Tabs.TabPane key='trackers' tab='Trackers'>
                        {this.renderLabelBlock()}
                        {this.renderTrackerBlock()}
                    </Tabs.TabPane>
                </Tabs>
            </div>
        );
    }

    public render(): JSX.Element | null {
        const {
            interactors, detectors, trackers, isActivated, canvasInstance, labels,
        } = this.props;
        const {
            fetching, trackingProgress, approxPolyAccuracy, activeInteractor, pointsRecieved,
        } = this.state;

        if (![...interactors, ...detectors, ...trackers].length) return null;

        const dynamcPopoverPros = isActivated ?
            {
                overlayStyle: {
                    display: 'none',
                },
            } :
            {};

        const dynamicIconProps = isActivated ?
            {
                className: 'cvat-tools-control cvat-active-canvas-control',
                onClick: (): void => {
                    canvasInstance.interact({ enabled: false });
                },
            } :
            {
                className: 'cvat-tools-control',
            };

        return !labels.length ? (
            <Icon className=' cvat-tools-control cvat-disabled-canvas-control' component={AIToolsIcon} />
        ) : (
            <>
                <Modal
                    title='Making a server request'
                    zIndex={Number.MAX_SAFE_INTEGER}
                    visible={fetching}
                    closable={false}
                    footer={[]}
                >
                    <Text>Waiting for a server response..</Text>
                    <LoadingOutlined style={{ marginLeft: '10px' }} />
                    {trackingProgress !== null && (
                        <Progress percent={+(trackingProgress * 100).toFixed(0)} status='active' />
                    )}
                </Modal>
                {isActivated && activeInteractor !== null && pointsRecieved ? (
                    <ApproximationAccuracy
                        approxPolyAccuracy={approxPolyAccuracy}
                        onChange={(value: number) => {
                            this.setState({ approxPolyAccuracy: value });
                        }}
                    />
                ) : null}
                <CustomPopover {...dynamcPopoverPros} placement='right' content={this.renderPopoverContent()}>
                    <Icon {...dynamicIconProps} component={AIToolsIcon} />
                </CustomPopover>
            </>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ToolsControlComponent);
