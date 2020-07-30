from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from api.models import Memo
from api.serializers import MemoSerializer


class MemoViewSet(viewsets.ModelViewSet):
    queryset = Memo.objects.all()
    serializer_class = MemoSerializer
    parser_classes = (MultiPartParser, FormParser,)

    @action(detail=False, methods=['get'])
    def latest(self, request):
        query_set = self.get_queryset()
        if not query_set:
            return Response(status=status.HTTP_404_NOT_FOUND)

        query_set = query_set.latest('pk')
        serializer = MemoSerializer(query_set, many=False)
        return Response(serializer.data)
