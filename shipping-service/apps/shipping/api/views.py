from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.shipping.models import Carrier, ShippingMethod
from .serializers import CarrierSerializer, ShippingMethodSerializer


def _carrier_fee(code: str) -> str:
    value = str(code or "").lower()
    if value == "ghn":
        return "35000.00"
    if value == "ghtk":
        return "25000.00"
    if value == "viettelpost":
        return "30000.00"
    return "20000.00"


class CarrierListAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        carriers = Carrier.objects.filter(is_active=True).order_by("name")
        payload = [
            {
                "code": carrier.code,
                "name": carrier.name,
                "contact_number": carrier.contact_number,
                "fee": _carrier_fee(carrier.code),
            }
            for carrier in carriers
        ]
        serializer = CarrierSerializer(payload, many=True)
        return Response(serializer.data)

class ShippingMethodListAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        methods = ShippingMethod.objects.filter(is_active=True).order_by("sort_order", "name")
        serializer = ShippingMethodSerializer(methods, many=True)
        return Response(serializer.data)
