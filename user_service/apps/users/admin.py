from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Admin, Staff, Customer, ShippingAddress

# Manager for ShippingAddress in Admin
class ShippingAddressInline(admin.TabularInline):
    model = ShippingAddress
    extra = 1 
    fields = ('address',)

# Configuration for User (base class)
@admin.register(User)
class BaseUserAdmin(UserAdmin):
    
    list_display = ('username', 'email', 'full_name', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    
    # Grouping fields in the edit form
    fieldsets = UserAdmin.fieldsets + (
        ('Thông tin định danh bổ sung', {
            'fields': ('full_name', 'phone_number', 'date_of_birth', 'gender', 'avatar_url', 'role')
        }),
    )
    
    # Fields in the add form
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Thông tin cơ bản', {
            'fields': ('full_name', 'role', 'email')
        }),
    )

# Configuration for Admin (subclass)
@admin.register(Admin)
class CustomAdminAdmin(admin.ModelAdmin):
    list_display = ('username', 'full_name', 'position')
    search_fields = ('username', 'full_name', 'position')
    # Ở đây Django sẽ cho phép chỉnh sửa cả các trường từ lớp User

# Configuration for Staff (subclass)
@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ('username', 'full_name', 'employment_type')
    list_filter = ('employment_type',)
    search_fields = ('username', 'full_name')

# Configuration for Customer (subclass)
@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('username', 'full_name', 'height', 'weight', 'foot_length')
    search_fields = ('username', 'full_name')
    
    # Embed ShippingAddress management within Customer admin
    inlines = [ShippingAddressInline]
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Thông tin cá nhân', {'fields': ('full_name', 'email', 'phone_number')}),
        ('Số đo cơ thể', {
            'fields': ('height', 'weight', 'foot_length'),
            'description': "Thông tin số đo dùng để gợi ý kích thước sản phẩm"
        }),
        ('Trạng thái', {'fields': ('is_active', 'role')}),
    )

# Can also register ShippingAddress separately if needed
@admin.register(ShippingAddress)
class ShippingAddressAdmin(admin.ModelAdmin):
    list_display = ('id', 'address', 'customer')
    search_fields = ('address', 'customer__username')