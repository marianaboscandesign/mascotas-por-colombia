import os
import urllib.request

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

# Descargar una imagen de prueba
image_url = "https://media.huellascan.com/uploads/earthquake/8cacbfb3-a999-4738-8623-a9249b4aa256.webp"
try:
    print(f"Descargando {image_url}...")
    req_down = urllib.request.Request(
        image_url, 
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req_down) as res:
        data = res.read()
except Exception as e:
    print(f"Error al descargar: {e}")
    exit(1)

# Subir a Supabase Storage
upload_url = f"{supabase_url}/storage/v1/object/pet-photos/lost/test_import_8cacbfb3.webp"
headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "image/webp"
}

print(f"Subiendo a storage: {upload_url}...")
req_up = urllib.request.Request(upload_url, data=data, headers=headers, method="POST")
try:
    with urllib.request.urlopen(req_up) as res:
        print("Subido con éxito!")
        print(res.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print(f"Error HTTP al subir: {e.code} - {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error general al subir: {e}")
