from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal

# 使用 Pydantic 資料模型做資料驗證
class UserSignup(BaseModel):
	name: str
	email: EmailStr
	password: str

class UserSignin(BaseModel):
	email: EmailStr
	password: str

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

class CreateBooking(BaseModel):
	attractionId: int
	date: str
	time: Literal["morning","afternoon"]
	price: int

# order
class Contact(BaseModel):
	name: str
	email: EmailStr
	phone: str

class TripAttraction(BaseModel):
	id: int
	name: str
	address: str
	image: str

class Trip(BaseModel):
	attraction: TripAttraction
	date: str
	time: Literal["morning","afternoon"]

class OrderData(BaseModel):
	price: int
	trip: Trip
	contact: Contact

class CreateOrder(BaseModel):
	prime: str
	order: OrderData