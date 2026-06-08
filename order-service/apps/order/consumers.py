import json
import os
import threading
import time

import pika

from .services import handle_payment_failed_event, handle_payment_success_event

_consumer_started = False
_consumer_lock = threading.Lock()


def _handle_payment_event(body: bytes) -> None:
    payload = json.loads(body.decode("utf-8") if isinstance(body, (bytes, bytearray)) else body)
    event_name = str(payload.get("event", "")).strip()
    if event_name == "PaymentSuccessEvent":
        handle_payment_success_event(payload)
    elif event_name == "PaymentFailedEvent":
        handle_payment_failed_event(payload)


def _consume_payment_events() -> None:
    while True:
        connection = None
        try:
            connection = pika.BlockingConnection(pika.ConnectionParameters("rabbitmq"))
            channel = connection.channel()
            channel.exchange_declare(exchange="payment_events", exchange_type="fanout", durable=True)
            queue_result = channel.queue_declare(queue="", exclusive=True)
            queue_name = queue_result.method.queue
            channel.queue_bind(exchange="payment_events", queue=queue_name)

            def on_message(ch, method, properties, body):
                try:
                    _handle_payment_event(body)
                except Exception as exc:
                    print(f"[OrderConsumer] Failed to handle payment event: {exc}")
                finally:
                    ch.basic_ack(delivery_tag=method.delivery_tag)

            channel.basic_consume(queue=queue_name, on_message_callback=on_message, auto_ack=False)
            print("[OrderConsumer] Listening for payment events...")
            channel.start_consuming()
        except Exception as exc:
            print(f"[OrderConsumer] RabbitMQ consumer error: {exc}")
            time.sleep(5)
        finally:
            try:
                if connection and not connection.is_closed:
                    connection.close()
            except Exception:
                pass


def start_payment_event_consumer() -> None:
    global _consumer_started
    if os.environ.get("ENABLE_ORDER_PAYMENT_CONSUMER", "true").lower() != "true":
        return

    with _consumer_lock:
        if _consumer_started:
            return
        _consumer_started = True
        thread = threading.Thread(target=_consume_payment_events, name="order-payment-consumer", daemon=True)
        thread.start()
