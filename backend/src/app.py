from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, APIRouter, status, Header, Security
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
from sklearn.linear_model import LinearRegression
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

response = supabase.from_("data").select("year").execute()
available_years = [row["year"] for row in response.data]
unique_years_set = set(available_years)
unique_years_list = list(unique_years_set)
unique_years_list = [year for year in unique_years_list if year is not None]
cleaned_years = [int(year.replace('.', '')) for year in unique_years_list if year and year.strip() != '']
if cleaned_years:
    latest_year = max(cleaned_years)
    number_str = str(latest_year)
    index_of_zero = number_str.find('0')
    if index_of_zero != -1 and index_of_zero != len(number_str) - 1:
        latest_year_str = number_str[:index_of_zero] + '.' + number_str[index_of_zero:]
else:
    latest_year_str = None
highest_id_response = supabase.from_('data').select('upload').eq('year', latest_year_str).order('upload', desc=True).limit(1).execute()
highest_id = highest_id_response.data[0]['upload']

response = supabase.from_('data').select('producto').eq('upload', highest_id).limit(1000).execute()
data = response.data
all_products = [item['producto'] for item in data if item['producto'] != None and item['producto'] != '']
productos = list(set(all_products))

security = HTTPBasic()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

origins = ["http://localhost:5173"]  # front-end server
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

router = APIRouter()

@app.post("/update_highest_id")
async def update_highest_id(selected_year: str):
    global highest_id, highest_id_response
    highest_id_response = supabase.from_('data').select('upload').eq('year', selected_year).order('upload', desc=True).limit(1).execute()
    highest_id = highest_id_response.data[0]['upload']
    return {"message": "highest_id updated successfully"}

@app.post("/login")
def login(credentials: HTTPBasicCredentials = Depends(security)):
    user_name = credentials.username
    user_password = credentials.password
    user = supabase.table("users").select("*").eq("username", user_name).limit(1).execute().data
    if user:
        stored_hashed_password = user[0]['hashedpassword']
    else:
        raise HTTPException(status_code=404, detail="User not found")
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not pwd_context.verify(user_password, stored_hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode({"sub": user_name}, SECRET_KEY, algorithm="HS256")
    return {"access_token": token, "token_type": "bearer"}

@app.post("/signup")
async def signup(user_data: dict):
    user_name = user_data.get('username')
    user_password = user_data.get('password')
    existing_user_response = supabase.table("users").select("*").eq("username", user_name).limit(1).execute()

    # Check if the response has an error attribute or equivalent
    if hasattr(existing_user_response, 'error') and existing_user_response.error:
        return HTTPException(status_code=400, detail="User already exists")

    # Check if any data was returned (user with that username already exists)
    if existing_user_response.data:
        return HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = pwd_context.hash(user_password)

    user_insert = supabase.table("users").insert([{"username": user_name, "hashedpassword": hashed_password}]).execute()

    if hasattr(user_insert, 'status_code') and user_insert.status_code != 200:
        raise HTTPException(status_code=500, detail="User registration failed")

    token = jwt.encode({"sub": user_name}, SECRET_KEY, algorithm="HS256")
    return {"access_token": token, "token_type": "bearer"}


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

    # Instead of using io.BytesIO, we use io.StringIO for CSV processing
    processed_data_buffer = io.StringIO()
    final_df.to_csv(processed_data_buffer, index=False, sep=',')

    processed_csv_data = processed_data_buffer.getvalue()
    processed_data_buffer.close()

    data_to_insert = final_df.to_dict(orient='records')

    # Upload the data to the 'data' table
    response = supabase.table('data').upsert(data_to_insert, returning='minimal')

    if isinstance(response, dict) and 'error' in response:
        return {"error": "Failed to insert data into the 'data' table."}
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
    
    # Filter out rows with empty or null "producto" field
    filtered_data = [row for row in valid_data if row.get("producto") is not None and row.get("producto").strip() != ""]

    if not filtered_data:
        return {"error": "No valid year values"}

    # Extract the required fields from each row and filter for the highest year and upload
    max_year = max(filtered_data, key=lambda row: row["year"])["year"]
    latest_upload_rows = [row for row in filtered_data if row["year"] == max_year]

    return latest_upload_rows


# This function fetches the data from Supabase and processes it using the above function
def process_supabase_data():
    try:
        # Fetch data from Supabase
        response = supabase.from_("data").select("*").eq('upload', highest_id).execute()
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

@app.post("/get_comparison_sales")
async def fetch_comparison_data(selected_year: str):
    highest_id_comparison_response = supabase.from_('data').select('upload').eq('year', selected_year).order('upload', desc=True).limit(1).execute()
    highest_id_comparison_data = highest_id_comparison_response.data[0]['upload']
    response = supabase.from_('data').select('month', 'producto', 'monto_facturacion').eq('upload', highest_id_comparison_data).eq('total_tipo_venta', '– TOTAL DEL MES – ').limit(1000).execute()
    data = response.data
    
    df = pd.DataFrame(data)
    df['month'] = pd.to_numeric(df['month'])
    df_sorted = df.sort_values('month')
    
    # Group the sorted data by 'month' and calculate the sum of 'monto_facturacion'
    grouped_df = df_sorted.groupby('month')['monto_facturacion'].sum().reset_index()
    
    # Convert the grouped DataFrame to a list of dictionaries
    result = grouped_df.to_dict(orient='records')
    
    return result

@app.get("/get_anual_sales_line_graph")
async def get_anual_sales_line_graph():
    data = anual_sales_line_graph()
    if len(data) > 0:
        return JSONResponse(content=data, status_code=200)
    else:
        raise HTTPException(status_code=404, detail="Data not found")

def anual_sales_line_graph():
    response = supabase.from_('data').select('month', 'producto', 'monto_facturacion').eq('upload', highest_id).eq('total_tipo_venta', '– TOTAL DEL MES – ').limit(1000).execute()
    data = response.data
    
    df = pd.DataFrame(data)
    df['month'] = pd.to_numeric(df['month'])
    df_sorted = df.sort_values('month')
    
    # Group the sorted data by 'month' and calculate the sum of 'monto_facturacion'
    grouped_df = df_sorted.groupby('month')['monto_facturacion'].sum().reset_index()
    
    # Convert the grouped DataFrame to a list of dictionaries
    result = grouped_df.to_dict(orient='records')
    
    return result
    
    # monthly_totals = df['monto_facturacion'].tolist()
    # months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Sept.', 'Octubre', 'Nov.', 'Dic.']

    # plt.figure(figsize=(10, 6))  
    # plt.plot(months, monthly_totals, marker='o', color='#50B3E5')
    # plt.title('Progresión de ventas' , color='#50b3e5')
    # plt.xlabel('Mes', color='#50b3e5')
    # plt.ylabel('Ventas totales', color='#50b3e5')
    # plt.grid(True)

    # ax = plt.gca()  # Get the current axes

    # # Set the color of the graph border (spines)
    # for spine in ax.spines.values():
    #     spine.set_edgecolor('#50b3e5')

    # plt.yticks(range(100000, 1000001, 100000), ['$100,000', '$200,000', '$300,000', '$400,000', '$500,000', '$600,000', '$700,000', '$800,000', '$900,000', '$1,000,000'])
    # plt.xticks(rotation=45, color='#50b3e5')

    # dot_indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]  

    # cursor = mplcursors.cursor(hover=True)
    # cursor.connect("add", lambda sel: sel.annotation.set_text(f"${sel.target[1]:,.2f}") if sel.index in dot_indices else None)

    # plt.tight_layout()
    # # Save the graph as an image file
    # image_path = "sales_progression.png"
    # plt.savefig(image_path)
    # return image_path
    
@app.get("/get_available_years")
async def get_available_years():
    try:
        global highest_id, highest_id_response, unique_years_list
        response = supabase.from_("data").select("year").execute()
        available_years = [row["year"] for row in response.data]
        unique_years_set = set(available_years)
        unique_years_list = list(unique_years_set)
        
        return {"availableYears": unique_years_list}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/get_lineal_regresion_image")
async def get_lineal_regresion_image():
    image_path = linear_regression(unique_years_list)
    # Check if the image file exists
    if os.path.exists(image_path):
        return FileResponse(image_path, media_type="image/png")
    else:
        return JSONResponse(content={"error": "Image not found"}, status_code=404)

def linear_regression(years):
    plt.style.use('seaborn-darkgrid')
    plt.figure(figsize=(10, 6))

    combined_sales = []
    combined_months = []

    for year in years:
        if not year or len(year) < 4:
            continue
        highest_id_response = supabase.from_('data').select('upload').eq('year', year).order('upload', desc=True).limit(1).execute()
        highest_id = highest_id_response.data[0]['upload']

        response = supabase.from_('data').select('monto_facturacion').eq('upload', highest_id).eq('total_tipo_venta', '– TOTAL DEL MES – ').limit(1000).execute()
        data = response.data
        df = pd.DataFrame(data)
        
        year_sales = df['monto_facturacion'].tolist()
        months = np.arange(1, 13)
        
        combined_sales.extend(year_sales)  # Extend the sales data list
        combined_months.extend(months)     # Extend the months list for each year

     # Create a DataFrame with the complete set of months
    complete_months = pd.DataFrame({'Month': np.arange(1, 13)})

    # Create a DataFrame with the combined sales data
    sales_data = pd.DataFrame({'Month': combined_months, 'Sales': combined_sales})

    # Merge the two DataFrames to fill in missing values using interpolation
    merged_data = complete_months.merge(sales_data, on='Month', how='left')

    # Interpolate missing sales values
    merged_data['Sales'] = merged_data['Sales'].interpolate()

    # Extract interpolated sales values and months as numpy arrays
    X = merged_data['Month'].values.reshape(-1, 1)
    y = merged_data['Sales'].values

    model = LinearRegression()

    X = np.array(combined_months).reshape(-1, 1)
    y = np.array(combined_sales)
    model.fit(X, y)

    y_pred = model.predict(X)

    for i, txt in enumerate(y_pred):
        plt.annotate(f'${int(txt):,}', (combined_months[i], txt), textcoords="offset points", xytext=(0, 10), ha='center')

    coef = model.coef_[0]
    intercept = model.intercept_
    plt.text(6, 900000, f'Regression Line: y = {coef:.2f}x + {intercept:.2f}', fontsize=12, color='black')
    
    total_sales = np.sum(y_pred)
    plt.text(6, 800000, f'Predicted Total Sales: ${int(total_sales):,}', fontsize=12, color='blue')

    plt.scatter(combined_months, y, color='#50b3e5', label='Sales Data', s=80)
    plt.plot(combined_months, y_pred, label='Regression Line', color='red', linewidth=1.5)

    plt.xlabel('Month', fontsize=14)
    plt.ylabel('Total Sales', fontsize=14)
    plt.legend(fontsize=12, loc='upper left')  
    plt.grid(True, alpha=0.5)
    plt.xticks(np.arange(1, 13), fontsize=12)
    plt.yticks(np.arange(200000, 1000001, 200000), ['$200,000', '$400,000', '$600,000', '$800,000', '$1,000,000'], fontsize=12)

    plt.legend(fontsize=12)
    plt.tight_layout()

    image_path = "linear_regression_sales.png"
    plt.savefig(image_path)

    return image_path

@app.get("/get_producto_oportunidad")
async def get_producto_oportunidad():
    producto_oportunidad_data = producto_oportunidad_query()
    return {"producto_oportunidad": producto_oportunidad_data}

def producto_oportunidad_query():
    producto_totals = {}
    for producto in productos:
        response1 = supabase.from_('data').select('month', 'monto_facturacion').eq('upload', highest_id).eq('producto', producto).limit(1000).execute()
        data = response1.data
        
        if data:
            df = pd.DataFrame(data)
            grouped = df.groupby('month')['monto_facturacion'].sum()

            for month, total in grouped.items():
                if producto in producto_totals:
                    producto_totals[producto] += total
                else:
                    producto_totals[producto] = total
    
    output_array = []
    for producto, total_facturacion in producto_totals.items():
        output_array.append({
            'producto': producto,
            'monto_facturacion': round(total_facturacion, 2)
        })
    
    return output_array

@app.get("/get_clientes")
async def get_clientes():
    clientes_data = clientes()
    return {"clientes": clientes_data}

def clientes():
    clientes = ['Grupo Codaca', 'Industrias Alimenticias Kern´s', 'Kellogg de Guatemala', 'Registro Nacional de las Personas', 'GT - Banco Agromercantil de Guatemala  - BAM -', 'GT - Banco Industrial', 'HN - Banco del Pais', 'Sertracen Ecuador', 'Transunión Guatemala S.A.', 'COFIÑO STAHL', 'Instituto de Fomento de Hipotecas Aseguradas - FHA -', 'SV One Solution', 'GT - Banco Crédito Hipotecario Nacional', 'GT - Grupo Terra', 'Comdata Guatemala SA', '4 Carriles S.A.', 'Infile S.A.', 'GT - ViviBanco Guatemala', 'SOPESA', 'GSI Dominicana', 'Sertracen Panamá', 'Instituto Salvadoreño del Seguro Social', 'Spectrum S.A.','SV - Sertracen', 'SV - Banco Industrial','Instituto Guatemalteco de Migración', 'Superintendencia de Bancos','Superintendencia de Administración Tributaria', 'CitiBank Guatemala NA','Edgar Elias', 'Instituto Nacional de Electrificación INDE', 'Registro Mercantil General de la República de Guatemala', 'vLEX LLC', 'Municipalidad de Guatemala', 'Nery Aldana', 'GT - AmigoPAQ', 'GT - Luma Holdings (NEXA)', 'COE GSI', 'Thales', 'Ingrup', 'SV Banco Cuscatlán El Salvador', 'SV - Banco Agricola', 'GIGA S.A. de C.V.', 'GT - Banco Ficohsa Guatemala S.A.', 'Ministerio de Defensa', 'Gestionadora de Creditos', 'GT - Banco INV', 'GT - Interconsumo S.A.', 'Documentos Inteligentes SV', 'Confederación Deportiva Autónoma de Guatemala', 'Ministerio de Cultura y Deportes', 'Corporación Multi Inversiones', 'Organismo Judicial', 'Administrador del Mercado Mayorista AMM', 'Fomilenio', 'SV Banco Azul de El Salvador', 'GT Banco Promérica', 'Osmo Wallet', 'Banco de los Trabajadores']
    final_list = []
    for cliente in clientes:
        response = supabase.from_('data').select('monto_facturacion').eq('upload', highest_id).eq('cuenta', cliente).limit(1000).execute()
        data = response.data

        monto_facturacion_values = [item['monto_facturacion'] for item in data]

        sum_monto_facturacion = round(sum(monto_facturacion_values), 2)
        if sum_monto_facturacion != 0:
            final_list.append({
                'cliente': cliente,
                'monto_facturacion': sum_monto_facturacion
            })

    return final_list

@app.get("/get_oportunidad_anual")
async def get_oportunidad_anual():
    try:
        oportunidad_data = producto_oportunidad1()
        return {"data": oportunidad_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred.")

def producto_oportunidad1():
    # productos = ['DIGITALIZACION', 'GEMALTO PVC', 'CAMI APP', 'ONBASE', 'E-POWER', 'OTROS', 'FUJITSU', 'GEMALTO', 'BIZAGI']
    result = []

    for month in range(1, 13):
        month_data = {
            'month': month,
        }
        
        for producto in productos:
            response = supabase.from_('data').select('monto_facturacion').eq('upload', highest_id).eq('producto', producto).eq('month', month).limit(1000).execute()
            data = response.data
            if data:
                month_data[producto] = round(sum((pd.DataFrame(data))['monto_facturacion'].tolist()), 2)
            else:
                month_data[producto] = 0
        
        result.append(month_data)
    
    return result

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)