from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import Customer


class RegisterApiTests(APITestCase):
    def test_register_success(self):
        payload = {
            "username": "new_user",
            "email": "new_user@example.com",
            "password": "SecurePass123!",
            "phone_number": "0123456789",
            "first_name": "New",
            "last_name": "User",
        }

        resp = self.client.post(reverse("register-customer"), payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data.get("status"), "success")
        data = resp.data.get("data") or {}
        self.assertIn("customer", data)
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        # verify customer created in DB
        self.assertTrue(Customer.objects.filter(username="new_user").exists())

    def test_register_conflict_on_existing_username_and_email(self):
        # create existing user
        Customer.objects.create_user(
            username="existing",
            email="exist@example.com",
            password="Password123!",
            phone_number="0999999999",
        )

        # Attempt register with same username
        payload_username = {
            "username": "existing",
            "email": "newemail@example.com",
            "password": "SecurePass123!",
            "phone_number": "0123456789",
        }
        resp_u = self.client.post(reverse("register-customer"), payload_username, format="json")
        self.assertEqual(resp_u.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(resp_u.data.get("status"), "failure")
        self.assertIsNotNone(resp_u.data.get("errors"))

        # Attempt register with same email
        payload_email = {
            "username": "another",
            "email": "exist@example.com",
            "password": "SecurePass123!",
            "phone_number": "0123456789",
        }
        resp_e = self.client.post(reverse("register-customer"), payload_email, format="json")
        self.assertEqual(resp_e.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(resp_e.data.get("status"), "failure")
        self.assertIsNotNone(resp_e.data.get("errors"))
