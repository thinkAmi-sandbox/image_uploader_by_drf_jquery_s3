import factory

from api.models import Picture, Memo


class MemoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Memo

    title = factory.Faker('word')
    content = factory.Faker('sentence', locale='ja_JP')


class PictureFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Picture

    memo = factory.SubFactory(MemoFactory)
    name = factory.Faker('word')
    file = factory.django.ImageField(color='blue')
