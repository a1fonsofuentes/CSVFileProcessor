from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from pydantic import BaseModel
import pandas as pd
import re
import io
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ["http://localhost:5173"]  #front-end server

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    main_df = new_df.drop(columns=['Año', 'País', 'Línea Factura', 'Oportunidad (Producto Oportunidad)', 'Producto Oportunidad', 'Servicios (Producto Oportunidad)', 'Probabilidad (Oportunidad)', 'Industria (Cuenta)', 'Sub Categoría (Cuenta)', 'Propietario (Oportunidad)', 'Propietario', 'Estado (Oportunidad)'])

    month_mapping = {
        'Enero': 1,
        'Febrero': 2,
        'Marzo': 3,
        'Abril': 4,
        'Mayo': 5,
        'Junio': 6,
        'Julio': 7,
        'Agosto': 8,
        'Septiembre': 9,
        'Octubre': 10,
        'Noviembre': 11,
        'Diciembre': 12
    }

    main_df['Mes Detalle'] = main_df['Mes'].str.split('-').str[1]
    main_df['Mes Detalle'] = main_df['Mes Detalle'].map(month_mapping)

    final_df = main_df.groupby(['Mes Detalle', 'Tipo de Venta (Producto Oportunidad)', 'Producto (Producto Oportunidad)', 'Cuenta']).agg({
        'Monto Facturación': 'sum',
        'Costo Detalle  Facturación': 'sum'
    }).reset_index()

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

# @app.post("/process/")
# async def process_file(file_data: FileSchema):
#     # Get the processed CSV data as bytes
#     processed_csv_data = process_and_return_csv(file_data.content)
#     return processed_csv_data
