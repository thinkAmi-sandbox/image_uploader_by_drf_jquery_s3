from .base import *
import environ

env = environ.Env()
env.read_env(os.path.join(BASE_DIR, '.env'))

AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY')

# CSS・JSなどの静的ファイルをS3バケットに置く設定
# 動作確認前にcollectstaticをする
STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME')
AWS_DEFAULT_ACL = None

# アップロードしたファイルを、静的ファイルとは別のS3バケットに置く設定
DEFAULT_FILE_STORAGE = 'config.storage_backend.S3MediaStorage'
MEDIA_AWS_STORAGE_BUCKET_NAME = env('MEDIA_AWS_STORAGE_BUCKET_NAME')
MEDIA_AWS_DEFAULT_ACL = None
