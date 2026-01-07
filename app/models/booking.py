import json

def get_booking_by_user(conn, cursor, user_id: int):
    query = """
        SELECT
            b.booking_date,
            b.booking_time,
            b.price,
            a.id AS attraction_id,
            a.name,
            a.address,
            a.images
        FROM booking AS b
        JOIN attractions AS a
        ON b.attraction_id = a.id
        WHERE b.user_id = %s
    """
    cursor.execute(query,(user_id,))
    row = cursor.fetchone()

    if not row:
        return None

    try:
        images = json.loads(row["images"])
        row["image"] = images[0] if images else None
    except:
        row["image"] = None

    row.pop("images", None)

    return row

def create_or_update_booking(conn, cursor, user_id: int, data):
    query="""
        INSERT INTO booking (user_id, attraction_id, booking_date, booking_time, price)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            attraction_id = VALUES(attraction_id),
            booking_date = VALUES(booking_date),
            booking_time = VALUES(booking_time),
            price = VALUES(price)
    """
    cursor.execute(query, (user_id, data.attractionId, data.date, data.time, data.price))
    conn.commit()

def delete_booking_by_user(conn, cursor, user_id: int):
    query = "DELETE FROM booking WHERE user_id = %s"
    cursor.execute(query, (user_id,))
    conn.commit()