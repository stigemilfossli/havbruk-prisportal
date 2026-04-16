# Sikkerhetsforbedringer for Havbruk Prisportal

Dette dokumentet beskriver de sikkerhetsforbedringene som er implementert i systemet.

## Implementerte Forbedringer

### 1. Autentisering og Tokens
- **Problem**: Tokens ble lagret i localStorage (utsatt for XSS)
- **Løsning**: Implementert httpOnly cookies for tokens
- **Backend endringer**:
  - `/api/auth/login` og `/api/auth/register` setter nå httpOnly cookies
  - `auth_service.py` henter tokens fra både cookies og Authorization header
  - `secure=True` flag for produksjon (krever HTTPS)
  - `samesite="lax"` for CSRF-beskyttelse

### 2. Hemmelige Nøkler
- **Problem**: Default verdier for SECRET_KEY i kode
- **Løsning**: Krever at SECRET_KEY må være satt som miljøvariabel
- **Endring**: `auth_service.py` vil nå feile hvis SECRET_KEY ikke er satt

### 3. CORS Konfigurasjon
- **Problem**: Løs CORS-konfigurasjon
- **Løsning**: Strengere CORS-konfigurasjon:
  - Spesifikke HTTP-metoder (GET, POST, PUT, DELETE, OPTIONS)
  - Spesifikke headers (Content-Type, Authorization, Accept)
  - Preflight-cache på 10 minutter
  - Sikker parsing av ALLOWED_ORIGINS

### 4. Rate Limiting
- **Problem**: Ingen beskyttelse mot brute force-angrep
- **Løsning**: Implementert rate limiting middleware:
  - 5 login-forsøk per 5 minutter
  - 3 registreringer per time
  - 100 forespørsler per minutt for andre endepunkter
  - Rate limit headers i responser

### 5. Logging og Monitoring
- **Problem**: print() statements i produksjonskode
- **Løsning**: Strukturert logging:
  - Roterende loggfiler (10 MB maks, 5 backup)
  - Konsoll- og fil-logging
  - Helse-endepunkt (`/health`) for monitoring
  - Database-tilkoblingssjekk

### 6. Feilhåndtering
- **Problem**: `alert()` i frontend for feilmeldinger
- **Løsning**: Toast-notifikasjonssystem:
  - Reusable Toast-komponent
  - Type-safe meldingstyper (success, error, info, warning)
  - Automatisk fjerning etter timeout

### 7. Docker og Miljøvariabler
- **Problem**: Manglende miljøvariabler i docker-compose
- **Løsning**: Oppdatert docker-compose.yml:
  - Inkludert API_KEY og SECRET_KEY
  - Fjernet default verdier for sikkerhetsnøkler

## Tekniske Detaljer

### Backend Endringer
1. **`auth_service.py`**:
   - Krever SECRET_KEY miljøvariabel
   - Støtter tokens fra både cookies og headers
   - Forbedret feilhåndtering

2. **`main.py`**:
   - Strengere CORS-konfigurasjon
   - Rate limiting middleware
   - Logging-integrasjon
   - Helse-endepunkt

3. **`auth.py`**:
   - httpOnly cookie-støtte for login/register
   - Cookie-støtte for logout

4. **Nye filer**:
   - `middleware/rate_limit.py` - Rate limiting implementasjon
   - `logging_config.py` - Logging-konfigurasjon
   - `SECURITY_IMPROVEMENTS.md` - Denne dokumentasjonen

### Frontend Endringer
1. **`auth.ts`**:
   - Fjernet localStorage token-lagring
   - Støtter cookie-basert autentisering

2. **`api.ts`**:
   - `credentials: 'include'` for alle forespørsler
   - Fjernet Authorization header (bruker cookies)

3. **`AuthContext.tsx`**:
   - Oppdatert for cookie-basert logout
   - Bedre feilhåndtering

4. **Nye komponenter**:
   - `Toast.tsx` - Notifikasjonssystem
   - Integrert i layout for global tilgang

## Konfigurasjon for Produksjon

### Miljøvariabler
```bash
# Backend .env
SECRET_KEY=generer-med-openssl-rand-hex-32
API_KEY=generer-med-openssl-rand-hex-32
ALLOWED_ORIGINS=https://din-domene.no,https://www.din-domene.no
```

### HTTPS
For produksjon må du:
1. Konfigurere HTTPS (Let's Encrypt eller lignende)
2. Sette `secure=True` i cookie-konfigurasjonen
3. Oppdatere BASE_URL til HTTPS

### Database
Vurder å bytte fra SQLite til PostgreSQL for:
- Bedre samtidighet
- Replikasjon og backup
- Produksjonsklarhet

## Testing

Test følgende scenarioer:

1. **Autentisering**:
   - Login med cookies
   - Logout (cookie skal slettes)
   - Token-verifisering

2. **Rate Limiting**:
   - 6 login-forsøk på 5 minutter skal blokkeres
   - 4 registreringer på time skal blokkeres

3. **CORS**:
   - Forespørsler fra ikke-autoriserte domener skal avvises
   - Preflight-forespørsler skal fungere

4. **Logging**:
   - Loggfiler skal opprettes i `logs/` mappen
   - Helse-endepunktet skal returnere status

## Fremtidige Forbedringer

1. **Redis for Rate Limiting**:
   - Distribuert rate limiting for skalerbarhet
   - Persistert state mellom omstarter

2. **Input Validering**:
   - Pydantic validators for alle inputs
   - SQL injection prevention

3. **Security Headers**:
   - CSP (Content Security Policy)
   - HSTS (HTTP Strict Transport Security)
   - X-Frame-Options

4. **Monitoring**:
   - Metrikker (Prometheus/Grafana)
   - Alerting ved feil
   - Performance monitoring

## Rollback

Hvis du trenger å rulle tilbake:
1. Gjennopprett gamle versjoner av `auth_service.py` og `auth.py`
2. Fjern `middleware/rate_limit.py` og `logging_config.py`
3. Gjennopprett frontend auth-komponenter
4. Fjern Toast-komponenten fra layout

## Kontakt

For spørsmål om sikkerhetsforbedringene, kontakt systemadministrator eller utviklerteamet.