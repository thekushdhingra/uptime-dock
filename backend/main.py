from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
from sqlalchemy import Column, Integer, String, TIMESTAMP
import httpx
from contextlib import asynccontextmanager
import asyncio
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi.openapi.docs import get_swagger_ui_html
from datetime import datetime
from typing import Optional
from enum import Enum



scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(ping_all_urls_sync, IntervalTrigger(minutes=30), id="ping_job", replace_existing=True)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(lifespan=lifespan, title="Uptime Dock", docs_url=None)


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



async def fetch_and_store_ping(url_obj):
    async with httpx.AsyncClient(follow_redirects=False) as client:
        try:
            response = await client.get(url_obj.url, timeout=5)
            status_code = response.status_code
        except Exception:
            status_code = None
            response = None

    db = SessionLocal()


    if status_code == 301 and response is not None:
        new_url = response.headers.get("location")
        if new_url:
        
            db_url_obj = db.query(URL).filter(URL.id == url_obj.id).first()
            if db_url_obj:
                old_url = db_url_obj.url
                db_url_obj.url = new_url
                db.commit()

            
                db.query(Ping).filter(Ping.url == old_url).update({Ping.url: new_url})
                db.commit()

            
                url_obj.url = new_url


    ping = Ping(
        name=url_obj.name,
        url=url_obj.url,
        status_code=status_code,
        time_checked_at=datetime.now()
    )
    db.add(ping)
    db.commit()
    db.refresh(ping)
    ping_id = ping.id

    db.close()
    return {
        "id": ping_id,
        "name": url_obj.name,
        "url": url_obj.url,
        "status_code": status_code
    }




def ping_all_urls_sync():
    asyncio.run(ping_all_urls())


async def ping_all_urls():
    db = SessionLocal()
    urls = db.query(URL).all()
    db.close()
    tasks = [fetch_and_store_ping(url_obj) for url_obj in urls]
    await asyncio.gather(*tasks)



@app.get("/health")
def health_check():
    return {"status": "running", "status_code": 200}


@app.get("/ping")
async def ping_all(db: Session = Depends(get_db)):
    urls = db.query(URL).all()
    tasks = [fetch_and_store_ping(url_obj) for url_obj in urls]
    results = await asyncio.gather(*tasks)
    return {"msg": "pong", "results": results}


class Action(str, Enum):
    add = "add"
    delete = "delete"
    edit = "edit"


@app.get("/get-urls")
def get_all_urls(db: Session = Depends(get_db)):
    urls = [{"id": u.id, "name": u.name, "url": u.url} for u in db.query(URL).all()]
    if urls:
        return urls
    else:
        return "No URLS found!"
@app.get("/url")
def url_actions(action: Action, id: Optional[int] = None, name: Optional[str] = None, url: Optional[str] = None, db: Session = Depends(get_db)):
    if action == Action.add:
        if not url or not name:
            raise HTTPException(status_code=400, detail="Name and URL are required for adding.")
        existing = db.query(URL).filter(URL.name == name).first()
        if existing:
            raise HTTPException(status_code=400, detail="URL with this name already exists.")
        new_url = URL(name=name, url=url)
        db.add(new_url)
        db.commit()
        db.refresh(new_url)
        return {"msg": "URL added.", "url": {"id": new_url.id, "name": new_url.name, "url": new_url.url}}

    if not id:
        raise HTTPException(status_code=400, detail="ID is required for this action.")

    url_obj = db.query(URL).filter(URL.id == id).first()
    if not url_obj:
        raise HTTPException(status_code=404, detail="URL with this ID does not exist.")

    if action == Action.delete:
        db.delete(url_obj)
        db.commit()
        return {"msg": "URL deleted."}

    elif action == Action.edit:
        if not url:
            raise HTTPException(status_code=400, detail="URL is required for editing.")
        url_obj.url = url  # type: ignore
        db.commit()
        db.refresh(url_obj)
        return {"msg": "URL updated.", "url": {"id": url_obj.id, "name": url_obj.name, "url": url_obj.url}}


        

@app.get("/pings")
def get_pings(url: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Ping)
    if url:
        query = query.filter(Ping.url == url)
    pings = query.order_by(Ping.time_checked_at.desc()).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "url": p.url,
            "status_code": p.status_code,
            "time_checked_at": p.time_checked_at
        }
        for p in pings
    ]



@app.get("/dashboard")
def dashboard_stats(db: Session = Depends(get_db)):
    urls = db.query(URL).all()
    pings: list[Ping] = db.query(Ping).all()

    total_urls = len(urls)
    total_pings = len(pings)

    valid_pings = [p for p in pings if p.status_code is not None]
    down_pings = [p for p in valid_pings if p.status_code >= 400] # type: ignore
    total_down = len(down_pings)

    avg_status = (
        round(sum(p.status_code for p in valid_pings) / len(valid_pings), 2)  # type: ignore
        if valid_pings else 0
    )

    uptime_percent = (
        round(float((1 - (total_down / len(valid_pings))) * 100), 1)
        if valid_pings else 0.0
    )

    down_minutes = 0.0
    sorted_pings = sorted(valid_pings, key=lambda p: p.time_checked_at) # type: ignore

    for i in range(1, len(sorted_pings)):
        prev = sorted_pings[i - 1]
        curr = sorted_pings[i]
        if prev.status_code >= 400 and curr.status_code >= 400:
            t1 = prev.time_checked_at
            t2 = curr.time_checked_at
            down_minutes += (t2 - t1).total_seconds() / 60

    return {
        "total_urls": total_urls,
        "total_pings": total_pings,
        "downtime_minutes": round(down_minutes),
        "uptime_percent": uptime_percent,
        "avg_status": avg_status,
    }
