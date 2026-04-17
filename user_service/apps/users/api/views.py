from rest_framework import status, viewsets, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

# Import Models
from ..models import Staff, ShippingAddress

# Import Services & Selectors
from ..services import (
    user_create_customer, 
    user_update_profile, 
    staff_create, 
    staff_update_by_admin, 
    staff_delete,
    generate_tokens_for_user
)
from ..selectors import get_user_profile, staff_list

# Import Serializers
from .serializers import (
    CustomerRegisterSerializer, 
    LoginSerializer, 
    UserSerializer, 
    StaffSerializer,
    CustomerUpdateSerializer,
    ShippingAddressSerializer
)

class BaseRoleLoginApi(APIView):
    permission_classes = [permissions.AllowAny]
    allowed_roles = None  # Override in subclass

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
        if self.allowed_roles and user.role not in self.allowed_roles:
            return Response({"error": "Bạn không có quyền đăng nhập hệ thống này."}, status=status.HTTP_403_FORBIDDEN)
        tokens = generate_tokens_for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            **tokens
        }, status=status.HTTP_200_OK)

class LoginCustomerApi(BaseRoleLoginApi):
    allowed_roles = ["customer"]

class LoginStaffApi(BaseRoleLoginApi):
    allowed_roles = ["staff"]

class LoginAdminApi(BaseRoleLoginApi):
    allowed_roles = ["admin"]

class RegisterCustomerApi(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CustomerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = user_create_customer(**serializer.validated_data)
        tokens = generate_tokens_for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            **tokens
        }, status=status.HTTP_201_CREATED)

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

# --- Base Profile View ---
class BaseProfileApi(APIView):
    permission_classes = [permissions.IsAuthenticated]
    allowed_role = None      # Override in subclass
    serializer_class = None  # Override in subclass

    def get(self, request):
        if self.allowed_role and request.user.role != self.allowed_role:
            return Response({"error": "Không có quyền truy cập"}, status=403)
        data = get_user_profile(user=request.user)
        return Response(data)

    def put(self, request):
        if self.allowed_role and request.user.role != self.allowed_role:
            return Response({"error": "Không có quyền truy cập"}, status=403)
        serializer = self.serializer_class(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if self.allowed_role == "customer":
            user = user_update_profile(user=request.user, data=serializer.validated_data)
            return Response(UserSerializer(user).data)
        elif self.allowed_role == "staff":
            staff = request.user.staff
            for attr, value in serializer.validated_data.items():
                if value is not None:
                    setattr(staff, attr, value)
            staff.save()
            return Response(StaffSerializer(staff).data)
        elif self.allowed_role == "admin":
            user = request.user
            for attr, value in serializer.validated_data.items():
                if value is not None:
                    setattr(user, attr, value)
            user.save()
            return Response(UserSerializer(user).data)
        else:
            return Response({"error": "Không hỗ trợ cập nhật cho loại tài khoản này."}, status=400)

class CustomerProfileApi(BaseProfileApi):
    allowed_role = "customer"
    serializer_class = CustomerUpdateSerializer

class StaffProfileApi(BaseProfileApi):
    allowed_role = "staff"
    serializer_class = StaffSerializer

class AdminProfileApi(BaseProfileApi):
    allowed_role = "admin"
    serializer_class = UserSerializer

class ShippingAddressListCreateApi(generics.ListCreateAPIView):
    serializer_class = ShippingAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'customer':
            return ShippingAddress.objects.filter(customer__id=self.request.user.id)
        return ShippingAddress.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'customer':
            serializer.save(customer=self.request.user.customer)
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Chỉ tài khoản Customer mới có thể lưu địa chỉ giao hàng.")

class ShippingAddressDeleteApi(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = ShippingAddress.objects.all()
    lookup_field = 'pk'

    def delete(self, request, *args, **kwargs):
        address = self.get_object()
        if request.user.role != 'customer' or address.customer != request.user.customer:
            return Response({"error": "Không có quyền xoá địa chỉ này."}, status=status.HTTP_403_FORBIDDEN)
        address.delete()
        return Response({"message": "Đã xoá địa chỉ thành công."}, status=status.HTTP_204_NO_CONTENT)

class StaffViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    def list(self, request):
        queryset = staff_list()
        serializer = StaffSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = StaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        staff = staff_create(**serializer.validated_data)
        return Response(StaffSerializer(staff).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        try:
            staff = Staff.objects.get(pk=pk)
            return Response(StaffSerializer(staff).data)
        except Staff.DoesNotExist:
            return Response({"error": "Không tìm thấy nhân viên"}, status=status.HTTP_404_NOT_FOUND)

    def update(self, request, pk=None):
        serializer = StaffSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        staff = staff_update_by_admin(staff_id=pk, data=serializer.validated_data)
        return Response(StaffSerializer(staff).data)

    def destroy(self, request, pk=None):
        staff_delete(staff_id=pk)
        return Response({"message": "Đã xóa nhân viên"}, status=status.HTTP_204_NO_CONTENT)