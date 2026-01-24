from fastapi import APIRouter, Depends, Request, HTTPException
from app.database.db import get_db_conn
from app.utils.auth import get_current_user
from app.schemas.schemas import Contact, TripAttraction, Trip, OrderData, CreateOrder
from app.models.order import create_unpaid_order, tappay_payment, get_order_by_number, mark_order_paid, has_unpaid_order, get_order_history
from app.models.booking import delete_booking_by_user
from pydantic import ValidationError
import requests

router = APIRouter()

@router.post("/api/orders")
async def create_order(
    request: Request,
    order: CreateOrder,
    db=Depends(get_db_conn)
):
    conn, cursor = db
    user = get_current_user(request, db)

    if not user:
        raise HTTPException(
            status_code=403, 
            detail={
                "error": True,
                "message": "尚未登入系統"
            }
        )

    if has_unpaid_order(conn, cursor, user["id"]):
        raise HTTPException(
            status_code=400,
            detail={
                "error": True,
                "message": "尚有未完成付款的訂單"
            }
        )

    try:
        # 建立 UNPAID 訂單
        order_number = create_unpaid_order(conn, cursor, user["id"], order)

        # 呼叫 TapPay 付款
        try:
            tappay_result = tappay_payment(
                order.prime,
                order.order.price,
                order.order.contact
            )
            print(f"TapPay 結果: {tappay_result}")
    
        except requests.exceptions.RequestException as e:
            print(f"TapPay API Error: {e}")
            # 更新訂單狀態為付款失敗
            mark_order_paid(conn, cursor, order_number, status=1, message="金流服務異常")

            raise HTTPException(
                status_code=500,
                detail={
                    "error": True,
                    "message": "金流服務異常，請稍後再試"
                }
            )

        # 根據付款結果更新訂單狀態
        if tappay_result["status"] == 0:
            mark_order_paid(conn, cursor, order_number, status=0, message="付款成功")
            payment_status = 0
            payment_message = "付款成功"
            # 付款成功後刪除 booking
            delete_booking_by_user(conn, cursor, user["id"])
        else:
            tappay_message = tappay_result.get("msg", "付款失敗")
            mark_order_paid(conn, cursor, order_number, status=1, message=tappay_message)
            payment_status = 1
            payment_message = tappay_message
        
        conn.commit()

        return {
            "data": {
                "number": order_number,
                "payment": {
                    "status": payment_status,
                    "message": payment_message
                }
            }
        }
    
    except HTTPException:
        raise
    
    except ValidationError as e:
        error_msg = "訂單資料格式不正確"

        for error in e.errors():
            field == error["loc"][-1]  # 錯誤發生的位置
            if field == "email":
                error_msg = "Email 格式不正確"
            elif field == "phone":
                error_msg = "電話號碼格式不正確"
            elif field == "name":
                error_msg = "姓名不可為空"
            elif field == "date":
                if "past" in str(error["msg"]).lower():
                    error_msg = "無法預訂過去的日期"
            elif field == "prime":
                error_msg = "付款資訊不正確"
            break
        
        raise HTTPException(
            status_code=400,
            detail={
                "error": True,
                "message": error_msg
            }
        )

    except ValueError as e:
        print(f"輸入驗證錯誤: {e}")
        raise HTTPException(
            status_code=400,
            detail={
                "error": True,
                "message": "訂單資料格式不正確"
            }
        )
    
    except Exception as e:
        print(f"未預期錯誤: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": True,
                "message": "伺服器內部錯誤"
            }
        )

@router.get("/api/order/{orderNumber}")
async def get_order(
    request: Request,
    orderNumber: str,
    db=Depends(get_db_conn)
):
    conn, cursor = db
    user = get_current_user(request, db)

    if not user:
        raise HTTPException(
            status_code=403,
            detail={
                "error": True,
                "message": "尚未登入系統"
            }
        )
    
    try:
        order = get_order_by_number(conn, cursor, user["id"], orderNumber)

        if not order:
            return {"data": None}

        return {"data": order}
    
    except Exception as e:
        print(f"取得訂單錯誤: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": True,
                "message": "伺服器內部錯誤"
            }
        )

@router.get("/api/orders/history")
async def get_orders_history(
    request: Request,
    db=Depends(get_db_conn)
):
    conn, cursor = db
    user = get_current_user(request, db)

    if not user:
        raise HTTPException(
            status_code=403,
            detail={
                "error": True,
                "message": "尚未登入系統"
            }
        )

    try:
        orders = get_order_history(conn, cursor, user["id"])
        return {"data": orders}

    except Exception as e:
        print(f"取得歷史訂單錯誤: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": True,
                "message": "伺服器內部錯誤"
            }
        )