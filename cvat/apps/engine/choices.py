CARD_ORIENTATION_FRONT = 'front'
CARD_ORIENTATION_BACK = 'back'

CARD_ORIENTATION_CHOICES = (
    (CARD_ORIENTATION_FRONT, 'Front'),
    (CARD_ORIENTATION_BACK, 'Back')
)

LASER = 'laser'
CAM = 'cam'

CARD_IMAGE_TYPE_CHOICES = (
    (LASER, 'Laser'),
    (CAM, 'Cam')
)

COMPLETED = 'completed'
PENDING = 'annotation'

TASK_STATUS_CHOICES = (
    (COMPLETED, 'Completed'),
    (PENDING, 'Pending')
)