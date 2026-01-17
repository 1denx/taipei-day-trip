from fastapi import APIRouter, Depends, Request, HTTPException
from app.database.db import get_db_conn
from app.utils.auth import get_current_user
from app.schemas.schemas import Contact, TripAttraction, Trip, OrderData, CreateOrder
from app.models.order import create_unpaid_order, tappay_payment, get_order_by_number, mark_order_paid, has_unpaid_order
from app.models.booking import delete_booking_by_user

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
