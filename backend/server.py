from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import json
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Annotated
from urllib.parse import urlparse

import bcrypt
import jwt
import requests
from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("bailina")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
app = FastAPI()
api = APIRouter(prefix="/api")

CORS_ORIGINS = [o.strip() for o in os.environ["CORS_ORIGINS"].split(",")]
JWT_ALG = "HS256"
APP_NAME = "bailina-sing-play"

# ---------- Models ----------
PyObjectId = Annotated[str, BeforeValidator(str)]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    @classmethod
    def from_mongo(cls, doc):
        return cls.model_validate(doc) if doc else None

    def to_mongo(self):
        return self.model_dump(exclude={"id"})


class Line(BaseModel):
    es: str = ""
    de: str = ""


class Word(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    es: str = ""
    de: str = ""
    image_key: str = ""
    icon: str = "Sparkles"
    audio_url: str = ""
    reviewed: bool = False
    placeholder: bool = False


class StoryStep(BaseModel):
    es: str = ""
    de: str = ""
    image_key: str = ""
    icon: str = "Sparkles"


class Story(BaseModel):
    title_es: str = ""
    title_de: str = ""
    steps: List[StoryStep] = []


class Song(BaseModel):
    title_es: str = ""
    title_de: str = ""
    audio_url: str = ""
    placeholder: bool = True
    lines: List[Line] = []


class Welcome(BaseModel):
    audio_url: str = ""
    lines: List[Line] = []


class Activity(BaseModel):
    title: str = ""
    booklet_ref: str = ""
    placeholder: bool = True
    tasks: List[str] = []


class WorldIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    subtitle: str = ""
    icon: str = "Sparkles"
    order: int = 99
    published: bool = False
    review_note: str = ""
    welcome: Welcome = Welcome()
    words: List[Word] = []
    story: Story = Story()
    song: Song = Song()
    activity: Activity = Activity()


class World(BaseDocument, WorldIn):
    slug: str
    updated_at: str = ""


class ImageAsset(BaseDocument):
    key: str
    label: str = ""
    url: str = ""
    source: str = "generated"
    status: str = "pending"
    updated_at: str = ""


class FileRecord(BaseDocument):
    file_id: str
    storage_path: str
    content_type: str
    original_filename: str = ""
    size: int = 0
    kind: str
    public: bool = False
    is_deleted: bool = False
    created_at: str = ""


class LoginIn(BaseModel):
    email: str
    password: str


class NewWorldIn(BaseModel):
    slug: str
    title: str


class NewImageIn(BaseModel):
    key: str
    label: str = ""


class StatusIn(BaseModel):
    status: str


# ---------- Auth ----------
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p: str, h: str) -> bool:
    return bcrypt.checkpw(p.encode(), h.encode())


def make_token(user_id: str, kind: str, delta: timedelta) -> str:
    payload = {"sub": user_id, "type": kind, "exp": datetime.now(timezone.utc) + delta}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALG)


def set_cookie(resp: Response, name: str, value: str, max_age: int):
    resp.set_cookie(name, value, httponly=True, secure=True, samesite="none", max_age=max_age, path="/")


def issue_tokens(resp: Response, user_id: str):
    set_cookie(resp, "access_token", make_token(user_id, "access", timedelta(minutes=15)), 900)
    set_cookie(resp, "refresh_token", make_token(user_id, "refresh", timedelta(days=7)), 604800)


async def user_from_request(request: Request):
    token = request.cookies.get("access_token")
    auth = request.headers.get("Authorization", "")
    if not token and auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        return None
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALG])
    except jwt.InvalidTokenError:
        return None
    if payload.get("type") != "access":
        return None
    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(payload["sub"]), "role": "admin"})
    if not user:
        return None
    return {"id": str(user["_id"]), "email": user["email"], "name": user.get("name", "Admin"), "role": "admin"}


def check_origin(request: Request):
    origin = request.headers.get("origin")
    if not origin:
        return
    host = urlparse(origin).netloc
    allowed = {request.headers.get("x-forwarded-host"), request.headers.get("host"),
               urlparse(os.environ.get("FRONTEND_URL", "")).netloc}
    allowed |= {urlparse(o).netloc for o in CORS_ORIGINS if o != "*"}
    if host not in allowed:
        raise HTTPException(status_code=403, detail="Ungültige Herkunft der Anfrage")


async def require_admin(request: Request):
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        check_origin(request)
    user = await user_from_request(request)
    if not user:
        raise HTTPException(status_code=401, detail="Bitte als Betreiber anmelden")
    return user


@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.strip().lower()
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "?").split(",")[0]
    ident = f"{ip}:{email}"
    att = await db.login_attempts.find_one({"identifier": ident})
    if att and att.get("count", 0) >= 5 and att.get("locked_until", "") > now_iso():
        raise HTTPException(status_code=429, detail="Zu viele Versuche. Bitte in 15 Minuten erneut versuchen.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        count = (att or {}).get("count", 0) + 1
        locked = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat() if count >= 5 else ""
        await db.login_attempts.update_one({"identifier": ident}, {"$set": {"count": count, "locked_until": locked}}, upsert=True)
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort ist falsch")
    await db.login_attempts.delete_one({"identifier": ident})
    issue_tokens(response, str(user["_id"]))
    return {"id": str(user["_id"]), "email": user["email"], "name": user.get("name", "Admin"), "role": user["role"]}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/", secure=True, samesite="none")
    response.delete_cookie("refresh_token", path="/", secure=True, samesite="none")
    return {"ok": True}


@api.get("/auth/me")
async def me(user=Depends(require_admin)):
    return user


@api.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Nicht angemeldet")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALG])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Sitzung abgelaufen")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Ungültiges Token")
    set_cookie(response, "access_token", make_token(payload["sub"], "access", timedelta(minutes=15)), 900)
    return {"ok": True}


# ---------- Object storage ----------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
storage_key = None
media_cache: dict = {}


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    r = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": os.environ["EMERGENT_LLM_KEY"]}, timeout=30)
    r.raise_for_status()
    storage_key = r.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    r = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage(), "Content-Type": content_type}, data=data, timeout=120)
    if r.status_code == 404:
        r = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage(True), "Content-Type": content_type}, data=data, timeout=120)
    r.raise_for_status()
    return r.json()


def get_object(path: str) -> bytes:
    r = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage()}, timeout=60)
    if r.status_code == 404:
        r = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage(True)}, timeout=60)
    r.raise_for_status()
    return r.content


AUDIO_TYPES = {"mp3": "audio/mpeg"}
IMAGE_TYPES = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"}


async def store_upload(file: UploadFile, kind: str) -> FileRecord:
    types, limit = (AUDIO_TYPES, 20) if kind == "audio" else (IMAGE_TYPES, 8)
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in types:
        raise HTTPException(status_code=400, detail=f"Nur {', '.join(t.upper() for t in types)}-Dateien erlaubt")
    data = await file.read()
    if len(data) > limit * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Datei ist größer als {limit} MB")
    if not data:
        raise HTTPException(status_code=400, detail="Datei ist leer")
    file_id = uuid.uuid4().hex
    path = f"{APP_NAME}/{kind}/{file_id}.{ext}"
    try:
        result = await run_in_threadpool(put_object, path, data, types[ext])
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=502, detail="Speichern der Datei fehlgeschlagen")
    rec = FileRecord(file_id=file_id, storage_path=result["path"], content_type=types[ext], original_filename=file.filename or "",
                     size=len(data), kind=kind, public=(kind == "audio"), created_at=now_iso())
    await db.files.insert_one(rec.to_mongo())
    return rec


@api.get("/media/{file_id}")
async def media(file_id: str, request: Request):
    rec = FileRecord.from_mongo(await db.files.find_one({"file_id": file_id, "is_deleted": False}))
    if not rec:
        raise HTTPException(status_code=404, detail="Datei nicht gefunden")
    if not rec.public and not await user_from_request(request):
        raise HTTPException(status_code=404, detail="Datei nicht gefunden")
    data = media_cache.get(rec.storage_path)
    if data is None:
        data = await run_in_threadpool(get_object, rec.storage_path)
        if len(media_cache) > 40:
            media_cache.clear()
        media_cache[rec.storage_path] = data
    total = len(data)
    headers = {"Accept-Ranges": "bytes", "Cache-Control": "public, max-age=3600" if rec.public else "private, no-store"}
    m = re.match(r"bytes=(\d*)-(\d*)", request.headers.get("range", ""))
    if m and (m.group(1) or m.group(2)):
        if m.group(1):
            start = int(m.group(1))
            end = int(m.group(2)) if m.group(2) else total - 1
        else:
            start, end = max(0, total - int(m.group(2))), total - 1
        end = min(end, total - 1)
        if start >= total or start > end:
            return Response(status_code=416, headers={"Content-Range": f"bytes */{total}"})
        headers["Content-Range"] = f"bytes {start}-{end}/{total}"
        return Response(data[start:end + 1], status_code=206, media_type=rec.content_type, headers=headers)
    return Response(data, media_type=rec.content_type, headers=headers)


# ---------- Public content ----------
async def image_map(preview: bool):
    statuses = ["approved", "pending"] if preview else ["approved"]
    docs = await db.images.find({"status": {"$in": statuses}}).to_list(500)
    return {img.key: {"url": img.url, "status": img.status} for img in map(ImageAsset.from_mongo, docs) if img.url}


@api.get("/content")
async def content(request: Request):
    preview = bool(await user_from_request(request))
    query = {} if preview else {"published": True}
    worlds = [World.from_mongo(d).model_dump(exclude={"id"}) for d in await db.worlds.find(query).sort("order", 1).to_list(100)]
    return {"preview": preview, "worlds": worlds, "images": await image_map(preview)}


# ---------- Admin ----------
@api.get("/admin/worlds")
async def admin_worlds(_=Depends(require_admin)):
    return [World.from_mongo(d).model_dump(exclude={"id"}) for d in await db.worlds.find().sort("order", 1).to_list(100)]


@api.post("/admin/worlds")
async def admin_create_world(body: NewWorldIn, _=Depends(require_admin)):
    slug = re.sub(r"[^a-z0-9-]", "", body.slug.strip().lower())
    if not slug:
        raise HTTPException(status_code=400, detail="Kurzname nur mit a–z, 0–9 und -")
    if await db.worlds.find_one({"slug": slug}):
        raise HTTPException(status_code=409, detail="Diese Welt gibt es schon")
    world = World(slug=slug, title=body.title.strip() or slug, updated_at=now_iso())
    await db.worlds.insert_one(world.to_mongo())
    return world.model_dump(exclude={"id"})


@api.put("/admin/worlds/{slug}")
async def admin_update_world(slug: str, body: WorldIn, _=Depends(require_admin)):
    world = World(slug=slug, updated_at=now_iso(), **body.model_dump())
    res = await db.worlds.update_one({"slug": slug}, {"$set": world.to_mongo()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Welt nicht gefunden")
    return world.model_dump(exclude={"id"})


@api.post("/admin/audio")
async def admin_upload_audio(file: UploadFile = File(...), _=Depends(require_admin)):
    rec = await store_upload(file, "audio")
    return {"url": f"/api/media/{rec.file_id}", "filename": rec.original_filename}


@api.get("/admin/images")
async def admin_images(_=Depends(require_admin)):
    return [ImageAsset.from_mongo(d).model_dump(exclude={"id"}) for d in await db.images.find().sort("key", 1).to_list(500)]


@api.post("/admin/images")
async def admin_new_image(body: NewImageIn, _=Depends(require_admin)):
    key = re.sub(r"[^a-z0-9_]", "", body.key.strip().lower())
    if not key:
        raise HTTPException(status_code=400, detail="Schlüssel nur mit a–z, 0–9 und _")
    if await db.images.find_one({"key": key}):
        raise HTTPException(status_code=409, detail="Diesen Bild-Schlüssel gibt es schon")
    img = ImageAsset(key=key, label=body.label or key, source="upload", status="pending", updated_at=now_iso())
    await db.images.insert_one(img.to_mongo())
    return img.model_dump(exclude={"id"})


async def set_file_public(url: str, public: bool):
    if url.startswith("/api/media/"):
        await db.files.update_one({"file_id": url.rsplit("/", 1)[-1]}, {"$set": {"public": public}})


@api.patch("/admin/images/{key}")
async def admin_image_status(key: str, body: StatusIn, _=Depends(require_admin)):
    if body.status not in ("pending", "approved", "rejected"):
        raise HTTPException(status_code=400, detail="Unbekannter Status")
    img = ImageAsset.from_mongo(await db.images.find_one({"key": key}))
    if not img:
        raise HTTPException(status_code=404, detail="Bild nicht gefunden")
    if body.status == "approved" and not img.url:
        raise HTTPException(status_code=400, detail="Bitte zuerst ein Bild hochladen")
    await db.images.update_one({"key": key}, {"$set": {"status": body.status, "updated_at": now_iso()}})
    await set_file_public(img.url, body.status == "approved")
    img.status = body.status
    return img.model_dump(exclude={"id"})


@api.post("/admin/images/{key}/upload")
async def admin_image_upload(key: str, file: UploadFile = File(...), _=Depends(require_admin)):
    img = ImageAsset.from_mongo(await db.images.find_one({"key": key}))
    if not img:
        raise HTTPException(status_code=404, detail="Bild nicht gefunden")
    rec = await store_upload(file, "image")
    await set_file_public(img.url, False)
    img.url, img.source, img.status, img.updated_at = f"/api/media/{rec.file_id}", "upload", "pending", now_iso()
    await db.images.update_one({"key": key}, {"$set": img.to_mongo()})
    return img.model_dump(exclude={"id"})


# ---------- Startup ----------
async def seed():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.worlds.create_index("slug", unique=True)
    await db.images.create_index("key", unique=True)
    await db.files.create_index("file_id", unique=True)
    email, pw = os.environ["ADMIN_EMAIL"].lower(), os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({"email": email, "password_hash": hash_password(pw), "name": "Betreiber", "role": "admin", "created_at": now_iso()})
    elif not verify_password(pw, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(pw)}})
    data = json.loads((ROOT_DIR / "content" / "seed.json").read_text(encoding="utf-8"))
    for item in data["images"]:
        if not await db.images.find_one({"key": item["key"]}):
            await db.images.insert_one(ImageAsset(**item, source="generated", status="pending", updated_at=now_iso()).to_mongo())
    for item in data["worlds"]:
        if not await db.worlds.find_one({"slug": item["slug"]}):
            await db.worlds.insert_one(World(**item, updated_at=now_iso()).to_mongo())


@app.on_event("startup")
async def startup():
    await seed()
    try:
        await run_in_threadpool(init_storage)
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])
