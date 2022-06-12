import requests
import json
import os
from requests_toolbelt.multipart.encoder import MultipartEncoder

CVAT_API_URL = os.environ.get("CVAT_API_URL")
CVAT_API_TOKEN = os.environ.get("CVAT_API_TOKEN")
AGS_API_URL = os.environ.get("AGS_API_URL")
AGS_API_TOKEN = os.environ.get("AGS_API_TOKEN")

def get_missing_scans():
    url = f"{AGS_API_URL}/missing-scans/"
    headers = {
        'Authorization': f'Bearer {AGS_API_TOKEN}',
    }
    response = requests.request("GET", url, headers=headers, data={})
    response = response.json()
    daily_scan_amount = response.get("daily_scan_amount")
    front_missing_list = response.get("front_missing_list")
    back_missing_list = response.get("back_missing_list")
    return daily_scan_amount, front_missing_list, back_missing_list

def get_grade_parameters(cert_id, orientation):
    url = f"{CVAT_API_URL}/v1/grade-parameters"
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': f'Basic {CVAT_API_TOKEN}'
    }
    payload = f"certificate_id={cert_id}&orientation={orientation}&task_status=completed"
    response = requests.request("POST", url, headers=headers, data=payload)
    response = response.json()
    order_id = response.get("order_id")
    certificate_id = response.get("certificate_id")
    result = response.get("result")
    return order_id, certificate_id, result

def post_cvat_to_grade(filename, payload, orientation, certificate_id, image_type, image_path):
    try:
        url = f"{AGS_API_URL}/cvat-to-grade/"
        fields={'payload': payload, 'orientation': orientation, 'certificate_id': certificate_id, 'image_type': image_type}
        fields['image'] = (filename, open(image_path,'rb'),'image/png')
        multipart_form_data = MultipartEncoder(fields=fields)
        headers = {
            'Authorization': f'Bearer {AGS_API_TOKEN}',
            'Content-Type': multipart_form_data.content_type,
        }
        response = requests.post(url, data=multipart_form_data, headers=headers)
        response.raise_for_status()
    except requests.exceptions.HTTPError as err:
        raise ValueError(err)

def post_cron_scan_logs(certificate_id, orientation, status, image_type=None, order_id=None):
    url = f"{AGS_API_URL}/cron-scan-logs/"
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': f'Bearer {AGS_API_TOKEN}',
    }
    payload = f"certificate_id={certificate_id}&orientation={orientation}&status={status}"
    if image_type:
        payload += f"&image_type={image_type}"
    if order_id:
        payload += f"&order_id={order_id}"
    response = requests.request("POST", url, headers=headers, data=payload)

def scan_one_side(cert_id, orientation):
    try:
        order_id, certificate_id, result = get_grade_parameters(cert_id=cert_id, orientation=orientation)
        if result is None:
            return True
    except Exception as e:
        post_cron_scan_logs(
            certificate_id=cert_id,
            orientation=orientation,
            status='cvat-missing'
        )
        return
    try:
        filename = result.get("payload").get("filename")
        payload = json.dumps(result.get("payload"))
        orientation = result.get("orientation")
        image_type = result.get("image_type")
        image_path = result.get("image_path")
        post_cron_scan_logs(
            certificate_id=certificate_id,
            orientation=orientation,
            status='in-progress',
            image_type=image_type,
            order_id=order_id
        )
        post_cvat_to_grade(
            filename=filename, 
            payload=payload, 
            orientation=orientation, 
            certificate_id=certificate_id,
            image_type=image_type,
            image_path=image_path
        )
        post_cron_scan_logs(
            certificate_id=certificate_id,
            orientation=orientation,
            status='completed',
            image_type=image_type,
            order_id=order_id
        )
    except Exception as e:
        post_cron_scan_logs(
            certificate_id=certificate_id,
            orientation=orientation,
            status='error',
            image_type=image_type,
            order_id=order_id
        )

daily_scan_amount, front_missing_list, back_missing_list = get_missing_scans()
front_not_completed = 0
back_not_completed = 0
for i in range(daily_scan_amount + front_not_completed):
    if i < len(front_missing_list):
        skip = scan_one_side(cert_id=front_missing_list[i], orientation='front')
        if skip == True:
            front_not_completed += 1

for i in range(daily_scan_amount + back_not_completed):
    if i < len(back_missing_list):
        skip = scan_one_side(cert_id=back_missing_list[i], orientation='back')
        if skip == True:
            back_not_completed += 1