from django.db import models


class Memo(models.Model):
    title = models.CharField('タイトル', max_length=30)
    content = models.TextField('内容', default='')


class Picture(models.Model):
    memo = models.ForeignKey('api.Memo',
                             on_delete=models.CASCADE,
                             related_name='pictures')
    file = models.ImageField()
    name = models.CharField('ファイル名', max_length=250, default='example.png')
