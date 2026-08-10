import os
import re
import json
import base64
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

# 1. Leer credenciales de pet-rescue-venezuela (.env.local)
target_supabase_url = None
target_supabase_key = None

if os.path.exists(".env.local"):
    with open(".env.local", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                target_supabase_url = line.split("=", 1)[1].strip()
            elif line.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY="):
                target_supabase_key = line.split("=", 1)[1].strip()

if not target_supabase_url or not target_supabase_key:
    print("Error: No se pudieron leer las credenciales del proyecto destino en .env.local")
    exit(1)

# Credenciales de venezuelatenecesita (origen)
source_supabase_url = "https://dpkhigawatvmaiflxfrz.supabase.co"
source_supabase_key = "sb_publishable_VoQJgHaRKolImVDprNAMNQ_EGfhwRYD"

print(f"Origen: {source_supabase_url}")
print(f"Destino: {target_supabase_url}")

# Normalizaciones y Saneamiento
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

def escape(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "true" if val else "false"
    return f"'{str(val).replace("'", "''")}'"

def escape_array(arr):
    if not arr:
        return "'{}'::text[]"
    escaped_items = ", ".join(f"'{item.replace("'", "''")}'" for item in arr)
    return f"ARRAY[{escaped_items}]::text[]"

# Verificar si el archivo ya existe en Supabase Storage
def check_file_exists(path):
    public_url = f"{target_supabase_url}/storage/v1/object/public/pet-photos/{path}"
    req = urllib.request.Request(public_url, method="HEAD")
    try:
        with urllib.request.urlopen(req) as res:
            return res.status == 200
    except Exception:
        return False

# Descargar/decodificar y subir imagen a Supabase Storage
def upload_image(data_or_url, target_path):
    if check_file_exists(target_path):
        return True # Ya existe
    
    # Obtener bytes
    if data_or_url.startswith("data:image/"):
        # Base64
        try:
            header, encoded = data_or_url.split(",", 1)
            image_data = base64.b64decode(encoded)
        except Exception as e:
            print(f"Error al decodificar base64 para {target_path}: {e}")
            return False
    else:
        # URL externa
        try:
            req_down = urllib.request.Request(data_or_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req_down) as res:
                image_data = res.read()
        except Exception as e:
            print(f"Error al descargar {data_or_url}: {e}")
            return False

    # Subir
    upload_url = f"{target_supabase_url}/storage/v1/object/pet-photos/{target_path}"
    headers = {
        "apikey": target_supabase_key,
        "Authorization": f"Bearer {target_supabase_key}",
        "Content-Type": "image/webp"
    }
    req_up = urllib.request.Request(upload_url, data=image_data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req_up) as res:
            return True
    except Exception as e:
        print(f"Error al subir a {target_path}: {e}")
        return False

# 2. Descargar todos los registros de venezuelatenecesita
print("Descargando registros de venezuelatenecesita...")
source_pets = []
offset = 0
while True:
    url = f"{source_supabase_url}/rest/v1/mascotas?select=*&limit=1000&offset={offset}"
    headers = {"apikey": source_supabase_key, "Authorization": f"Bearer {source_supabase_key}"}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            batch = json.loads(res.read().decode('utf-8'))
        if not batch:
            break
        source_pets.extend(batch)
        offset += 1000
    except Exception as e:
        print(f"Error al descargar lote: {e}")
        break

print(f"Total registros descargados: {len(source_pets)}")

# 3. Sincronizar imágenes
print("Sincronizando imágenes concurrentemente...")
sync_tasks = []
for pet in source_pets:
    foto = pet.get("foto_url")
    if not foto:
        continue
        
    ext = "webp"
    if foto.startswith("data:image/"):
        header = foto.split(";")[0]
        ext = header.split("/")[-1]
        
    folder = "lost" if pet.get("estatus") == "Perdido" else "found"
    filename = f"{pet['id']}.{ext}"
    target_path = f"{folder}/{filename}"
    
    pet["target_path"] = target_path
    sync_tasks.append((foto, target_path))

sync_success = 0
with ThreadPoolExecutor(max_workers=20) as executor:
    futures = {executor.submit(upload_image, t[0], t[1]): t for t in sync_tasks}
    for future in as_completed(futures):
        result = future.result()
        if result:
            sync_success += 1
        if sync_success % 100 == 0:
            print(f"Progreso imágenes: {sync_success} / {len(sync_tasks)} sincronizadas.")

print(f"Imágenes sincronizadas con éxito: {sync_success}")

# 4. Generar SQL de inserción
print("Generando sentencias SQL...")
sql_statements = []

for pet in source_pets:
    nombre = sanitize_name(pet.get("nombre"))
    
    color_detalles = pet.get("color_detalles")
    if color_detalles:
        color_detalles = color_detalles.strip()
    else:
        color_detalles = None
        
    raza = pet.get("raza")
    if raza:
        raza = raza.strip()
    else:
        raza = None
    
    description = color_detalles or "Sin descripción detallada disponible."
    if len(description) > 4000:
        description = description[:4000]

    last_seen = pet.get("fecha_contacto_perdido")
    created = pet.get("creado_en")
    
    state = normalize_state(pet.get("ultimo_visto_estado", ""))
    city = sanitize_city(pet.get("ultimo_visto_detalles", ""))
    sector = city

    phone = sanitize_phone(pet.get("informante_telefono"))
    email = sanitize_email(pet.get("informante_email"))
    
    if not phone and not email:
        email = "importado@mascotas.venezuelareporta.org"

    photos = [pet["target_path"]] if pet.get("target_path") else []
    estatus = pet.get("estatus")

    if estatus == "Perdido":
        cols = ["id", "name", "species", "breed", "color", "description", "photos", "state", "city", "sector", "is_imported", "is_approved", "status", "last_seen_at", "reporter_name", "reporter_phone", "reporter_email"]
        vals = [
            escape(pet["id"]),
            escape(nombre),
            escape(normalize_species(pet["especie"])),
            escape(raza),
            escape(color_detalles[:255] if color_detalles and len(color_detalles) > 255 else color_detalles),
            escape(description),
            escape_array(photos),
            escape(state),
            escape(city),
            escape(sector),
            "true",
            "true",
            escape("activa"),
            escape(last_seen),
            escape(sanitize_reporter_name(pet.get("informante_nombre"))),
            escape(phone),
            escape(email)
        ]
        if created:
            cols.append("created_at")
            vals.append(escape(created))
        
        sql = f"INSERT INTO public.lost_pets ({', '.join(cols)}) VALUES ({', '.join(vals)}) ON CONFLICT (id) DO NOTHING;"
        sql_statements.append(sql)
    else:
        # Encontrado o A Salvo (lo mapeamos a found_pets por defecto)
        status_val = "en_resguardo" if estatus == "Encontrado" else "reunida"
        cols = ["id", "name", "species", "breed", "color", "description", "photos", "state", "city", "sector", "is_imported", "is_approved", "status", "found_at", "finder_name", "finder_phone", "finder_email"]
        vals = [
            escape(pet["id"]),
            escape(nombre),
            escape(normalize_species(pet["especie"])),
            escape(raza),
            escape(color_detalles[:255] if color_detalles and len(color_detalles) > 255 else color_detalles),
            escape(description),
            escape_array(photos),
            escape(state),
            escape(city),
            escape(sector),
            "true",
            "true",
            escape(status_val),
            escape(last_seen),
            escape(sanitize_reporter_name(pet.get("informante_nombre"))),
            escape(phone),
            escape(email)
        ]
        if created:
            cols.append("created_at")
            vals.append(escape(created))
            
        sql = f"INSERT INTO public.found_pets ({', '.join(cols)}) VALUES ({', '.join(vals)}) ON CONFLICT (id) DO NOTHING;"
        sql_statements.append(sql)

os.makedirs("scratch", exist_ok=True)
with open("scratch/import.sql", "w", encoding="utf-8") as out:
    out.write("\n".join(sql_statements))

print(f"Generado scratch/import.sql con {len(sql_statements)} sentencias SQL.")
