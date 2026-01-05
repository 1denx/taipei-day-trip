import bcrypt 

# 加密密碼
def hash_pwd(password: str) -> str:
	salt = bcrypt.gensalt()
	hashed = bcrypt.hashpw(password.encode(), salt)
	return hashed.decode()

# 驗證密碼
def verify_pwd(plain_pwd: str, hash_pwd: str) -> bool:
	return bcrypt.checkpw(plain_pwd.encode(), hash_pwd.encode())