import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_to_supabase(path: str, file_bytes: bytes) -> str:
    # ✅ Determine content-type from file extension
    if path.endswith(".png"):
        content_type = "image/png"
    elif path.endswith(".mp4"):
        content_type = "video/mp4"
    elif path.endswith(".mp3"):
        content_type = "audio/mpeg"
    else:
        content_type = "application/octet-stream"

    # ✅ Upload to Supabase
    response = supabase.storage.from_("heatmaps").upload(
        path,
        file_bytes,
        {"content-type": content_type}
    )

    # ⚠️ response is NOT a dict, so check .status_code instead
    if hasattr(response, "status_code") and response.status_code >= 400:
        raise Exception(f"Upload failed: {response.text}")

    # ✅ Return the public URL
    return supabase.storage.from_("heatmaps").get_public_url(path)
