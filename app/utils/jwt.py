import os
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

# JWT Config
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

def create_access_token(user: dict) -> str:
	expire = datetime.now(timezone.utc) + timedelta(days=7)
	payload = {
		"sub": str(user['id']),
		"email": user.get("email"),
		"name": user.get("name"),
		"exp": expire
	}
	token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
	return token

def verify_token(token: str):
	try:
		payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
		return payload
	except jwt.ExpiredSignatureError:
		raise HTTPException(status_code=401, detail="Token 已過期")
	except jwt.InvalidTokenError:
		raise HTTPException(status_code=401, detail="無效的 Token")