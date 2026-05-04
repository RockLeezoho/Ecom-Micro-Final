from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import Address, FavoriteProduct
from ..exceptions import ConflictError

from ..services import (
    customer_update_profile,
    generate_tokens_for_user,
    user_create_customer,
)
from ..selectors import get_user_profile

from .serializers import (
    AddressSerializer,
    FavoriteProductCreateSerializer,
    FavoriteProductSerializer,
    CustomerRegisterSerializer,
    CustomerUpdateSerializer,
    LoginSerializer,
    UserSerializer,
)

class LoginCustomerApi(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )
        if not user:
            return Response(
                {"error": "Tên đăng nhập hoặc mật khẩu không đúng"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        if not user.is_active:
            return Response({"error": "Tài khoản đã bị khóa"}, status=status.HTTP_403_FORBIDDEN)
        if user.role != "customer":
            return Response({"error": "Bạn không có quyền đăng nhập hệ thống này."}, status=status.HTTP_403_FORBIDDEN)
        tokens = generate_tokens_for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            **tokens
        }, status=status.HTTP_200_OK)

class RegisterCustomerApi(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            serializer = CustomerRegisterSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = user_create_customer(**serializer.validated_data)
            tokens = generate_tokens_for_user(user)
            return Response({
                "status": "success",
                "message": "Đăng ký thành công",
                "data": {
                    "customer": {"id": str(user.id), "username": user.username},
                    "access_token": tokens.get('access'),
                    "refresh_token": tokens.get('refresh'),
                },
                "errors": None,
            }, status=status.HTTP_201_CREATED)
        except ConflictError as exc:
            return Response({
                "status": "failure",
                "code": status.HTTP_409_CONFLICT,
                "message": "Tên đăng nhập hoặc email đã tồn tại.",
                "data": None,
                "errors": exc.detail,
            }, status=status.HTTP_409_CONFLICT)
        except DRFValidationError as exc:
            return Response({
                "status": "failure",
                "code": status.HTTP_400_BAD_REQUEST,
                "message": "Dữ liệu đăng ký không hợp lệ.",
                "data": None,
                "errors": exc.detail,
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({
                "status": "failure",
                "code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "message": "Lỗi hệ thống khi xử lý đăng ký.",
                "data": None,
                "errors": None,
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LogoutApi(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Đăng xuất thành công"}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Token không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)

class BaseProfileApi(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = None

    def get(self, request):
        if request.user.role != "customer":
            return Response({"error": "Không có quyền truy cập"}, status=403)
        data = get_user_profile(user=request.user)
        return Response(data)

    def put(self, request):
        if request.user.role != "customer":
            return Response({"error": "Không có quyền truy cập"}, status=403)
        data = request.data.copy()
        avatar_file = request.FILES.get('avatar')
        if avatar_file:
            from apps.users.utils.cloudinary_upload import upload_avatar_to_cloudinary
            avatar_url = upload_avatar_to_cloudinary(avatar_file, folder=f"avatars/{request.user.id}")
            data['avatar_url'] = avatar_url
        serializer = self.serializer_class(data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = customer_update_profile(user=request.user, data=serializer.validated_data)

        user.refresh_from_db()
        return Response(CustomerUpdateSerializer(user.customer).data)

class CustomerProfileApi(BaseProfileApi):
    serializer_class = CustomerUpdateSerializer

class AddressListCreateApi(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'customer':
            return Address.objects.filter(user__id=self.request.user.id)
        return Address.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'customer':
            serializer.save(user=self.request.user)
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Chỉ tài khoản khách hàng mới có thể lưu địa chỉ giao hàng.")

class AddressDeleteApi(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Address.objects.all()
    lookup_field = 'pk'

    def delete(self, request, *args, **kwargs):
        try:
            address = self.get_object()
            if request.user.role != 'customer' or address.user_id != request.user.id:
                return Response({"error": "Không có quyền xoá địa chỉ này."}, status=status.HTTP_403_FORBIDDEN)
            address.delete()
            return Response({"message": "Đã xoá địa chỉ thành công."}, status=status.HTTP_204_NO_CONTENT)
        except (DjangoValidationError, DRFValidationError, Address.DoesNotExist):
            return Response({"error": "Không tìm thấy đối tượng"}, status=status.HTTP_404_NOT_FOUND)


class FavoriteProductListCreateApi(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return FavoriteProductCreateSerializer
        return FavoriteProductSerializer

    def get_queryset(self):
        if self.request.user.role == "customer":
            return FavoriteProduct.objects.filter(customer_id=self.request.user.id).order_by("-created_at")
        return FavoriteProduct.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = FavoriteProductSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        if request.user.role != "customer":
            return Response({"error": "Chỉ khách hàng có thể thêm yêu thích."}, status=status.HTTP_403_FORBIDDEN)

        serializer = FavoriteProductCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        favorite, _ = FavoriteProduct.objects.get_or_create(
            customer_id=request.user.id, product_id=serializer.validated_data["product_id"]
        )
        return Response(FavoriteProductSerializer(favorite).data, status=status.HTTP_201_CREATED)


class FavoriteProductDeleteApi(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = FavoriteProduct.objects.all()
    lookup_field = "product_id"

    def get_object(self):
        return FavoriteProduct.objects.get(customer_id=self.request.user.id, product_id=self.kwargs["product_id"])

    def delete(self, request, *args, **kwargs):
        try:
            favorite = self.get_object()
            favorite.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except FavoriteProduct.DoesNotExist:
            return Response({"error": "Không tìm thấy sản phẩm yêu thích."}, status=status.HTTP_404_NOT_FOUND)