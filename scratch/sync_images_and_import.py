import os
import csv
import re
import json
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

# 1. Leer credenciales desde .env.local
supabase_url = None
supabase_key = None

if os.path.exists(".env.local"):
    with open(".env.local", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                supabase_url = line.split("=", 1)[1].strip()
            elif line.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY="):
                supabase_key = line.split("=", 1)[1].strip()

if not supabase_url or not supabase_key:
    print("Error: No se pudieron leer las credenciales de Supabase en .env.local")
    exit(1)

print(f"Conectando a Supabase: {supabase_url}")

# Normalizaciones
def normalize_state(s):
    if not s:
        return 'Distrito Capital'
    s_clean = s.strip().lower()
    if 'la guaira' in s_clean or 'vargas' in s_clean:
        return 'La Guaira'
    if 'miranda' in s_clean:
        return 'Miranda'
    if 'capital' in s_clean or 'caracas' in s_clean:
        return 'Distrito Capital'
    if 'carabobo' in s_clean:
        return 'Carabobo'
    if 'aragua' in s_clean:
        return 'Aragua'
    if 'lara' in s_clean:
        return 'Lara'
    if 'anzo' in s_clean:
        return 'Anzoátegui'
    if 'sucre' in s_clean:
        return 'Sucre'
    if 'bol' in s_clean:
        return 'Bolívar'
    if 't' in s_clean and 'ch' in s_clean:
        return 'Táchira'
    if 'fal' in s_clean:
        return 'Falcón'
    return 'Distrito Capital'

def normalize_species(sp):
    if not sp:
        return 'otro'
    sp_clean = sp.strip().lower()
    if 'perro' in sp_clean or 'can' in sp_clean:
        return 'perro'
    if 'gato' in sp_clean or 'fel' in sp_clean:
        return 'gato'
    if 'ave' in sp_clean or 'pajaro' in sp_clean:
        return 'ave'
    return 'otro'

def sanitize_phone(p):
    if not p:
        return None
    p_clean = "".join(c for c in p if c.isdigit() or c in "+() -")
    p_clean = p_clean.strip()
    if 7 <= len(p_clean) <= 20:
        return p_clean
    return None

def sanitize_email(e):
    if not e:
        return None
    e = e.strip()
    if re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', e):
        return e
    return None

def sanitize_name(n):
    if not n:
        return None
    n = n.strip()
    if n.lower() == "desconocido":
        return None
    if len(n) > 80:
        return n[:80]
    if len(n) < 1:
        return None
    return n

def sanitize_reporter_name(rn):
    if not rn:
        return "Reporte Comunitario"
    rn = rn.strip()
    if len(rn) < 2:
        return "Reporte Comunitario"
    if len(rn) > 120:
        return rn[:120]
    return rn

def sanitize_city(c):
    if not c:
        return None
    c = c.strip()
    if len(c) < 2:
        return None
    if len(c) > 120:
        return c[:120]
    return c

# Verificar si el archivo ya existe en Supabase Storage
def check_file_exists(path):
    public_url = f"{supabase_url}/storage/v1/object/public/pet-photos/{path}"
    req = urllib.request.Request(public_url, method="HEAD")
    try:
        with urllib.request.urlopen(req) as res:
            return res.status == 200
    except Exception:
        return False

# Descargar y subir imagen a Supabase Storage
def sync_image(source_url, target_path):
    if check_file_exists(target_path):
        return True # Ya existe
    
    # Descargar
    try:
        req_down = urllib.request.Request(source_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req_down) as res:
            data = res.read()
    except Exception as e:
        print(f"Error al descargar {source_url}: {e}")
        return False

    # Subir
    upload_url = f"{supabase_url}/storage/v1/object/pet-photos/{target_path}"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "image/webp"
    }
    req_up = urllib.request.Request(upload_url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req_up) as res:
            return True
    except Exception as e:
        print(f"Error al subir a {target_path}: {e}")
        return False

# Mapear filas del CSV
rows_to_sync = []
csv.field_size_limit(10000000)

with open("mascotas_rows.csv", "r", encoding="utf-8", errors="replace") as f:
    reader = csv.DictReader(f)
    for row in reader:
        nombre = sanitize_name(row.get("nombre"))
        color_detalles = row.get("color_detalles", "").strip() or None
        raza = row.get("raza", "").strip() or None
        
        description = color_detalles or "Sin descripción detallada disponible."
        if len(description) > 4000:
            description = description[:4000]

        last_seen = row.get("fecha_contacto_perdido", "").strip() or None
        created = row.get("creado_en", "").strip() or None
        
        state = normalize_state(row.get("ultimo_visto_estado", ""))
        city = sanitize_city(row.get("ultimo_visto_detalles", ""))
        sector = city

        phone = sanitize_phone(row.get("informante_telefono"))
        email = sanitize_email(row.get("informante_email"))
        
        if not phone and not email:
            email = "importado@mascotas.venezuelareporta.org"

        # Resolver ruta de foto
        foto_url = row.get("foto_url", "").strip()
        photos = []
        sync_task = None
        
        if foto_url:
            filename = foto_url.split("/")[-1]
            folder = "lost" if row.get("estatus") == "Perdido" else "found"
            target_path = f"{folder}/{filename}"
            photos = [target_path]
            sync_task = (foto_url, target_path)

        data_item = {
            "id": row["id"],
            "name": nombre,
            "species": normalize_species(row["especie"]),
            "breed": raza,
            "color": color_detalles[:255] if color_detalles and len(color_detalles) > 255 else color_detalles,
            "description": description,
            "photos": photos,
            "state": state,
            "city": city,
            "sector": sector,
            "is_imported": True,
            "is_approved": True,
            "estatus_csv": row.get("estatus"),
            "last_seen_csv": last_seen,
            "reporter_name_csv": row.get("informante_nombre"),
            "phone_csv": phone,
            "email_csv": email,
            "created_at_csv": created,
            "sync_task": sync_task
        }
        rows_to_sync.append(data_item)

print(f"Total filas cargadas: {len(rows_to_sync)}")

# Sincronizar imágenes en paralelo
print("Sincronizando imágenes con Supabase Storage (15 hilos)...")
sync_success = 0
sync_skipped = 0

tasks = [r["sync_task"] for r in rows_to_sync if r["sync_task"]]

with ThreadPoolExecutor(max_workers=15) as executor:
    futures = {executor.submit(sync_image, task[0], task[1]): task for task in tasks}
    for future in as_completed(futures):
        task = futures[future]
        result = future.result()
        if result:
            sync_success += 1
        if sync_success % 50 == 0:
            print(f"Progreso imágenes: {sync_success} / {len(tasks)} sincronizadas.")

print(f"Sincronización completa: {sync_success} exitosas.")

# Preparar e insertar en base de datos
lost_pets = []
found_pets = []

for item in rows_to_sync:
    db_item = {
        "id": item["id"],
        "name": item["name"],
        "species": item["species"],
        "breed": item["breed"],
        "color": item["color"],
        "description": item["description"],
        "photos": item["photos"],
        "state": item["state"],
        "city": item["city"],
        "sector": item["sector"],
        "is_imported": True,
        "is_approved": True,
    }
    if item["created_at_csv"]:
        db_item["created_at"] = item["created_at_csv"]

    if item["estatus_csv"] == "Perdido":
        db_item["status"] = "activa"
        db_item["last_seen_at"] = item["last_seen_csv"]
        db_item["reporter_name"] = sanitize_reporter_name(item["reporter_name_csv"])
        db_item["reporter_phone"] = item["phone_csv"]
        db_item["reporter_email"] = item["email_csv"]
        lost_pets.append(db_item)
    else:
        db_item["status"] = "en_resguardo"
        db_item["found_at"] = item["last_seen_csv"]
        db_item["finder_name"] = sanitize_reporter_name(item["reporter_name_csv"])
        db_item["finder_phone"] = item["phone_csv"]
        db_item["finder_email"] = item["email_csv"]
        found_pets.append(db_item)

# Insertar registros en lotes
def send_batch(table, items):
    url = f"{supabase_url}/rest/v1/{table}"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates, return=minimal"
    }
    
    batch_size = 50
    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        body = json.dumps(batch).encode("utf-8")
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as res:
                pass
            print(f"Insertados {i + len(batch)} / {len(items)} en {table}")
        except urllib.error.HTTPError as e:
            print(f"Error HTTP al insertar en {table}: {e.code} - {e.read().decode('utf-8')}")
            continue
        except Exception as e:
            print(f"Error al insertar en {table}: {e}")
            continue

print("Insertando reportes de mascotas perdidas...")
send_batch("lost_pets", lost_pets)

print("Insertando reportes de mascotas encontradas...")
send_batch("found_pets", found_pets)

print("¡Proceso de importación con imágenes localizadas completo!")
