from http import HTTPStatus

import boto3
import pytest
from django.conf import settings
from django.test import override_settings
from django.urls import reverse
from moto import mock_s3
from rest_framework.test import APIClient

from api.tests.factories import PictureFactory


@pytest.mark.django_db
class TestMemoViewSet:
    """ 説明のために@override_settingsで設定を上書きしているが、
        テスト用settingsを作った方が良い
    """

    # 設定を上書きして、インメモリなストレージに差し替える
    @override_settings(DEFAULT_FILE_STORAGE='inmemorystorage.InMemoryStorage')
    def test_成功_GET_インメモリなストレージに差し替え(self):
        PictureFactory()  # この時点でフェイクファイルが作られる
        url = reverse('api:memo-list')
        actual = APIClient().get(url)

        assert actual.status_code == HTTPStatus.OK

    # motoのS3に差し替える
    @mock_s3
    def test_成功_GET_motoに差し替える(self):
        # motoを使う場合、事前にバケットを作成しないとエラーになるので注意
        # botocore.errorfactory.NoSuchBucket:
        # An error occurred (NoSuchBucket) when calling the PutObject operation:
        # The specified bucket does not exist
        s3_client = boto3.client('s3')
        s3_client.create_bucket(Bucket=settings.MEDIA_AWS_STORAGE_BUCKET_NAME)

        PictureFactory()
        url = reverse('api:memo-list')
        actual = APIClient().get(url)

        assert actual.status_code == HTTPStatus.OK

    @pytest.mark.skip(reason='実行するとS3にファイルが置かれるのでひとまずskip')
    def test_成功_GET_差し替え無し(self):
        PictureFactory()
        url = reverse('api:memo-list')
        actual = APIClient().get(url)

        assert actual.status_code == HTTPStatus.OK
