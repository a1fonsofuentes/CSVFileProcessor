from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, APIRouter, status, Header
from pydantic import BaseModel
import pandas as pd
import re
import io
from fastapi.responses import FileResponse, Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasicCredentials, HTTPBasic
from passlib.context import CryptContext
import jwt
import base64
from dotenv import load_dotenv
import os
from supabase import create_client 
import matplotlib.pyplot as plt
import numpy as np
import mplcursors
from typing import List

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
    final_df['Año'] = first_row_year
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

    year = final_df.loc[0, 'Año']
    final_df['Año'] = year
    print(final_df.head())

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

@app.get("/data")
async def get_processed_data():
    try:
        # Fetch data from Supabase for both tables
        controller_data = supabase.from_("controller").select("*").execute()
        data_data = supabase.from_("data").select("*").execute()

        # Process the data into the desired format
        processed_data = []

        for controller_row in controller_data.data:
            upload_date = controller_row["fecha"]
            upload_id = controller_row["id"]
            
            data_rows = []

            for data_row in data_data.data:
                if data_row["upload"] == upload_id:
                    row = {
                        "year": data_row["year"],
                        "month": data_row["month"],
                        "total_tipo_venta": data_row["total_tipo_venta"],
                        "producto": data_row["producto"],
                        "cuenta": data_row["cuenta"],
                        "monto_facturacion": data_row["monto_facturacion"],
                        "costo_detalle_facturacion": data_row["costo_detalle_facturacion"],
                        "utilidad": data_row["utilidad"],
                        "margin": data_row["margin"]
                    }
                    data_rows.append(row)

            processed_data.append({
                "uploadDate": upload_date,
                "data": data_rows
            })

        return {"processedData": processed_data}

    except Exception as e:
        print(e)
        return {"error": str(e)}
    
def get_total_facturacion(data):
    # Convert 'year' and 'month' to integers for comparison
    valid_data = []
    for row in data:
        if row["year"] is not None:
            try:
                year = int(row["year"].replace('.', ''))  # Convert to float first, then to int
                valid_data.append({**row, "year": year, "month": int(row["month"])})
            except ValueError:
                pass  # Skip rows with non-numeric or empty "year" values

    if not valid_data:
        return {"error": "No valid year values"}

    # Extract the required fields from each row and filter for the highest year and upload
    max_year = max(valid_data, key=lambda row: row["year"])["year"]
    latest_upload_rows = [row for row in valid_data if row["year"] == max_year]

    return latest_upload_rows


# This function fetches the data from Supabase and processes it using the above function
def process_supabase_data():
    try:
        # Fetch data from Supabase
        response = supabase.from_("data").select("*").execute()
        data = response.data
        # Check if there is any data
        if data:
            # Call the function to calculate the desired values
            total_facturacion = get_total_facturacion(data)
            return {"result": total_facturacion}  # Wrap in a dictionary with a "result" key
        else:
            return {"error": "No data available"}

    except Exception as e:
        return {"error": str(e)}
    
@app.get("/get_total_facturacion")
async def get_total_facturacion_endpoint():
    try:
        result = process_supabase_data()
        if "error" in result:
            return JSONResponse(content=result, status_code=400)
        formatted_data = result["result"]
        return JSONResponse(content=formatted_data, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    

def supabase_queries():
    data = supabase.table('data').select('*').execute()
    print(data)

@app.get("/get_anual_sales_line_graph_image")
async def get_anual_sales_line_graph_image():
    image_path = anual_sales_line_graph()
    
    # Check if the image file exists
    if os.path.exists(image_path):
        return FileResponse(image_path, media_type="image/png")
    else:
        return JSONResponse(content={"error": "Image not found"}, status_code=404)

def anual_sales_line_graph():
    highest_id_response = supabase.from_('data').select('upload').order('upload', desc=True).limit(1).execute()
    highest_id = highest_id_response.data[0]['upload']

    response = supabase.from_('data').select('monto_facturacion').eq('upload', highest_id).eq('total_tipo_venta', '– TOTAL DEL MES – ').limit(1000).execute() #TO USE IT HERE BC WE GOT 24 ENTRIES RN 
    data = response.data
    
    # response = supabase.table('data').select('*').execute()
    # data = response.data

    df = pd.DataFrame(data)
    print(df)
    
    monthly_totals = df['monto_facturacion'].tolist()
    months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Sept.', 'Octubre', 'Nov.', 'Dic.']

    plt.figure(figsize=(10, 6))  
    plt.plot(months, monthly_totals, marker='o', color='#27ae60')
    plt.title('Progresión de ventas' , color='#3E6A51')
    plt.xlabel('Mes', color='#3E6A51')
    plt.ylabel('Ventas totales', color='#3E6A51')
    plt.grid(True)

    plt.yticks(range(100000, 1000001, 100000), ['$100,000', '$200,000', '$300,000', '$400,000', '$500,000', '$600,000', '$700,000', '$800,000', '$900,000', '$1,000,000'])
    plt.xticks(rotation=45, color='#3E6A51')

    dot_indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]  

    cursor = mplcursors.cursor(hover=True)
    cursor.connect("add", lambda sel: sel.annotation.set_text(f"${sel.target[1]:,.2f}") if sel.index in dot_indices else None)

    plt.tight_layout()
    # Save the graph as an image file
    image_path = "sales_progression.png"
    plt.savefig(image_path)
    return image_path
    
# @app.get("/get_available_years")
# async def get_available_years():
#     try:
#         response = supabase.from_("data").select("distinct year").execute()
#         available_years = [row["year"] for row in response.data]
#         return {"availableYears": available_years}
#     except Exception as e:
#         return JSONResponse(content={"error": str(e)}, status_code=500)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)