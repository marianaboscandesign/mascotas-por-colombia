import os
import csv
import re

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

sql_statements = []

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
        
        # Garantizar al menos un medio de contacto
        if not phone and not email:
            email = "importado@mascotas.venezuelareporta.org"

        estatus = row.get("estatus", "").strip()
        
        foto_url = row.get("foto_url", "").strip()
        photos = []
        if foto_url:
            filename = foto_url.split("/")[-1]
            folder = "lost" if estatus == "Perdido" else "found"
            photos = [f"{folder}/{filename}"]

        if estatus == "Perdido":
            # lost_pets
            cols = ["id", "name", "species", "breed", "color", "description", "photos", "state", "city", "sector", "is_imported", "is_approved", "status", "last_seen_at", "reporter_name", "reporter_phone", "reporter_email"]
            vals = [
                escape(row["id"]),
                escape(nombre),
                escape(normalize_species(row["especie"])),
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
                escape(sanitize_reporter_name(row.get("informante_nombre"))),
                escape(phone),
                escape(email)
            ]
            if created:
                cols.append("created_at")
                vals.append(escape(created))
            
            sql = f"INSERT INTO public.lost_pets ({', '.join(cols)}) VALUES ({', '.join(vals)}) ON CONFLICT (id) DO NOTHING;"
            sql_statements.append(sql)
        else:
            # found_pets
            cols = ["id", "name", "species", "breed", "color", "description", "photos", "state", "city", "sector", "is_imported", "is_approved", "status", "found_at", "finder_name", "finder_phone", "finder_email"]
            vals = [
                escape(row["id"]),
                escape(nombre),
                escape(normalize_species(row["especie"])),
                escape(raza),
                escape(color_detalles[:255] if color_detalles and len(color_detalles) > 255 else color_detalles),
                escape(description),
                escape_array(photos),
                escape(state),
                escape(city),
                escape(sector),
                "true",
                "true",
                escape("en_resguardo"),
                escape(last_seen),
                escape(sanitize_reporter_name(row.get("informante_nombre"))),
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
