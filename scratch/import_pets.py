import os
import csv
import json
import re
import urllib.request
import urllib.parse

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

print(f"Conectando a: {supabase_url}")

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

def parse_photos(url):
    if not url:
        return []
    return [url.strip()]

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

# Leer y mapear filas
lost_pets = []
found_pets = []

csv.field_size_limit(10000000)
with open("mascotas_rows.csv", "r", encoding="latin1") as f:
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
        
        # Garantizar al menos un medio de contacto
        if not phone and not email:
            email = "importado@mascotas.venezuelareporta.org"
            
        data_item = {
            "id": row["id"],
            "name": nombre,
            "species": normalize_species(row["especie"]),
            "breed": raza,
            "color": color_detalles[:255] if color_detalles and len(color_detalles) > 255 else color_detalles,
            "description": description,
            "photos": parse_photos(row["foto_url"]),
            "state": state,
            "city": city,
            "sector": sector,
            "is_imported": True,
            "is_approved": True,
        }
        
        if created:
            data_item["created_at"] = created

        estatus = row.get("estatus", "").strip()
        if estatus == "Perdido":
            data_item["status"] = "activa"
            data_item["last_seen_at"] = last_seen
            data_item["reporter_name"] = sanitize_reporter_name(row.get("informante_nombre"))
            data_item["reporter_phone"] = phone
            data_item["reporter_email"] = email
            lost_pets.append(data_item)
        else: # Encontrado
            data_item["status"] = "en_resguardo"
            data_item["found_at"] = last_seen
            data_item["finder_name"] = sanitize_reporter_name(row.get("informante_nombre"))
            data_item["finder_phone"] = phone
            data_item["finder_email"] = email
            found_pets.append(data_item)

print(f"Filas procesadas: Perdidos={len(lost_pets)}, Encontrados={len(found_pets)}")

# Función para enviar en lotes
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
            # Continuar con el siguiente lote
            continue
        except Exception as e:
            print(f"Error al insertar en {table}: {e}")
            continue

print("Enviando reportes de mascotas perdidas...")
send_batch("lost_pets", lost_pets)

print("Enviando reportes de mascotas encontradas...")
send_batch("found_pets", found_pets)

print("¡Importación completa!")
