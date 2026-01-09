from fastapi import APIRouter, Depends, Request, HTTPException
from app.models.booking import (
    get_booking_by_user,
    create_or_update_booking,
    delete_booking_by_user
)
from app.utils.auth import get_current_user
from app.schemas.schemas import CreateBooking
from app.database.db import get_db_conn

router = APIRouter(prefix="/api/booking")

@router.post("")
async def create_booking(
    request: Request,
    booking: CreateBooking,
    db=Depends(get_db_conn)
):
    conn, cursor = db
    user = get_current_user(request, db)
    print("POST user id:", user["id"])
    try:
        create_or_update_booking(conn, cursor, user["id"], booking)
        return {"ok": True}
    
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail={
                "error": True,
                "message": "建立預定行程失敗"
            }
        )

@router.get("")
async def get_booking(request: Request, db=Depends(get_db_conn)):
    conn, cursor = db
    
    user = get_current_user(request, db)
    booking = get_booking_by_user(conn, cursor, user["id"])
    print("GET user id:", user["id"])
    if not booking:
        return {"data": None}

    return {
        "data": {
            "attraction": {
                "id": booking["attraction_id"],
                "name": booking["name"],
                "address": booking["address"],
                "image": booking["image"]
            },
            "date": booking["booking_date"].strftime("%Y-%m-%d"),
            "time": booking["booking_time"],
            "price": booking["price"]
        }
    }
    

@router.delete("")
async def delete_booking(
    request: Request,
    db=Depends(get_db_conn)
):
    conn, cursor = db
    user = get_current_user(request, db)

    delete_booking_by_user(conn, cursor, user["id"])
    return {"ok": True}