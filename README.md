# Havbruk Prisportal

Norges prisportal for havbruksutstyr – sammenlign leverandørpriser og send tilbudsforespørsler.

## Funksjoner

- Søk og filtrer blant havbruksprodukter (slanger, rørdeler, tau, kjemikalier, pumper, ventiler, filtre, sikkerhetsutstyr)
- Se og sammenlign priser fra 25+ norske leverandører
- Send tilbudsforespørsler til leverandører via e-post (SendGrid)
- Leverandører svarer via unik lenke – svar lagres automatisk
- Prishistorikk og prissammenligning med graf
- Admin-panel for CRUD på produkter, leverandører og priser
- Automatisk priskraping fra nettbutikker (Ahlsell, Brødrene Dahl, Slangeportalen, ParkerStore)

## Kom i gang

### Forutsetninger

- Python 3.11+
- Node.js 20+
- (Valgfritt) Docker + Docker Compose

### 1. Backend

```bash
cd backend
cp .env.example .env
# Rediger .env med dine verdier

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API tilgjengelig på http://localhost:8000
Swagger-dokumentasjon: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Appen tilgjengelig på http://localhost:3000

### 3. Docker Compose (anbefalt)

```bash
cp backend/.env.example .env
# Sett SENDGRID_API_KEY o.l. i .env

docker-compose up --build
```

## Miljøvariabler

| Variabel | Beskrivelse | Standard |
|---|---|---|
| `SENDGRID_API_KEY` | SendGrid API-nøkkel for e-post | (tom = simulert) |
| `FROM_EMAIL` | Avsender-e-post | prisportal@yourdomain.no |
| `FROM_NAME` | Avsendernavn | Havbruk Prisportal |
| `BASE_URL` | Frontend URL (brukes i e-poster) | http://localhost:3000 |
| `DATABASE_URL` | SQLite- eller PostgreSQL-URL | sqlite:///./havbruk.db |
| `SECRET_KEY` | Hemmelig nøkkel for tokens | change-this-in-production |
| `NEXT_PUBLIC_API_URL` | Backend URL (frontend) | http://localhost:8000 |

## Prosjektstruktur

```
havbruk-prisportal/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI-app, oppstart, CORS
│   │   ├── database.py      # SQLAlchemy-tilkobling
│   │   ├── models.py        # DB-modeller
│   │   ├── schemas.py       # Pydantic-skjemaer
│   │   ├── seed.py          # 25+ leverandører + ~45 produkter
│   │   ├── routers/         # API-endepunkter
│   │   └── services/        # E-post + priskraping
│   └── requirements.txt
└── frontend/
    └── src/
        ├── app/             # Next.js 14 App Router
        ├── components/      # Gjenbrukbare komponenter
        └── lib/             # API-klient + TypeScript-typer
```

## Leverandørdatabase

Portalen inneholder 25 norske havbruksleverandører inkludert:

**Slanger:** TESS AS, Hydroscand Norge, Slangeportalen, Giske Servicebase GSB, ParkerStore/Haugrønning, Oldervik Service

**Rørdeler:** AKVA Group, GPA Flowsystem, SIMONA Stadpipe, KDA Rørsystemer, Brødrene Dahl, Ahlsell Norge, Otto Olsen, Aquaservice, SEG

**Tau og fortøyning:** ScaleAQ/Aqualine, Certex Norge, NOFI Tromsø, Egersund Group

**Kjemikalier:** Aquatiq, NOS Chemicals, Hjelle Kjemi, Normex, Chemco, Nippon Gases Norge

## Teknologi

- **Backend:** FastAPI, SQLAlchemy, SQLite, SendGrid, httpx, BeautifulSoup4
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Lucide
- **Infrastruktur:** Docker, Docker Compose
