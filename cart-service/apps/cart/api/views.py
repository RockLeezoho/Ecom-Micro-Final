from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.cart.models import Cart, CartItem
from apps.cart.api.serializers import (
    CartSerializer, AddCartItemSerializer, UpdateCartItemSerializer, RemoveCartItemSerializer
)
from django.db import transaction
from django.shortcuts import get_object_or_404
from apps.cart.authentication import InternalServiceAuthentication, JWTBearerAuthentication

class CartView(APIView):
    authentication_classes = [InternalServiceAuthentication, JWTBearerAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user_id=request.user.id)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

class AddCartItemView(APIView):
    authentication_classes = [InternalServiceAuthentication, JWTBearerAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart, _ = Cart.objects.get_or_create(user_id=request.user.id)
        data = serializer.validated_data
        item, created = CartItem.objects.get_or_create(
            cart=cart, product_id=data['product_id'],
            defaults={'sales_price': data['sales_price'], 'quantity': data['quantity']}
        )
        if not created:
            item.quantity += data['quantity']
            item.sales_price = data['sales_price']
            item.save()
        return Response({'detail': 'Added to cart.'}, status=status.HTTP_201_CREATED)

class UpdateCartItemView(APIView):
    authentication_classes = [InternalServiceAuthentication, JWTBearerAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def patch(self, request):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_object_or_404(Cart, user_id=request.user.id)
        try:
            item = CartItem.objects.get(cart=cart, product_id=serializer.validated_data['product_id'])
            item.quantity = serializer.validated_data['quantity']
            item.save()
            return Response({'detail': 'Cart item updated.'})
        except CartItem.DoesNotExist:
            return Response({'detail': 'Item not found in cart.'}, status=status.HTTP_404_NOT_FOUND)

class RemoveCartItemView(APIView):
    authentication_classes = [InternalServiceAuthentication, JWTBearerAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def delete(self, request):
        serializer = RemoveCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_object_or_404(Cart, user_id=request.user.id)
        deleted, _ = CartItem.objects.filter(cart=cart, product_id__in=serializer.validated_data['product_ids']).delete()
        return Response({'detail': f'Removed {deleted} item(s) from cart.'})
