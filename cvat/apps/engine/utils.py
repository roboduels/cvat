# Copyright (C) 2020-2021 Intel Corporation
#
# SPDX-License-Identifier: MIT

import ast
from datetime import datetime

import cv2 as cv
from collections import namedtuple
import hashlib
import importlib
import sys
import traceback
import subprocess
import os
from av import VideoFrame
from PIL import Image
import re

from django.core.exceptions import ValidationError

from cvat.apps.engine import models

Import = namedtuple("Import", ["module", "name", "alias"])


def parse_imports(source_code: str):
    root = ast.parse(source_code)

    for node in ast.iter_child_nodes(root):
        if isinstance(node, ast.Import):
            module = []
        elif isinstance(node, ast.ImportFrom):
            module = node.module
        else:
            continue

        for n in node.names:
            yield Import(module, n.name, n.asname)


def import_modules(source_code: str):
    results = {}
    imports = parse_imports(source_code)
    for import_ in imports:
        module = import_.module if import_.module else import_.name
        loaded_module = importlib.import_module(module)

        if not import_.name == module:
            loaded_module = getattr(loaded_module, import_.name)

        if import_.alias:
            results[import_.alias] = loaded_module
        else:
            results[import_.name] = loaded_module

    return results


class InterpreterError(Exception):
    pass


def execute_python_code(source_code, global_vars=None, local_vars=None):
    try:
        # pylint: disable=exec-used
        exec(source_code, global_vars, local_vars)
    except SyntaxError as err:
        error_class = err.__class__.__name__
        details = err.args[0]
        line_number = err.lineno
        raise InterpreterError("{} at line {}: {}".format(error_class, line_number, details))
    except AssertionError as err:
        # AssertionError doesn't contain any args and line number
        error_class = err.__class__.__name__
        raise InterpreterError("{}".format(error_class))
    except Exception as err:
        error_class = err.__class__.__name__
        details = err.args[0]
        _, _, tb = sys.exc_info()
        line_number = traceback.extract_tb(tb)[-1][1]
        raise InterpreterError("{} at line {}: {}".format(error_class, line_number, details))


def av_scan_paths(*paths):
    if 'yes' == os.environ.get('CLAM_AV'):
        command = ['clamscan', '--no-summary', '-i', '-o']
        command.extend(paths)
        res = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)  # nosec
        if res.returncode:
            raise ValidationError(res.stdout)


def rotate_image(image, angle):
    height, width = image.shape[:2]
    image_center = (width / 2, height / 2)
    matrix = cv.getRotationMatrix2D(image_center, angle, 1.)
    abs_cos = abs(matrix[0, 0])
    abs_sin = abs(matrix[0, 1])
    bound_w = int(height * abs_sin + width * abs_cos)
    bound_h = int(height * abs_cos + width * abs_sin)
    matrix[0, 2] += bound_w / 2 - image_center[0]
    matrix[1, 2] += bound_h / 2 - image_center[1]
    matrix = cv.warpAffine(image, matrix, (bound_w, bound_h))
    return matrix


def md5_hash(frame):
    if isinstance(frame, VideoFrame):
        frame = frame.to_image()
    elif isinstance(frame, str):
        frame = Image.open(frame, 'r')
    return hashlib.md5(frame.tobytes()).hexdigest() # nosec


def log_activity(activity_type, user, options=None, extra=None):
    if options is None:
        options = {}
    if extra is None:
        extra = {}

    hash_content = hashlib.sha1("{}:{}:{}".format(activity_type, user.id, options).encode('utf-8')).hexdigest()
    options['time'] = datetime.now().isoformat()
    options = {**options, **extra}

    defaults = {
        'activity_type': activity_type,
        'user': user,
        'options': options,
        'hash': hash_content,
    }

    models.ActivityLog.objects.update_or_create(
        activity_type=activity_type,
        user=user,
        hash=hash_content,
        defaults=defaults,
    )

def parse_specific_attributes(specific_attributes):
    assert isinstance(specific_attributes, str), 'Specific attributes must be a string'
    return {
        item.split('=')[0].strip(): item.split('=')[1].strip()
            for item in specific_attributes.split('&')
    } if specific_attributes else dict()

def log_annotation(user, job_id, action, shapes):
    try:
        segment = models.Segment.objects.select_related('task').get(id=job_id)
        data_id = segment.task.data_id

        for shape in shapes:
            image = models.Image.objects.get(data_id=data_id, frame=shape.get('frame'))
            regex_match = re.match(r"^([^_+-]*)[_+-]*([^_+-]*)[_+-]*(front|back)[_-](laser|cam)\.(.*)$", image.path)
            order_id = regex_match[1]
            certificate_id = regex_match[2]

            models.AnnotationLog.objects.create(
                order_id=order_id,
                certificate_id=certificate_id,
                user=user,
                action=action,
                label=shape.get('label_id')
            )
    except Exception as err:
        raise err