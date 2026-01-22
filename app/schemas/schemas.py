from pydantic import BaseModel, EmailStr, field_validator, Field
from typing import Optional, List, Literal
from datetime import date

# 使用 Pydantic 資料模型做資料驗證
class UserSignup(BaseModel):
	name: str = Field(..., min_length=1, max_length=100)
	email: EmailStr
	password: str = Field(..., min_length=6, max_length=100)

	@field_validator("name")
	@classmethod
	def name_not_empty(cls, val):
		if not val or not val.strip():
			raise ValueError("姓名不可為空")
		return val.strip()

class UserSignin(BaseModel):
	email: EmailStr
	password: str = Field(..., min_length=1)

class Attraction(BaseModel):
	id: int
	name: str
	categories: Optional[str]
	description: str
	address: str
	transport: Optional[str]
	mrt: Optional[str]
	lat: Optional[float]
	lng: Optional[float]
	images: List[str]

class AttractionResponse(BaseModel):
	next_page: Optional[int]
	data: List[Attraction]

# booking
class CreateBooking(BaseModel):
	attractionId: int = Field(..., gt=0)
	date: date
	time: Literal["morning","afternoon"]
	price: int = Field(..., ge=0)

	@field_validator("date")
	@classmethod
	def date_not_in_past(cls, val):
		from datetime import date as date_module
		today = date_module.today()
		if val < today:
			raise ValueError("無法預訂過去的日期")
		return val

# order
class Contact(BaseModel):
	name: str = Field(..., min_length=1, max_length=100)
	email: EmailStr
	phone: str = Field(..., min_length=10, max_length=15)

	@field_validator("name")
	@classmethod
	def name_not_empty(cla, val):
		if not val or not val.strip():
			raise ValueError("姓名不可為空")
		return val.strip()

	@field_validator("phone")
	@classmethod
	def validate_phone(cla, val):
		import re
		# 移除空格和破折號
		cleaned = re.sub(r'[\s\-]', '', val)
		# 檢查是否為 10-15 位數字
		if not re.match(r'^\d{10,15}$', cleaned):
			raise ValueError("電話號碼格式不正確")
		return cleaned

class TripAttraction(BaseModel):
	id: int
	name: str
	address: str
	image: str

class Trip(BaseModel):
	attraction: TripAttraction
	date: date
	time: Literal["morning","afternoon"]

	@field_validator("date")
	@classmethod
	def date_not_in_past(cls, val):
		from datetime import date as date_module
		today = date_module.today()
		if val < today:
			raise ValueError("無法預訂過去的日期")
		return val

class OrderData(BaseModel):
	price: int = Field(..., gt=0)
	trip: Trip
	contact: Contact

class CreateOrder(BaseModel):
	prime: str = Field(..., min_length=1)
	order: OrderData

	@field_validator("prime")
	@classmethod
	def prime_not_empty(cls, val):
		if not val or not val.strip():
			raise ValueError("付款資訊不正確")
		return val.strip()