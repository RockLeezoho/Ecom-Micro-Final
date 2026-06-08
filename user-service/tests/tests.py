from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import Admin, Customer, Staff


class UserManagementCrudTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = Admin.objects.create_user(
            username="admin01",
            email="admin@example.com",
            password="AdminPass123!",
            role="admin",
            phone_number="0123456789",
            position="System Admin",
        )
        cls.staff = Staff.objects.create_user(
            username="staff01",
            email="staff@example.com",
            password="StaffPass123!",
            role="staff",
            phone_number="0987654321",
            employment_type="Full-time",
        )
        cls.customer = Customer.objects.create_user(
            username="customer01",
            email="customer@example.com",
            password="CustomerPass123!",
            role="customer",
            phone_number="0111111111",
            height=170,
            weight=60,
            foot_length=26,
        )

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        refresh["role"] = (getattr(user, "role", "") or "").lower()
        access = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    def test_admin_can_crud_staff(self):
        self.authenticate(self.admin)

        create_response = self.client.post(
            reverse("staff-management-list"),
            {
                "username": "staff02",
                "email": "staff02@example.com",
                "password": "StaffPass456!",
                "phone_number": "0222222222",
                "first_name": "New",
                "last_name": "Staff",
                "employment_type": "Part-time",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        created_staff_id = create_response.data["id"]

        list_response = self.client.get(reverse("staff-management-list"))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(item["id"] == created_staff_id for item in list_response.data))

        update_response = self.client.put(
            reverse("staff-management-detail", args=[created_staff_id]),
            {
                "first_name": "Updated",
                "phone_number": "0333333333",
                "employment_type": "Full-time",
                "is_active": False,
            },
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["first_name"], "Updated")
        self.assertEqual(update_response.data["employment_type"], "Full-time")
        self.assertFalse(update_response.data["is_active"])

        delete_response = self.client.delete(reverse("staff-management-detail", args=[created_staff_id]))
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Staff.objects.filter(pk=created_staff_id).exists())

    def test_admin_can_crud_customer(self):
        self.authenticate(self.admin)

        create_response = self.client.post(
            reverse("customer-management-list"),
            {
                "username": "customer02",
                "email": "customer02@example.com",
                "password": "CustomerPass456!",
                "phone_number": "0444444444",
                "first_name": "New",
                "last_name": "Customer",
                "height": 165,
                "weight": 55,
                "foot_length": 25,
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        created_customer_id = create_response.data["id"]

        list_response = self.client.get(reverse("customer-management-list"))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(item["id"] == created_customer_id for item in list_response.data))

        update_response = self.client.put(
            reverse("customer-management-detail", args=[created_customer_id]),
            {
                "phone_number": "0555555555",
                "height": 168,
                "weight": 57,
                "is_active": False,
            },
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["height"], 168.0)
        self.assertEqual(update_response.data["weight"], 57.0)
        self.assertFalse(update_response.data["is_active"])

        delete_response = self.client.delete(reverse("customer-management-detail", args=[created_customer_id]))
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Customer.objects.filter(pk=created_customer_id).exists())

    def test_non_admin_tokens_cannot_access_management_endpoints(self):
        for user in (self.staff, self.customer):
            self.authenticate(user)

            staff_response = self.client.get(reverse("staff-management-list"))
            customer_response = self.client.get(reverse("customer-management-list"))

            self.assertEqual(staff_response.status_code, status.HTTP_403_FORBIDDEN)
            self.assertEqual(customer_response.status_code, status.HTTP_403_FORBIDDEN)
