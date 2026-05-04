from rest_framework import viewsets, filters, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from apps.users.models import User
from apps.users.models import Staff, Customer
from apps.users.selectors import get_user_profile, customer_list, staff_list
from apps.users.utils.cloudinary_upload import upload_avatar_to_cloudinary
from apps.management.permissions import IsAdminRole
from apps.management.services import (
    generate_tokens_for_user,
    user_update_profile,
    staff_create,
    staff_update_by_admin,
    staff_delete,
    customer_create_by_admin,
    customer_update_by_admin,
    customer_delete,
)
from .serializers import (
    LoginSerializer,
    CustomerUpdateSerializer,
    StaffUpdateSerializer,
    AdminUpdateSerializer,
    StaffAdminGetSerializer,
    StaffAdminCreateSerializer,
    StaffAdminUpdateSerializer,
    CustomerAdminGetSerializer,
    CustomerAdminCreateSerializer,
    CustomerAdminUpdateSerializer,
    AdminUserSerializer,
    ManagementLoginUserSerializer,
)


class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin-only user management (list, retrieve, update, delete)."""

    queryset = User.objects.all().order_by('id')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']


class BaseManagementLoginApi(APIView):
    permission_classes = [permissions.AllowAny]
    allowed_roles = None

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )
        if not user:
            return Response(
                {"error": "Tên đăng nhập hoặc mật khẩu không đúng"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response({"error": "Tài khoản đã bị khóa"}, status=status.HTTP_403_FORBIDDEN)
        if self.allowed_roles and user.role not in self.allowed_roles:
            return Response(
                {"error": "Bạn không có quyền đăng nhập hệ thống này."},
                status=status.HTTP_403_FORBIDDEN,
            )

        tokens = generate_tokens_for_user(user)
        return Response(
            {
                "status": "success",
                "data": {
                    "user": ManagementLoginUserSerializer(user).data,
                    "access_token": tokens.get('access'),
                    "refresh_token": tokens.get('refresh'),
                },
            },
            status=status.HTTP_200_OK,
        )


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
    allowed_role = None
    serializer_class = None

    def get(self, request):
        if self.allowed_role and request.user.role != self.allowed_role:
            return Response({"error": "Không có quyền truy cập"}, status=403)
        data = get_user_profile(user=request.user)
        return Response(data)

    def put(self, request):
        if self.allowed_role and request.user.role != self.allowed_role:
            return Response({"error": "Không có quyền truy cập"}, status=403)
        data = request.data.copy()
        avatar_file = request.FILES.get('avatar')
        if avatar_file:
            avatar_url = upload_avatar_to_cloudinary(avatar_file, folder=f"avatars/{request.user.id}")
            data['avatar_url'] = avatar_url
        serializer = self.serializer_class(data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = user_update_profile(user=request.user, data=serializer.validated_data)

        user.refresh_from_db()
        if self.allowed_role == "staff":
            return Response(StaffUpdateSerializer(user.staff).data)
        if self.allowed_role == "admin":
            return Response(AdminUpdateSerializer(user.admin).data)
        return Response({"error": "Không hỗ trợ cập nhật cho tài khoản này."}, status=400)


class StaffProfileApi(BaseProfileApi):
    allowed_role = "staff"
    serializer_class = StaffUpdateSerializer


class AdminProfileApi(BaseProfileApi):
    allowed_role = "admin"
    serializer_class = AdminUpdateSerializer


class StaffViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def list(self, request):
        queryset = staff_list()
        serializer = StaffAdminGetSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        data = request.data.copy()
        avatar_file = request.FILES.get('avatar')
        if avatar_file:
            data['avatar_url'] = upload_avatar_to_cloudinary(avatar_file, folder="avatars/staff")
        serializer = StaffAdminCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        staff = staff_create(**serializer.validated_data)
        return Response(StaffAdminGetSerializer(staff).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        try:
            staff = Staff.objects.get(pk=pk)
            return Response(StaffAdminGetSerializer(staff).data)
        except (Staff.DoesNotExist, DjangoValidationError, DRFValidationError):
            return Response({"error": "Không tìm thấy đối tượng"}, status=status.HTTP_404_NOT_FOUND)

    def update(self, request, pk=None):
        try:
            staff = Staff.objects.get(pk=pk)
            data = request.data.copy()
            avatar_file = request.FILES.get('avatar')
            if avatar_file:
                data['avatar_url'] = upload_avatar_to_cloudinary(avatar_file, folder="avatars/staff")
            serializer = StaffAdminUpdateSerializer(staff, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            staff = staff_update_by_admin(staff_id=pk, data=serializer.validated_data)
            return Response(StaffAdminGetSerializer(staff).data)
        except (Staff.DoesNotExist, DjangoValidationError, DRFValidationError):
            return Response({"error": "Không tìm thấy đối tượng"}, status=status.HTTP_404_NOT_FOUND)

    def destroy(self, request, pk=None):
        try:
            staff_delete(staff_id=pk)
            return Response({"message": "Đã xóa nhân viên"}, status=status.HTTP_204_NO_CONTENT)
        except (Staff.DoesNotExist, DjangoValidationError, DRFValidationError):
            return Response({"error": "Không tìm thấy đối tượng"}, status=status.HTTP_404_NOT_FOUND)


class CustomerViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def list(self, request):
        queryset = customer_list()
        serializer = CustomerAdminGetSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        data = request.data.copy()
        avatar_file = request.FILES.get('avatar')
        if avatar_file:
            data['avatar_url'] = upload_avatar_to_cloudinary(avatar_file, folder="avatars/customer")
        serializer = CustomerAdminCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        customer = customer_create_by_admin(**serializer.validated_data)
        return Response(CustomerAdminGetSerializer(customer).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        try:
            customer = Customer.objects.get(pk=pk)
            return Response(CustomerAdminGetSerializer(customer).data)
        except (Customer.DoesNotExist, DjangoValidationError, DRFValidationError):
            return Response({"error": "Không tìm thấy đối tượng"}, status=status.HTTP_404_NOT_FOUND)

    def update(self, request, pk=None):
        try:
            customer = Customer.objects.get(pk=pk)
            data = request.data.copy()
            avatar_file = request.FILES.get('avatar')
            if avatar_file:
                data['avatar_url'] = upload_avatar_to_cloudinary(avatar_file, folder="avatars/customer")
            serializer = CustomerAdminUpdateSerializer(customer, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            customer = customer_update_by_admin(customer_id=pk, data=serializer.validated_data)
            return Response(CustomerAdminGetSerializer(customer).data)
        except (Customer.DoesNotExist, DjangoValidationError, DRFValidationError):
            return Response({"error": "Không tìm thấy đối tượng"}, status=status.HTTP_404_NOT_FOUND)

    def destroy(self, request, pk=None):
        try:
            customer_delete(customer_id=pk)
            return Response({"message": "Đã xóa khách hàng"}, status=status.HTTP_204_NO_CONTENT)
        except (Customer.DoesNotExist, DjangoValidationError, DRFValidationError):
            return Response({"error": "Không tìm thấy đối tượng"}, status=status.HTTP_404_NOT_FOUND)


class LoginAdminApi(BaseManagementLoginApi):
    allowed_roles = ["admin"]


class LoginStaffApi(BaseManagementLoginApi):
    allowed_roles = ["staff", "admin"]
