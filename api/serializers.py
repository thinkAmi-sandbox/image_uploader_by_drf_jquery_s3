from rest_framework import serializers

from api.models import Memo, Picture


class PictureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Picture
        fields = '__all__'


class MemoSerializer(serializers.ModelSerializer):
    pictures = PictureSerializer(many=True, read_only=True)

    # ListSerializerと間違えないように注意
    additional_pictures = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False,
    )

    deletable_picture_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False,
    )

    class Meta:
        model = Memo
        fields = '__all__'

    def create(self, validated_data):
        additional_pictures = validated_data.pop('additional_pictures', None)
        memo = Memo.objects.create(**validated_data)
        self._create_pictures(memo, additional_pictures)

        return memo

    def update(self, instance, validated_data):
        deletable_picture_ids = validated_data.pop('deletable_picture_ids', None)
        if deletable_picture_ids:
            Picture.objects.filter(pk__in=deletable_picture_ids).delete()

        additional_pictures = validated_data.pop('additional_pictures', None)
        super().update(instance, validated_data)
        self._create_pictures(instance, additional_pictures)

        return instance

    def _create_pictures(self, memo, additional_files):
        if additional_files is None:
            return

        files = []
        for file in additional_files:
            files.append(
                Picture(memo=memo, file=file, name=file.name),
            )
        if files:
            Picture.objects.bulk_create(files)
