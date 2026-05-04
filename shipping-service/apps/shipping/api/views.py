from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import ShippingMethodSerializer

class ShippingMethodListAPIView(APIView):
    def get(self, request):
        # Static/mock data, replace with DB/model if needed
        methods = [
            {"code": "ghn", "name": "Giao hàng nhanh (GHN)", "fee": "35000.00"},
            {"code": "ghtk", "name": "Giao hàng tiết kiệm (GHTK)", "fee": "25000.00"},
            {"code": "viettelpost", "name": "Viettel Post", "fee": "30000.00"},
            {"code": "vnpost", "name": "VNPost", "fee": "20000.00"},
        ]
        serializer = ShippingMethodSerializer(methods, many=True)
        return Response(serializer.data)
