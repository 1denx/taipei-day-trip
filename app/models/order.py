import os
import json
import requests
from datetime import datetime
from app.schemas.schemas import CreateOrder
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

TAPPAY_PARTNER_KEY=os.getenv("TAPPAY_PARTNER_KEY")
TAPPAY_MERCHANT_ID=os.getenv("TAPPAY_MERCHANT_ID")

def create_unpaid_order(conn, cursor, user_id: int, data: CreateOrder):
    order_number = datetime.now().strftime("%Y%m%d%H%M%S")

    query = """
        INSERT INTO orders(
            order_number,
            user_id,
            attraction_id,
            booking_date,
            booking_time,
            price,
            contact_name,
            contact_email,
            contact_phone,
            status,
            payment_message
        )
        VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    cursor.execute(query, (
        order_number,
        user_id,
        data.order.trip.attraction.id,
        data.order.trip.date,
        data.order.trip.time,
        data.order.price,
        data.order.contact.name,
        data.order.contact.email,
        data.order.contact.phone,
        2,
        "尚未付款"
    ))

    conn.commit()
    return order_number

def tappay_payment(prime: str, amount: int, contact):
    tappay_url = "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime"

    headers = {
        "Content-Type": "application/json",
        "x-api-key": TAPPAY_PARTNER_KEY
    }

    tappay_payload = {
        "prime": prime,
        "partner_key": TAPPAY_PARTNER_KEY,
        "merchant_id": TAPPAY_MERCHANT_ID,
        "amount": amount,
        "currency": "TWD",
        "details":"Trip Order",
        "cardholder": {
            "name": contact.name,
            "email": contact.email,
            "phone_number": contact.phone
        },
    }

    res = requests.post(tappay_url, json=tappay_payload, headers=headers, timeout=30)
    result = res.json()

    return result

def get_order_by_number(conn, cursor,user_id: int, order_number: str):
    query = """
         SELECT 
            o.*,
            a.name,
            a.address,
            a.images
        FROM orders o
        JOIN attractions a ON o.attraction_id = a.id
        WHERE o.order_number = %s AND o.user_id = %s
    """
    
    cursor.execute(query, (order_number, user_id))
    row = cursor.fetchone()

    if not row:
        return None

    images = json.loads(row["images"])
    image = images[0] if images else None

    return {
        "number": row["order_number"],
        "price": row["price"],
        "trip": {
            "attraction": {
                "id": row["attraction_id"],
                "name": row["name"],
                "address": row["address"],
                "image": image
            },
            "date": row["booking_date"].strftime("%Y-%m-%d"),
            "time": row["booking_time"]
        },
        "contact": {
            "name": row["contact_name"],
            "email": row["contact_email"],
            "phone": row["contact_phone"]
        },
        "status": row["status"]
    }

def mark_order_paid(conn, cursor, order_number: str, status: int):
    query = "UPDATE orders SET status = %s WHERE order_number = %s"
    cursor.execute(query, (status, order_number))
    conn.commit()

# 防止重複下單
def has_unpaid_order(conn, cursor, user_id: int):
    query = """
        SELECT 1 FROM orders
        WHERE user_id = %s
        AND status = 2
        LIMIT 1
    """

    cursor.execute(query, (user_id,))
    result = cursor.fetchone()

    return result is not None