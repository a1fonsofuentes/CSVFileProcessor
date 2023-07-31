from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, APIRouter, status
from pydantic import BaseModel
import pandas as pd
import re
import io
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasicCredentials, HTTPBasic
from passlib.context import CryptContext
import jwt

# Replace this with your actual secret key
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Sample user data (replace with your actual user data from the database)
fake_users_db = {
    "john_doe": {
        "username": "john_doe",
        "hashed_password": "$2b$12$3R19l1m6Oh.GvHH7sKBfKu4F4Lrl1GNbyLUJ2nXJQO9w2w4oyb1vi",  # Hashed password: "password123"
    }
}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_user(username: str):
    if username in fake_users_db:
        user_dict = fake_users_db[username]
        return user_dict


def authenticate_user(credentials: HTTPBasicCredentials = Depends(HTTPBasic())):
    user = get_user(credentials.username)
    if user is None or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return user


def create_access_token(data: dict):
    to_encode = data.copy()
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


app = FastAPI()

origins = ["http://localhost:5173"]  # front-end server
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

router = APIRouter()

@router.post("/login", tags=["authentication"])
async def login(credentials: HTTPBasicCredentials = Depends(authenticate_user)):
    access_token = create_access_token({"sub": credentials.username})
    return {"access_token": access_token, "token_type": "bearer"}

app.include_router(router, prefix="/users", tags=["users"])


#Data model
class FileSchema(BaseModel):
    filename: str
    content: bytes

# Your CSV processing code here...
# (The same code you had previously)

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_content = await file.read()
    processed_csv_data = process_csv(file_content)

    headers = {
        "Content-Disposition": "attachment; filename=processed_data.csv",
        "Content-Type": "text/csv",
    }

    return Response(content=processed_csv_data, headers=headers)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

#HAKDHNDAEDNNENOAIJN