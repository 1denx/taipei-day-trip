from fastapi import APIRouter, Depends, Request, File, UploadFile, HTTPException
from app.database.db import get_db_conn
from app.schemas.schemas import UserSignup, UserSignin, ChangePwd, UpdateUserName
from app.models.user import get_user, create_user, update_user_password, update_user_name, update_user_avatar
from app.utils.password import hash_pwd, verify_pwd
from app.utils.auth import get_current_user
from app.utils.jwt import create_access_token, verify_token
from pydantic import ValidationError
import os
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/user")  # prefix 路由前綴

# 設定上傳目錄
UPLOAD_DIR = "static/uploads/avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 允許的圖片格式
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

@router.post("")
async def signup(user: UserSignup, db=Depends(get_db_conn)):
	conn, cursor = db
	try:
		existing_user = get_user(conn, cursor, user.email)
		if existing_user:
			raise HTTPException(
				status_code=400,
				detail={
					"error": True,
					"message": "此 Email 已被註冊"
				}
			)

		create_user(conn, cursor, user.name, user.email, hash_pwd(user.password))

		return {"ok": True}
	
	except ValidationError as e:
		raise HTTPException(
			status_code=400,
			detail={
				"error": True,
				"message": "輸入資料格式不正確"
			}
		)
	
	except HTTPException:
		raise

	except Exception as e:
		print(f"Error: {str(e)}")
		raise HTTPException(
			status_code=500,
			detail={
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
			raise HTTPException(
				status_code=400,
				detail={
					"error": True,
					"message": "電子郵件或密碼錯誤"
				}
			)

		token = create_access_token(existing_user)
		return {"token": token}

	except ValidationError as e:
		raise HTTPException(
			status_code=400,
			detail={
				"error": True,
				"message": "輸入資料格式不正確"
			}
		)

	except HTTPException:
		raise

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
				"email": user['email'],
				"avatar": user.get("avatar")
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

	auth_header = request.headers.get("Authorization")

	if not auth_header or not auth_header.startswith("Bearer "):
		raise HTTPException(
			status_code=401,
			detail={
				"error": True,
				"message": "尚未登入系統"
			}
		)
	
	token = auth_header.split(" ")[1]
	
	try:
		payload = verify_token(token)
	except HTTPException:
		raise HTTPException(
			status_code=401,
			detail={
				"error": True,
				"message": "Token 無效或已過期"
			}
		)

	user = get_user(conn, cursor, payload["email"])
	if not user:
		raise HTTPException(
			status_code=404,
			detail={
				"error": True,
				"message": "使用者不存在"
			}
		)
	
	# 驗證當前密碼
	if not verify_pwd(password_data.currentPwd, user["password"]):
		raise HTTPException(
			status_code=403,
			detail={
				"error": True,
				"message": "當前密碼輸入錯誤"
			}
		)
			
	# 檢查新密碼長度
	if len(password_data.newPwd) < 6:
		raise HTTPException(
			status_code=400,
			detail={
				"error": True,
				"message": "新密碼長度至少需要 6 個字元"
			}
		)

	# 檢查新舊密碼是否相同
	if verify_pwd(password_data.newPwd, user["password"]):
		raise HTTPException(
			status_code=400,
			detail={
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

@router.patch("/name")
async def update_name(
	request: Request,
	user_data: UpdateUserName,
	db=Depends(get_db_conn)
):
	conn, cursor = db

	auth_header = request.headers.get("Authorization")
	if not auth_header or not auth_header.startswith("Bearer "):
		raise HTTPException(
			status_code=401,
			detail={
				"error": True,
				"message": "尚未登入系統"
			}
		)
	
	token = auth_header.split(" ")[1]
	
	try:
		payload = verify_token(token)
	except HTTPException:
		raise HTTPException(
			status_code=401,
			detail={
				"error": True,
				"message": "Token 無效或已過期"
			}
		)

	user = get_user(conn, cursor, payload["email"])
	if not user:
		raise HTTPException(
			status_code=404,
			detail={
				"error": True,
				"message": "使用者不存在"
			}
		)

	# 驗證姓名格式
	new_name = user_data.name.strip()
	if len(new_name) < 2:
		raise HTTPException(
			status_code=400,
			detail={
				"error": True,
				"message": "姓名至少需要 2 個字元"
			}
		)
		
	# 更新姓名
	update_user_name(conn, cursor, user["id"], new_name)

	# 取得更新後的資料
	updated_user = get_user(conn, cursor, payload["email"])

	return {
		"ok": True,
		"data":{
			"id": updated_user["id"],
			"name": updated_user["name"],
			"email": updated_user["email"],
			"avatar": updated_user.get("avatar")
		}
	}

@router.post("/avatar")
async def upload_avatar(
	request: Request,
	file: UploadFile = File(...),
	db=Depends(get_db_conn)
):
	conn, cursor = db

	auth_header = request.headers.get("Authorization")
	if not auth_header or not auth_header.startswith("Bearer "):
		raise HTTPException(
			status_code=401,
			detail={
				"error": True,
				"message": "尚未登入系統"
			}
		)
	
	token = auth_header.split(" ")[1]

	try:
		payload = verify_token(token)
	except HTTPException:
		raise HTTPException(
			status_code=401,
			detail={
				"error": True,
				"message": "Token 無效或已過期"
			}
		)
	
	user = get_user(conn, cursor, payload["email"])
	if not user:
		raise HTTPException(
			status_code=404,
			detail={
				"error": True,
				"message": "使用者不存在"
			}
		)


	# 檢查檔案格式
	file_ext = os.path.splitext(file.filename)[1].lower()
	if file_ext not in ALLOWED_EXTENSIONS:
		raise HTTPException(
			status_code=400,
			detail={
				"error": True,
				"message": "只允許上傳圖片檔案(jpg, jpeg, png, gif, webp)"
			}
		)
		
	# 讀取檔案內容並檢查大小 限制 5MB
	file_content = await file.read()
	if len(file_content) > 5 * 1024 * 1024:
		raise HTTPException(
			status_code=400,
			detail={
				"error": True,
				"message": "檔案大小超過 5MB"
			}
		)
		
	# 建立唯一檔名
	timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
	unique_id = str(uuid.uuid4())[:8]
	new_filename = f"user_{user['id']}_{timestamp}_{unique_id}{file_ext}"
	file_path = os.path.join(UPLOAD_DIR, new_filename)

	# 儲存檔案
	with open(file_path, "wb") as f:
		f.write(file_content)
		
	# 建立資料庫儲存的相對路徑
	avatar_url = f"/static/uploads/avatars/{new_filename}"

	# 刪除舊頭像(如果存在且不是預設頭像)
	old_avatar = user.get("avatar")
	if old_avatar and old_avatar.startswith("/static/uploads/avatars/"):
		old_file_path = old_avatar.lstrip("/")
		if os.path.exists(old_file_path):
			try:
				os.remove(old_file_path)
			except Exception as e:
				print(f"刪除舊頭像失敗: {str(e)}")
		
	# 更新資料庫
	update_user_avatar(conn, cursor, user["id"], avatar_url)

	# 取得更新後的資料
	updated_user = get_user(conn, cursor, payload["email"])

	return {
		"ok": True,
		"data":{
			"id": updated_user["id"],
			"name": updated_user["name"],
			"email": updated_user["email"],
			"avatar": updated_user.get("avatar")
		}
	}