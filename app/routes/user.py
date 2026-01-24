from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from app.database.db import get_db_conn
from app.schemas.schemas import UserSignup, UserSignin, ChangePwd
from app.models.user import get_user, create_user, update_user_password
from app.utils.password import hash_pwd, verify_pwd
from app.utils.jwt import create_access_token, verify_token
from pydantic import ValidationError

router = APIRouter(prefix="/api/user")  # prefix 路由前綴

@router.post("")
async def signup(user: UserSignup, db=Depends(get_db_conn)):
	conn, cursor = db
	try:
		existing_user = get_user(conn, cursor, user.email)
		if existing_user:
			return JSONResponse(
				status_code=400,
				content={
					"error": True,
					"message": "此 Email 已被註冊"
				}
			)

		create_user(conn, cursor, user.name, user.email, hash_pwd(user.password))

		return {"ok": True}
	
	except ValidationError as e:
		return JSONResponse(
			status_code=400,
			content={
				"error": True,
				"message": "輸入資料格式不正確"
			}
		)

	except Exception as e:
		print(f"Error: {str(e)}")
		return JSONResponse(
			status_code=500,
			content={
				"error": True,
				"message": "伺服器錯誤"
			}
		)

@router.put("/auth")
async def signin(user: UserSignin, db=Depends(get_db_conn)):
	conn, cursor = db
	try:
		existing_user = get_user(conn, cursor, user.email)
		if not existing_user or not verify_pwd(user.password, existing_user['password']):
			return JSONResponse(
				status_code=400,
				content={
					"error": True,
					"message": "電子郵件或密碼錯誤"
				}
			)

		token = create_access_token(existing_user)
		return {"token": token}

	except ValidationError as e:
		return JSONResponse(
			status_code=400,
			content={
				"error": True,
				"message": "輸入資料格式不正確"
			}
		)

	except Exception as e:
		print(f"Error: {str(e)}")
		return JSONResponse(
			status_code=500,
			content={
				"error": True,
				"message": "伺服器錯誤"
			}
		) 

@router.get("/auth")
async def get_current_user(request: Request, db=Depends(get_db_conn)):
	conn, cursor = db
	try:
		auth_header = request.headers.get("Authorization")
		
		if not auth_header or not auth_header.startswith("Bearer "):
			return {"data": None}

		token = auth_header.split(" ")[1]

		try:
			payload = verify_token(token)
		except HTTPException:
			return {"data": None}
		
		user = get_user(conn, cursor, payload['email'])
		if not user:
			return {"data": None}

		return {
			"data":{
				"id": user['id'],
				"name": user['name'],
				"email": user['email']
			}
		}

	except Exception as e:
		print(f"Error: {str(e)}")
		return {"data": None}

@router.patch("/password")
async def change_password(
	request: Request,
	password_data: ChangePwd,
	db=Depends(get_db_conn)
):
	conn, cursor = db
	try:
		auth_header = request.headers.get("Authorization")

		if not auth_header or not auth_header.startswith("Bearer "):
			return JSONResponse(
				status_code=401,
				content={
					"error": True,
					"message": "未授權，請先登入"
				}
			)

		token = auth_header.split(" ")[1]

		try:
			payload = verify_token(token)
		except HTTPException:
			return JSONResponse(
				status_code=401,
				content={
					"error": True,
					"message": "Token 無效或過期"
				}
			)
		
		# 取得當前使用者
		user = get_user(conn, cursor, payload["email"])
		if not user:
			return JSONResponse(
				status_code=404,
				content={
					"error": True,
					"message": "使用者不存在"
				}
			)
		
		# 驗證當前密碼
		if not verify_pwd(password_data.currentPwd, user["password"]):
			return JSONResponse(
				status_code=403,
				content={
					"error": True,
					"message": "當前密碼輸入錯誤"
				}
			)
		
		# 檢查新密碼長度
		if len(password_data.newPwd) < 6:
			return JSONResponse(
				status_code=400,
				content={
					"error": True,
					"message": "新密碼長度至少需要 6 個字元"
				}
			)

		# 檢查新舊密碼是否相同
		if verify_pwd(password_data.newPwd, user["password"]):
			return JSONResponse(
				status_code=400,
				content={
					"error": True,
					"message": "新密碼不能與當前密碼相同"
				}
			)
		
		# 更新密碼
		hashed_new_password = hash_pwd(password_data.newPwd)
		update_user_password(conn, cursor, user["id"], hashed_new_password)

		return {
			"ok": True,
			"message": "密碼變更成功"
		}

	except ValidationError as e:
		return JSONResponse(
			status_code=400,
			content={
				"error": True,
				"message": "輸入資料格式不正確"
			}
		)

	except Exception as e:
		print(f"Error: {str(e)}")
		return JSONResponse(
			status_code=500,
			content={
				"error": True,
				"message": "伺服器錯誤"
			}
		)	