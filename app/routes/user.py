from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from app.database.db import get_db_conn
from app.schemas.schemas import UserSignup, UserSignin
from app.models.user import get_user, create_user
from app.utils.password import hash_pwd, verify_pwd
from app.utils.jwt import create_access_token, verify_token

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