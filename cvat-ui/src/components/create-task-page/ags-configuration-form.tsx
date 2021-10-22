// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, { RefObject } from 'react';
import Input from 'antd/lib/input';
import Form, { FormInstance } from 'antd/lib/form';
import { Store } from 'antd/lib/form/interface';
import { Col, Row } from 'antd/lib/grid';

export interface AgsConfiguration {
    orderId: number;
    certificateId: number;
}

interface Props {
    onSubmit(values: AgsConfiguration): void;
}

export default class AgsConfigurationForm extends React.PureComponent<Props> {
    private static toInt(value: any): number {
        return parseInt(String(value).replace(/\D/g, ''), 10);
    }

    private formRef: RefObject<FormInstance>;

    public constructor(props: Props) {
        super(props);
        this.formRef = React.createRef<FormInstance>();
    }

    public submit(): Promise<void> {
        const { onSubmit } = this.props;
        if (this.formRef.current) {
            return this.formRef.current.validateFields().then(
                (values: Store): Promise<void> => {
                    onSubmit({
                        certificateId: AgsConfigurationForm.toInt(values.certificateId),
                        orderId: AgsConfigurationForm.toInt(values.orderId),
                    });

                    return Promise.resolve();
                },
            );
        }

        return Promise.reject(new Error('Form ref is empty'));
    }

    public resetFields(): void {
        if (this.formRef.current) {
            this.formRef.current.resetFields();
        }
    }

    public render(): JSX.Element {
        return (
            <Form ref={this.formRef} layout='vertical'>
                <Row gutter={18}>
                    <Col span={12}>
                        <Form.Item hasFeedback name='orderId' label={<span>Order ID/Number</span>}>
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item hasFeedback name='certificateId' label={<span>Certificate ID</span>}>
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        );
    }
}
