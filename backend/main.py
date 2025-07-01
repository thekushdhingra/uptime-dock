from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
from sqlalchemy import Column, Integer, String, TIMESTAMP
import httpx
from contextlib import asynccontextmanager
import asyncio
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
from typing import Optional



@asynccontextmanager
async def lifespan(app: FastAPI):
    # On start of app
    scheduler.add_job(ping_all_urls, IntervalTrigger(minutes=30), id="ping_job", replace_existing=True)
    scheduler.start()
    yield
    # On app ending
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

scheduler = BackgroundScheduler()

class Ping(Base):
    __tablename__ = "pings"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    url = Column(String)
    status_code = Column(Integer)
    time_checked_at = Column(TIMESTAMP)

class URL(Base):
    __tablename__ = "urls"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    url = Column(String)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ping_all_urls():
    db = SessionLocal()
    urls = db.query(URL).all()

    async def fetch_status(url_obj):
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url_obj.url, timeout=5)
                status_code = response.status_code
            except Exception:
                status_code = None
        ping = Ping(
            name=url_obj.name,
            url=url_obj.url,
            status_code=status_code,
            time_checked_at=datetime.now()
        )
        db.add(ping)
        db.commit()

    async def run():
        tasks = [fetch_status(url_obj) for url_obj in urls]
        await asyncio.gather(*tasks)

    
    asyncio.run(run())
    db.close()



    


@app.get("/ping")
async def ping(db: Session = Depends(get_db)):
    urls = db.query(URL).all()

    async def fetch_status(url_obj):
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url_obj.url, timeout=5)
                status_code = response.status_code
            except Exception:
                status_code = None
        ping = Ping(
            name=url_obj.name,
            url=url_obj.url,
            status_code=status_code,
            time_checked_at=datetime.now()
        )
        db.add(ping)
        db.commit()
        db.refresh(ping)
        return {
            "id": ping.id,
            "name": url_obj.name,
            "url": url_obj.url,
            "status_code": status_code
        }

    tasks = [fetch_status(url_obj) for url_obj in urls]
    results = await asyncio.gather(*tasks)
    return {"msg": "pong", "results": results}


@app.get("/url")
def url_actions(action: str, name: str, url: Optional[str], db: Session = Depends(get_db)):
    if action.lower() == "add":
        if not url:
            return {"error": "URL is required for adding."}
        existing = db.query(URL).filter(URL.name == name).first()
        if existing:
            return {"error": "URL with this name already exists."}
        new_url = URL(name=name, url=url)
        db.add(new_url)
        db.commit()
        db.refresh(new_url)
        return {"msg": "URL added.", "url": {"id": new_url.id, "name": new_url.name, "url": new_url.url}}

    elif action.lower() == "delete":
        url_obj = db.query(URL).filter(URL.name == name).first()
        if not url_obj:
            return {"error": "URL with this name does not exist."}
        db.delete(url_obj)
        db.commit()
        return {"msg": "URL deleted."}

    elif action.lower() == "edit":
        if not url:
            return {"error": "URL is required for editing."}
        url_obj = db.query(URL).filter(URL.name == name).first()
        if not url_obj:
            return {"error": "URL with this name does not exist."}
        # Ignore errors by type checkers
        # type: ignore[attr-defined]
        url_obj.url = url # type: ignore  
        db.commit()
        db.refresh(url_obj)
        return {"msg": "URL updated.", "url": {"id": url_obj.id, "name": url_obj.name, "url": url_obj.url}}

    else:
        return {"error": "Invalid action, choose between add, delete or edit in parameter of action!"}
