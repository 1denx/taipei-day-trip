from fastapi import HTTPException, Request, Depends
from app.database.db import get_db_conn
from app.utils.jwt import verify_token
from app.models.user import get_user

def get_current_user(request: Request, db=Depends(get_db_conn)):
    conn, cursor = db
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=403,
            detail={
                "error": True,
                "message": "未登入系統"
            }
        )

    token = auth_header.split(" ")[1]
    payload = verify_token(token)

    user = get_user(conn, cursor, payload["email"])
    if not user:
        raise HTTPException(
            status_code=403,
            detail={
                "error": True,
                "message": "使用者不存在"
            }
        )

    return user