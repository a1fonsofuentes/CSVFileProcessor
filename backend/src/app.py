from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, APIRouter, status, Header
from pydantic import BaseModel
import pandas as pd
import re
import io
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasicCredentials, HTTPBasic
from passlib.context import CryptContext
import jwt
import base64
from dotenv import load_dotenv
import os
from supabase import create_client 

app = FastAPI()

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Replace this with your actual secret key
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "password123"
hashed_password = pwd_context.hash(password)
# Sample user data (replace with your actual user data from the database)
fake_users_db = {
    "john_doe": {
        "username": "john_doe",
        "hashed_password": hashed_password,  # Hashed password: "password123"
    }
}



def verify_password(plain_password, hashed_password):
    result = pwd_context.verify(plain_password, hashed_password)
    print("Verification Result:", result, flush=True)
    return result

def get_user(username: str):
    print(username)
    if username in fake_users_db:
        user_dict = fake_users_db[username]
        return user_dict


def authenticate_user(credentials: HTTPBasicCredentials = Depends(HTTPBasic())):
    user = get_user(credentials.username)
    print("Received credentials type:", type(credentials))  # Add this print statement
    if user is None or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    print(credentials.username)
    return user


def create_access_token(data: dict):
    print("Received data for creating access token:", data)  # Add this print statement
    to_encode = data.copy()
    print(to_encode)  # Add this print statement
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print(encoded_jwt)  # Add this print statement
    return encoded_jwt

origins = ["http://localhost:5173"]  # front-end server
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

router = APIRouter()

def get_credentials(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    scheme, credentials = authorization.split()
    if scheme.lower() != "basic":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    decoded_credentials = base64.b64decode(credentials).decode("utf-8")
    username, _, password = decoded_credentials.partition(":")
    return HTTPBasicCredentials(username=username, password=password)

@router.post("/login", tags=["authentication"])
async def login(authorization: HTTPBasicCredentials = Depends(get_credentials)):
    user = authenticate_user(authorization)
    access_token = create_access_token({"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

app.include_router(router, prefix="/users", tags=["users"])


#Data model
class FileSchema(BaseModel):
    filename: str
    content: bytes

def process_csv(file_content: bytes = File(...)):
    df = pd.read_csv(io.BytesIO(file_content), skiprows=3)
    df1 = pd.read_csv(io.BytesIO(file_content), skiprows=4)

    headers = df1.columns[:18]
    details = df.columns[18:36]
    footers = df.columns[36:40]

    new_df = pd.DataFrame(columns=headers)
    new_df.columns = headers

    for index, row in df.iterrows():
        new_row = pd.Series(dtype='object')

        for column in details:
            value = row[column]
            header = headers[details.get_loc(column)]
            new_row[header] = value
        new_df = pd.concat([new_df, new_row.to_frame().T], ignore_index=True)

    pattern = r'\$[^\d]*(\d{1,3}(?:\.\d{3})*,\d{4})'

    def extract_number(x):
        match = re.match(pattern, x)
        if match:
            return float(match.group(1).replace('.', '').replace(',', '.'))
        else:
            try:
                return float(x.replace('.', '').replace(',', '.'))
            except ValueError:
                return None

    new_df['Monto Facturación'] = new_df['Monto Facturación'].apply(extract_number)
    new_df['Costo Detalle  Facturación'] = new_df['Costo Detalle  Facturación'].apply(extract_number)

    main_df = new_df.drop(columns=['País', 'Línea Factura', 'Oportunidad (Producto Oportunidad)', 'Producto Oportunidad', 'Servicios (Producto Oportunidad)', 'Probabilidad (Oportunidad)', 'Industria (Cuenta)', 'Sub Categoría (Cuenta)', 'Propietario (Oportunidad)', 'Propietario', 'Estado (Oportunidad)'])

    month_mapping = {
        'Enero': 1,
        'Febrero': 2,
        'Marzo': 3,
        'Abril': 4,
        'Mayo': 5,
        'Junio': 6,
        'Julio': 7,
        'Agosto': 8,
        'Setiembre': 9,
        'Octubre': 10,
        'Noviembre': 11,
        'Diciembre': 12
    }

    main_df['Mes Detalle'] = main_df['Mes'].str.split('-').str[1]
    main_df['Mes Detalle'] = main_df['Mes Detalle'].map(month_mapping)

    final_df = main_df.groupby(['Año', 'Mes Detalle', 'Tipo de Venta (Producto Oportunidad)', 'Producto (Producto Oportunidad)', 'Cuenta']).agg({
        'Monto Facturación': 'sum',
        'Costo Detalle  Facturación': 'sum'
    }).reset_index()
#__________________________
    first_row_year = final_df['Año'].iloc[0]
    final_df['Año'].fillna(first_row_year, inplace=True)
#__________________________
    final_df['Monto Facturación'] = round(final_df['Monto Facturación'], 2)
    final_df['Costo Detalle  Facturación'] = round(final_df['Costo Detalle  Facturación'], 2)

    final_df['Utilidad'] = round(final_df['Monto Facturación'] - final_df['Costo Detalle  Facturación'], 2)
    final_df['Margen %'] = round((final_df['Utilidad'] / final_df['Monto Facturación']) * 100, 2)


    totals_df = final_df.groupby(['Mes Detalle', 'Tipo de Venta (Producto Oportunidad)']).agg({
        'Monto Facturación': 'sum',
        'Costo Detalle  Facturación': 'sum',
        'Utilidad': 'sum',
        'Margen %': 'mean'
    }).reset_index()

    final_df = pd.concat([final_df, totals_df], ignore_index=True)

    final_df.rename(columns={'Tipo de Venta (Producto Oportunidad)': 'TOTAL Tipo de Venta'}, inplace=True)

    grand_totals = final_df.groupby('Mes Detalle').agg({
        'Monto Facturación': 'sum',
        'Costo Detalle  Facturación': 'sum',
        'Utilidad': 'sum',
        'Margen %': 'mean'
    }).reset_index()

    grand_totals[['Monto Facturación', 'Costo Detalle  Facturación', 'Utilidad']] /= 2

    final_df = pd.concat([final_df, grand_totals], ignore_index=True)

    final_df.sort_values(by=['Mes Detalle', 'TOTAL Tipo de Venta', 'Producto (Producto Oportunidad)', 'Cuenta'], inplace=True)

    month_groups = final_df.groupby('Mes Detalle')
    final_df = pd.concat([month_group for _, month_group in month_groups], ignore_index=True)

    final_df['TOTAL Tipo de Venta'] = final_df['TOTAL Tipo de Venta'].fillna('– TOTAL DEL MES – ')

    final_df.reset_index(drop=True, inplace=True)
    
    final_df['Cuenta'] = final_df['Cuenta'].str.replace(',', '')
    final_df['Monto Facturación'] = final_df['Monto Facturación'].round(2)
    final_df['Costo Detalle  Facturación'] = final_df['Costo Detalle  Facturación'].round(2)
    final_df['Utilidad'] = final_df['Utilidad'].round(2)
    final_df['Margen %'] = final_df['Margen %'].round(2)
    final_df['Mes Detalle'] = final_df['Mes Detalle'].astype(int)

    # Instead of using io.BytesIO, we use io.StringIO for CSV processing
    processed_data_buffer = io.StringIO()
    final_df.to_csv(processed_data_buffer, index=False, sep=',')

    processed_csv_data = processed_data_buffer.getvalue()
    processed_data_buffer.close()

    return processed_csv_data

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_content = await file.read()
    processed_csv_data = process_csv(file_content)

    headers = {
        "Content-Disposition": "attachment; filename=processed_data.csv",
        "Content-Type": "text/csv",
    }

    return Response(content=processed_csv_data, headers=headers)

@app.get("/get-processed-data")
async def get_processed_data():
    try:
        # Fetch data from Supabase for both tables
        controller_data = await supabase.from_("controller").select("*")
        data_data = await supabase.from_("data").select("*")
        
        if controller_data.error or data_data.error:
            error_message = controller_data.error or data_data.error
            return {"error": error_message}

        # Process the data into desired format
        processed_data = []

        for controller_row in controller_data.data:
            upload_date = controller_row["fecha"]
            upload_id = controller_row["id"]
            
            data_rows = []

            for data_row in data_data.data:
                if data_row["upload"] == upload_id:
                    row = [
                        data_row["year"],
                        data_row["month"],
                        data_row["total_tipo_venta"],
                        data_row["producto"],
                        data_row["cuenta"],
                        data_row["monto_facturacion"],
                        data_row["costo_detalle_facturacion"],
                        data_row["utilidad"],
                        data_row["margin"]
                    ]
                    data_rows.append(row)

            processed_data.append({
                "uploadDate": upload_date,
                "data": data_rows
            })

        return {"processedData": processed_data}

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)


def supabase_queries():
    data = supabase.table('data').select('*').execute()
    print(data)