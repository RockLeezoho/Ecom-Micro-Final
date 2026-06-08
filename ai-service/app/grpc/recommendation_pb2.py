from __future__ import annotations

from google.protobuf import descriptor_pb2, descriptor_pool, message_factory


_FILE_NAME = "recommendation.proto"
_PACKAGE = "recommendation"
_POOL = descriptor_pool.Default()


def _build_file_descriptor():
    file_proto = descriptor_pb2.FileDescriptorProto()
    file_proto.name = _FILE_NAME
    file_proto.package = _PACKAGE
    file_proto.syntax = "proto3"

    request_msg = file_proto.message_type.add()
    request_msg.name = "RecommendedProductsRequest"
    field = request_msg.field.add()
    field.name = "category_id"
    field.number = 1
    field.label = descriptor_pb2.FieldDescriptorProto.LABEL_OPTIONAL
    field.type = descriptor_pb2.FieldDescriptorProto.TYPE_STRING

    response_msg = file_proto.message_type.add()
    response_msg.name = "RecommendedProductsResponse"
    field = response_msg.field.add()
    field.name = "product_ids"
    field.number = 1
    field.label = descriptor_pb2.FieldDescriptorProto.LABEL_REPEATED
    field.type = descriptor_pb2.FieldDescriptorProto.TYPE_STRING

    related_request_msg = file_proto.message_type.add()
    related_request_msg.name = "RelatedProductsRequest"
    field = related_request_msg.field.add()
    field.name = "product_id"
    field.number = 1
    field.label = descriptor_pb2.FieldDescriptorProto.LABEL_OPTIONAL
    field.type = descriptor_pb2.FieldDescriptorProto.TYPE_STRING

    related_response_msg = file_proto.message_type.add()
    related_response_msg.name = "RelatedProductsResponse"
    field = related_response_msg.field.add()
    field.name = "product_ids"
    field.number = 1
    field.label = descriptor_pb2.FieldDescriptorProto.LABEL_REPEATED
    field.type = descriptor_pb2.FieldDescriptorProto.TYPE_STRING

    try:
        return _POOL.Add(file_proto)
    except Exception:
        return _POOL.FindFileByName(_FILE_NAME)


DESCRIPTOR = _build_file_descriptor()


def _get_message_class(message_name: str):
    descriptor = _POOL.FindMessageTypeByName(f"{_PACKAGE}.{message_name}")
    if hasattr(message_factory, "GetMessageClass"):
        return message_factory.GetMessageClass(descriptor)
    return message_factory.MessageFactory(_POOL).GetPrototype(descriptor)


RecommendedProductsRequest = _get_message_class("RecommendedProductsRequest")
RecommendedProductsResponse = _get_message_class("RecommendedProductsResponse")
RelatedProductsRequest = _get_message_class("RelatedProductsRequest")
RelatedProductsResponse = _get_message_class("RelatedProductsResponse")