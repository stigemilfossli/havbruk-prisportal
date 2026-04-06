 det from sqlalchemy.orm import Session
from .models import Supplier, Product, Price
from datetime import datetime
import random
import logging

logger = logging.getLogger(__name__)


SUPPLIERS = [
    # ── Slanger ────────────────────────────────────────────────────────────────
    {"name": "TESS AS", "website": "https://tess.no", "email": "hitra@tess.no",
     "phone": "+47 72 44 01 00", "region": "Hitra/Sandstad + landsdekkende",
     "categories": ["Slanger", "Rørdeler", "Kjemikalier", "Smøremidler", "Verktøy", "Sikkerhetsutstyr"], "has_online_shop": False},
    {"name": "Hydroscand Norge", "website": "https://hydroscand.no", "email": "post@hydroscand.no",
     "phone": "+47 22 90 40 00", "region": "Landsdekkende",
     "categories": ["Slanger", "Rørdeler", "Smøremidler"], "has_online_shop": False},
    {"name": "Slangeportalen", "website": "https://slangeportalen.no", "email": "post@slangeportalen.no",
     "phone": "+47 55 39 50 00", "region": "Nettbutikk - landsdekkende",
     "categories": ["Slanger"], "has_online_shop": True},
    {"name": "Giske Servicebase GSB", "website": "https://gsbsupply.no", "email": "post@gsbsupply.no",
     "phone": "+47 70 18 75 00", "region": "Ålesund",
     "categories": ["Slanger", "Kjemikalier", "Smøremidler", "Verktøy", "Pumper", "Maling og bunnstoff"], "has_online_shop": False},
    {"name": "ParkerStore Trondheim/Haugrønning", "website": "https://haugronningshop.no", "email": "post@haugronningshop.no",
     "phone": "+47 73 82 45 00", "region": "Trondheim",
     "categories": ["Slanger", "Rørdeler", "Smøremidler"], "has_online_shop": True},
    {"name": "Oldervik Service", "website": "https://oldervikservice.no", "email": "post@oldervikservice.no",
     "phone": "+47 70 26 10 00", "region": "Ålesund/Vatne",
     "categories": ["Slanger"], "has_online_shop": False},
    # ── Rørdeler ───────────────────────────────────────────────────────────────
    {"name": "AKVA Group", "website": "https://akvagroup.com", "email": "post@akvagroup.com",
     "phone": "+47 51 77 85 00", "region": "Landsdekkende",
     "categories": ["Rørdeler", "Slanger", "Nøter og håver"], "has_online_shop": False},
    {"name": "GPA Flowsystem", "website": "https://gpa.no", "email": "post@gpa.no",
     "phone": "+47 55 19 60 00", "region": "Landsdekkende",
     "categories": ["Rørdeler", "Ventiler", "Pumper"], "has_online_shop": False},
    {"name": "SIMONA Stadpipe", "website": "https://simona-stadpipe.com", "email": "post@simona-stadpipe.com",
     "phone": "+47 70 04 80 00", "region": "Vestlandet",
     "categories": ["Rørdeler"], "has_online_shop": False},
    {"name": "KDA Rørsystemer", "website": "https://k-da.no", "email": "post@k-da.no",
     "phone": "+47 55 19 50 00", "region": "Landsdekkende",
     "categories": ["Rørdeler", "Ventiler"], "has_online_shop": False},
    {"name": "Brødrene Dahl", "website": "https://dahl.no", "email": "kundeservice@dahl.no",
     "phone": "+47 22 72 55 00", "region": "Landsdekkende",
     "categories": ["Rørdeler", "Pumper", "Ventiler", "Smøremidler"], "has_online_shop": True},
    {"name": "Ahlsell Norge", "website": "https://ahlsell.no", "email": "kundeservice@ahlsell.no",
     "phone": "+47 22 88 20 00", "region": "Landsdekkende",
     "categories": ["Rørdeler", "Pumper", "Ventiler", "Slanger", "Løfteutstyr og rigg", "Verktøy", "Elektrisk"], "has_online_shop": True},
    {"name": "Otto Olsen", "website": "https://oo.no", "email": "post@oo.no",
     "phone": "+47 64 87 99 00", "region": "Norge",
     "categories": ["Slanger", "Rørdeler", "Smøremidler"], "has_online_shop": False},
    {"name": "Aquaservice", "website": "https://aquaservice.no", "email": "post@aquaservice.no",
     "phone": "+47 70 25 84 00", "region": "Sykkylven/Møre og Romsdal",
     "categories": ["Rørdeler", "Pumper", "Filtre"], "has_online_shop": False},
    {"name": "Scandinavian Energy Group SEG", "website": "https://seg.no", "email": "post@seg.no",
     "phone": "+47 55 59 70 00", "region": "Norge",
     "categories": ["Rørdeler", "Pumper", "Smøremidler"], "has_online_shop": False},
    # ── Tau, kjetting og fortøyning ─────────────────────────────────────────────
    {"name": "ScaleAQ / Aqualine", "website": "https://scaleaq.com", "email": "post@scaleaq.com",
     "phone": "+47 73 96 13 00", "region": "Trondheim + landsdekkende",
     "categories": ["Tau og fortøyning", "Nøter og håver"], "has_online_shop": False},
    {"name": "Certex Norge", "website": "https://certex.no", "email": "post@certex.no",
     "phone": "+47 73 83 20 00", "region": "Trondheim + Kristiansund + landsdekkende",
     "categories": ["Tau og fortøyning", "Løfteutstyr og rigg"], "has_online_shop": False},
    {"name": "NOFI Tromsø", "website": "https://nofi.no", "email": "post@nofi.no",
     "phone": "+47 77 66 55 00", "region": "Tromsø - nettbutikk",
     "categories": ["Tau og fortøyning", "Nøter og håver"], "has_online_shop": True},
    {"name": "Egersund Group", "website": "https://egersundgroup.no", "email": "post@egersundgroup.no",
     "phone": "+47 51 46 10 00", "region": "Kristiansund + landsdekkende",
     "categories": ["Tau og fortøyning", "Løfteutstyr og rigg", "Sikkerhetsutstyr", "Nøter og håver"], "has_online_shop": False},
    # ── Kjemikalier ────────────────────────────────────────────────────────────
    {"name": "Aquatiq AS", "website": "https://aquatiq.com", "email": "info@aquatiq.com",
     "phone": "+47 61 24 70 10", "region": "Lillehammer + landsdekkende",
     "categories": ["Kjemikalier"], "has_online_shop": False},
    {"name": "Permakem AS", "website": "https://permakem.no", "email": "post@permakem.no",
     "phone": "+47 55 36 80 00", "region": "Bergen/landsdekkende",
     "categories": ["Kjemikalier"], "has_online_shop": False},
    {"name": "NOS Chemicals", "website": "https://nosas.no", "email": "post@nosas.no",
     "phone": "+47 55 36 10 00", "region": "Norge",
     "categories": ["Kjemikalier"], "has_online_shop": False},
    {"name": "Hjelle Kjemi AS", "website": "https://hjellekjemi.no", "email": "post@hjellekjemi.no",
     "phone": "+47 55 23 13 00", "region": "Bergen – C. Sundts gate 65",
     "categories": ["Kjemikalier"], "has_online_shop": False},
    {"name": "Brenntag Norge AS", "website": "https://brenntag.com/en-no", "email": "post@brenntag.no",
     "phone": "+47 22 88 70 00", "region": "Landsdekkende",
     "categories": ["Kjemikalier", "Smøremidler"], "has_online_shop": False},
    {"name": "Normex AS", "website": "https://normex.no", "email": "post@normex.no",
     "phone": "+47 70 14 80 00", "region": "Ålesund",
     "categories": ["Kjemikalier", "Filtre"], "has_online_shop": False},
    {"name": "Chemco AS", "website": "https://chemco.no", "email": "post@chemco.no",
     "phone": "+47 55 36 68 00", "region": "Bergen/kyststrøk",
     "categories": ["Kjemikalier"], "has_online_shop": False},
    {"name": "Nippon Gases Norge", "website": "https://nippongases.com", "email": "post@nippongases.com",
     "phone": "+47 73 82 86 00", "region": "Trondheim + landsdekkende",
     "categories": ["Kjemikalier"], "has_online_shop": False},
    # ── Maling og bunnstoff ────────────────────────────────────────────────────
    {"name": "Jotun AS", "website": "https://jotun.com", "email": "post@jotun.no",
     "phone": "+47 33 45 70 00", "region": "Sandefjord + landsdekkende",
     "categories": ["Maling og bunnstoff"], "has_online_shop": False},
    {"name": "International Paint (AkzoNobel)", "website": "https://internationalpaint.com", "email": "no.marine@akzonobel.com",
     "phone": "+47 55 53 90 00", "region": "Bergen + landsdekkende",
     "categories": ["Maling og bunnstoff"], "has_online_shop": False},
    {"name": "Hempel AS Norge", "website": "https://hempel.com", "email": "no@hempel.com",
     "phone": "+47 22 73 55 00", "region": "Landsdekkende",
     "categories": ["Maling og bunnstoff"], "has_online_shop": False},
    # ── Smøremidler og hydraulikk ──────────────────────────────────────────────
    {"name": "Shell Lubricants Norge", "website": "https://shell.no/lubricants", "email": "marine.lubricants@shell.com",
     "phone": "+47 22 66 30 00", "region": "Landsdekkende",
     "categories": ["Smøremidler"], "has_online_shop": False},
    {"name": "Castrol Marine Norge", "website": "https://castrolmarine.com", "email": "marine@castrol.no",
     "phone": "+47 22 01 30 00", "region": "Landsdekkende",
     "categories": ["Smøremidler"], "has_online_shop": False},
    {"name": "Totalenergies Marine Lubricants", "website": "https://totalenergies.com/marine", "email": "marine.lubricants@totalenergies.com",
     "phone": "+47 22 01 37 00", "region": "Landsdekkende",
     "categories": ["Smøremidler"], "has_online_shop": False},
    # ── Løfteutstyr og rigg ────────────────────────────────────────────────────
    {"name": "Lifting Solutions Norge", "website": "https://liftingsolutions.no", "email": "post@liftingsolutions.no",
     "phone": "+47 55 59 40 00", "region": "Bergen + landsdekkende",
     "categories": ["Løfteutstyr og rigg"], "has_online_shop": False},
    # ── Nøter og håver ─────────────────────────────────────────────────────────
    {"name": "Nofima / Mørenot", "website": "https://morenot.no", "email": "post@morenot.no",
     "phone": "+47 70 01 77 00", "region": "Ålesund + landsdekkende",
     "categories": ["Nøter og håver"], "has_online_shop": False},
]


PRODUCTS = [
    # ══════════════════════════════════════════════════════════════════════════
    # SLANGER
    # ══════════════════════════════════════════════════════════════════════════
    {"name": "PE-slange 50mm", "category": "Slanger", "unit": "meter",
     "description": "PE-slange 50mm innvendig diameter, trykkklasse PN10"},
    {"name": "PE-slange 75mm", "category": "Slanger", "unit": "meter",
     "description": "PE-slange 75mm innvendig diameter, trykkklasse PN10"},
    {"name": "PE-slange 100mm", "category": "Slanger", "unit": "meter",
     "description": "PE-slange 100mm innvendig diameter, trykkklasse PN10"},
    {"name": "Hydraulikkslange SAE 100R2 3/4\"", "category": "Slanger", "unit": "meter",
     "description": "Dobbelt-spiralert hydraulikkslange SAE 100R2, 3/4 tomme, 350 bar"},
    {"name": "Hydraulikkslange SAE 100R2 1\"", "category": "Slanger", "unit": "meter",
     "description": "Hydraulikkslange SAE 100R2, 1 tomme, 350 bar"},
    {"name": "Fôrslange 110mm", "category": "Slanger", "unit": "meter",
     "description": "Fôrslange 110mm for pneumatisk fôring, hvit PE"},
    {"name": "Fôrslange 160mm", "category": "Slanger", "unit": "meter",
     "description": "Fôrslange 160mm for pneumatisk fôring"},
    {"name": "Kjemikalieslange EPDM 25mm", "category": "Slanger", "unit": "meter",
     "description": "Kjemikaliebestandig slange EPDM 25mm, for syre/lut, PN10"},
    {"name": "Trykkslange rustfri armert 32mm", "category": "Slanger", "unit": "meter",
     "description": "Rustfri stålarmert trykkslange 32mm, PN20"},
    {"name": "Sugeslange PVC 63mm", "category": "Slanger", "unit": "meter",
     "description": "Transparent PVC sugeslange med stålspiral 63mm"},
    {"name": "Sugeslange PVC 100mm", "category": "Slanger", "unit": "meter",
     "description": "Transparent PVC sugeslange med stålspiral 100mm"},
    {"name": "Dampslange 25mm", "category": "Slanger", "unit": "meter",
     "description": "Dampslange 25mm, EPDM, 18 bar ved 175°C"},

    # ══════════════════════════════════════════════════════════════════════════
    # RØRDELER
    # ══════════════════════════════════════════════════════════════════════════
    {"name": "PE-rør SDR11 32mm", "category": "Rørdeler", "unit": "meter",
     "description": "PE100 rør SDR11 32mm utvendig, PN16"},
    {"name": "PE-rør SDR11 63mm", "category": "Rørdeler", "unit": "meter",
     "description": "PE100 rør SDR11 63mm utvendig, PN16"},
    {"name": "PE-rør SDR17 110mm", "category": "Rørdeler", "unit": "meter",
     "description": "PE100 rør SDR17 110mm utvendig, PN10"},
    {"name": "PE-rør SDR17 160mm", "category": "Rørdeler", "unit": "meter",
     "description": "PE100 rør SDR17 160mm utvendig, PN10"},
    {"name": "PE-bøy 90° 63mm", "category": "Rørdeler", "unit": "stk",
     "description": "PE100 90° bøy 63mm SDR11, sveisemuff"},
    {"name": "PE-koblingsmuffe 110mm", "category": "Rørdeler", "unit": "stk",
     "description": "PE100 koblingsmuffe 110mm SDR17, sveisemuff"},
    {"name": "PE-T-stykke 63mm", "category": "Rørdeler", "unit": "stk",
     "description": "PE100 T-stykke 63mm SDR11"},
    {"name": "Flens PE 110mm", "category": "Rørdeler", "unit": "stk",
     "description": "PE100 løsflens 110mm SDR11"},
    {"name": "Kuleventil PVC 63mm", "category": "Rørdeler", "unit": "stk",
     "description": "PVC kuleventil 63mm, PN10"},
    {"name": "Kuleventil PE 110mm", "category": "Rørdeler", "unit": "stk",
     "description": "PE kuleventil 110mm, PN10, sveisemuff"},

    # ══════════════════════════════════════════════════════════════════════════
    # TAU OG FORTØYNING
    # ══════════════════════════════════════════════════════════════════════════
    {"name": "Fortøyningsline polyester 28mm", "category": "Tau og fortøyning", "unit": "meter",
     "description": "8-slått polyester fortøyningsline 28mm, bruddstyrke 15 tonn"},
    {"name": "Fortøyningsline polyester 40mm", "category": "Tau og fortøyning", "unit": "meter",
     "description": "8-slått polyester fortøyningsline 40mm, bruddstyrke 30 tonn"},
    {"name": "Tau polypropylene 12mm", "category": "Tau og fortøyning", "unit": "meter",
     "description": "3-slått polypropylene tau 12mm"},
    {"name": "Tau polypropylene 16mm", "category": "Tau og fortøyning", "unit": "meter",
     "description": "3-slått polypropylene tau 16mm"},
    {"name": "Tau polypropylene 20mm", "category": "Tau og fortøyning", "unit": "meter",
     "description": "3-slått polypropylene tau 20mm"},
    {"name": "Tau nylon 24mm", "category": "Tau og fortøyning", "unit": "meter",
     "description": "3-slått nylon tau 24mm, høy strekk-absorpsjon"},
    {"name": "Kjetting G80 13mm galvanisert", "category": "Tau og fortøyning", "unit": "meter",
     "description": "G80 kjetting 13mm galvanisert, bruddlast 52 kN"},
    {"name": "Kjetting G80 16mm galvanisert", "category": "Tau og fortøyning", "unit": "meter",
     "description": "G80 kjetting 16mm galvanisert, bruddlast 80 kN"},
    {"name": "Kjetting G80 22mm galvanisert", "category": "Tau og fortøyning", "unit": "meter",
     "description": "G80 kjetting 22mm galvanisert, bruddlast 110 kN"},
    {"name": "Kjetting G80 32mm galvanisert", "category": "Tau og fortøyning", "unit": "meter",
     "description": "G80 kjetting 32mm galvanisert, bruddlast 250 kN"},
    {"name": "Sjakkel 16mm WLL 3,2t", "category": "Tau og fortøyning", "unit": "stk",
     "description": "Omega sjakkel 16mm galvanisert, WLL 3,2 tonn"},
    {"name": "Sjakkel 25mm WLL 8,5t", "category": "Tau og fortøyning", "unit": "stk",
     "description": "Omega sjakkel 25mm galvanisert, WLL 8,5 tonn"},
    {"name": "Sjakkel 38mm WLL 20t", "category": "Tau og fortøyning", "unit": "stk",
     "description": "Omega sjakkel 38mm galvanisert, WLL 20 tonn"},
    {"name": "Stålwire 14mm 6x19", "category": "Tau og fortøyning", "unit": "meter",
     "description": "Galvanisert stålwire 14mm 6x19 FC kjerne"},
    {"name": "Stålwire 16mm 6x19", "category": "Tau og fortøyning", "unit": "meter",
     "description": "Galvanisert stålwire 16mm 6x19 FC kjerne"},
    {"name": "Wireklemme 16mm", "category": "Tau og fortøyning", "unit": "stk",
     "description": "Buldog wireklemme 16mm galvanisert"},
    {"name": "Kausje 16mm", "category": "Tau og fortøyning", "unit": "stk",
     "description": "Kausje / kabeløye 16mm galvanisert"},
    {"name": "Fortøyningsbøye 400mm", "category": "Tau og fortøyning", "unit": "stk",
     "description": "Fortøyningsbøye 400mm gul, med toppøye"},

    # ══════════════════════════════════════════════════════════════════════════
    # KJEMIKALIER — DESINFEKSJON OG RENGJØRING (ikke reseptpliktig)
    # ══════════════════════════════════════════════════════════════════════════
    {"name": "Aqua Des PAA 15% 25L", "category": "Kjemikalier", "unit": "stk",
     "description": "Aqua Des peracetic acid 15% — Mattilsynet-godkjent desinfeksjonsmiddel for akvakultur, 25L kanne. Aquatiq AS"},
    {"name": "Aqua Des PAA 15% 200L", "category": "Kjemikalier", "unit": "stk",
     "description": "Aqua Des PAA 15% fat 200 liter. Aquatiq AS"},
    {"name": "Peracetic Acid 5% 25L (generisk)", "category": "Kjemikalier", "unit": "stk",
     "description": "Generisk eddiksyre-basert desinfeksjonsmiddel 5% PAA, 25L"},
    {"name": "Hydrogenperoksid H2O2 35% 25L", "category": "Kjemikalier", "unit": "stk",
     "description": "H2O2 35% konsentrasjon 25L kanne, teknisk kvalitet"},
    {"name": "Hydrogenperoksid H2O2 50% 200L", "category": "Kjemikalier", "unit": "stk",
     "description": "H2O2 50% fat 200L. NB: INTEROX Paramove 50 (vetmed) krever resept."},
    {"name": "Natriumhypokloritt NaOCl 14% 25L", "category": "Kjemikalier", "unit": "stk",
     "description": "Natriumhypokloritt 14% klørløsning 25L kanne, for overflatedesinfeksjon"},
    {"name": "Natriumhypokloritt NaOCl 14% 1000L", "category": "Kjemikalier", "unit": "stk",
     "description": "NaOCl 14% IBC 1000 liter"},
    {"name": "Alkalisk skumrens 25L", "category": "Kjemikalier", "unit": "stk",
     "description": "Sterk alkalisk skumrensemiddel (NaOH-basert) for CIP og overflaterens, 25L"},
    {"name": "Syreskyll / CIP-syre 25L", "category": "Kjemikalier", "unit": "stk",
     "description": "Fosforsyrebasert CIP-rensemiddel for kalkfjerning og CIP, 25L"},
    {"name": "Sitronsyre granulat 25kg", "category": "Kjemikalier", "unit": "stk",
     "description": "Food grade sitronsyre 25kg sekk, for CIP-rens og pH-regulering"},
    {"name": "Natriumhydroksid NaOH 50% 1000L", "category": "Kjemikalier", "unit": "stk",
     "description": "Lut NaOH 50% IBC 1000 liter, for pH-hev og rens"},
    {"name": "Kloramin-T 25kg", "category": "Kjemikalier", "unit": "stk",
     "description": "Kloramin-T desinfeksjonspulver 25kg, Mattilsynet-godkjent for akvakultur"},
    {"name": "Biofilm-fjerner enzym 20L", "category": "Kjemikalier", "unit": "stk",
     "description": "Enzymbasert biofilmfjerner for rør og tanker, 20L"},
    # Reseptpliktige (for info – merket tydelig)
    {"name": "Salmosan Vet 1kg (reseptpliktig)", "category": "Kjemikalier", "unit": "stk",
     "description": "⚠️ RESEPTPLIKTIG. Azamethiphos badebehandling mot lakselus. Benchmark Animal Health. Krever veterinærresept."},
    {"name": "AlphaMax 100ml (reseptpliktig)", "category": "Kjemikalier", "unit": "stk",
     "description": "⚠️ RESEPTPLIKTIG. Deltamethrin badebehandling mot lakselus 10mg/mL. Pharmaq/Zoetis."},
    {"name": "Aqui-S Vet 1L (reseptpliktig)", "category": "Kjemikalier", "unit": "stk",
     "description": "⚠️ RESEPTPLIKTIG. Isoeugenol fiskesedativ for håndtering/transport. 2 DD karantenetid. MSD Animal Health."},
    {"name": "Benzoak Vet 1L (reseptpliktig)", "category": "Kjemikalier", "unit": "stk",
     "description": "⚠️ RESEPTPLIKTIG. Benzokain 200mg/mL fiskebedøvelse, 21 dagers slaktekarantene."},

    # ══════════════════════════════════════════════════════════════════════════
    # SMØREMIDLER OG HYDRAULIKK
    # ══════════════════════════════════════════════════════════════════════════
    {"name": "Motorolje SAE 40 marine 20L", "category": "Smøremidler", "unit": "stk",
     "description": "Marin 4-takt motorolje SAE 40, 20 liter spann"},
    {"name": "Motorolje SAE 40 marine 200L", "category": "Smøremidler", "unit": "stk",
     "description": "Marin motorolje SAE 40 fat 200 liter"},
    {"name": "Motorolje 15W-40 20L", "category": "Smøremidler", "unit": "stk",
     "description": "Universalmotorolje 15W-40, 20L spann, for skip og industri"},
    {"name": "Hydraulikkolje HV 46 20L", "category": "Smøremidler", "unit": "stk",
     "description": "Hydraulikkolje ISO HV 46, 20L spann, for hydrauliske systemer"},
    {"name": "Hydraulikkolje HV 46 200L", "category": "Smøremidler", "unit": "stk",
     "description": "Hydraulikkolje ISO HV 46 fat 200 liter"},
    {"name": "Hydraulikkolje HV 68 20L", "category": "Smøremidler", "unit": "stk",
     "description": "Hydraulikkolje ISO HV 68, 20L spann"},
    {"name": "Girkasseolj SAE 90 20L", "category": "Smøremidler", "unit": "stk",
     "description": "Giroljeolj SAE 90 GL-4 20 liter, for marine girkasser"},
    {"name": "Grease Nlgi 2 multifett 18kg", "category": "Smøremidler", "unit": "stk",
     "description": "Universalfett NLGI 2, 18kg bøtte, for bolter/lager/wireliner"},
    {"name": "Grease Nlgi 2 multifett 400g patron", "category": "Smøremidler", "unit": "stk",
     "description": "Fettpatron NLGI 2 400g, for fettsprøyte"},
    {"name": "Marin gearlube 80W-90 20L", "category": "Smøremidler", "unit": "stk",
     "description": "Marine girolje 80W-90 API GL-5 20L, for utenbordsgir og sterndrive"},
    {"name": "Kompressorolje 10L", "category": "Smøremidler", "unit": "stk",
     "description": "Kompressorolje ISO 100 10L spann"},
    {"name": "Rustbeskyttelse / WD-type 5L", "category": "Smøremidler", "unit": "stk",
     "description": "Penetrerende rustbeskyttelse og fuktutstøter 5L kanne"},

    # ══════════════════════════════════════════════════════════════════════════
    # MALING OG BUNNSTOFF
    # ══════════════════════════════════════════════════════════════════════════
    {"name": "Bunnstoff kobberbasert 20L", "category": "Maling og bunnstoff", "unit": "stk",
     "description": "Kobberbasert begroing-hindrende bunnstoff 20L, for stål/aluminium skrog"},
    {"name": "Bunnstoff kobberbasert 5L", "category": "Maling og bunnstoff", "unit": "stk",
     "description": "Kobberbasert bunnstoff 5L, for service og vedlikehold"},
    {"name": "Rustprimer epoksy 5L", "category": "Maling og bunnstoff", "unit": "stk",
     "description": "Epoksy antirust primer 5L, for stål under vann og på dekk"},
    {"name": "Dekksmaling grå 5L", "category": "Maling og bunnstoff", "unit": "stk",
     "description": "Hard dekksmaling grå 5L, skridsikker, for båtdekk"},
    {"name": "Dekksmaling grå 20L", "category": "Maling og bunnstoff", "unit": "stk",
     "description": "Hard dekksmaling grå 20L, skridsikker"},
    {"name": "Rød mellomstrøk epoksy 5L", "category": "Maling og bunnstoff", "unit": "stk",
     "description": "Epoksy mellomstrøk rød 5L, for skrog under vann"},
    {"name": "Zinkanoder 250g (bolt)", "category": "Maling og bunnstoff", "unit": "stk",
     "description": "Sinkanoder 250g for boltmontering, katodisk beskyttelse"},
    {"name": "Zinkanoder plate 1kg", "category": "Maling og bunnstoff", "unit": "stk",
     "description": "Sinkanoder plate 1kg, for skrog og propell"},
    {"name": "Rustfjerner gel 5L", "category": "Maling og bunnstoff", "unit": "stk",
     "description": "Fosforsyrebasert rustfjerner gel 5L, for stål"},

    # ══════════════════════════════════════════════════════════════════════════
    # LØFTEUTSTYR OG RIGG
    # ══════════════════════════════════════════════════════════════════════════
    {"name": "Løftestroppei textile 2t 2m", "category": "Løfteutstyr og rigg", "unit": "stk",
     "description": "Tekstilstropp orange 2 tonn, lengde 2 meter, EN1492"},
    {"name": "Løftestroppei textile 5t 3m", "category": "Løfteutstyr og rigg", "unit": "stk",
     "description": "Tekstilstropp rød 5 tonn, lengde 3 meter"},
    {"name": "Krokblokk 3t enkel", "category": "Løfteutstyr og rigg", "unit": "stk",
     "description": "Enkel krokblokk 3 tonn WLL, for kjetting/wire"},
    {"name": "Hånntallye kjetting 1t 3m", "category": "Løfteutstyr og rigg", "unit": "stk",
     "description": "Manuell kjettingtalje 1 tonn, 3 meter løftehøyde"},
    {"name": "Hånntallye kjetting 3t 3m", "category": "Løfteutstyr og rigg", "unit": "stk",
     "description": "Manuell kjettingtalje 3 tonn, 3 meter løftehøyde"},
    {"name": "Wire-løkkestropp 16mm 1m", "category": "Løfteutstyr og rigg", "unit": "stk",
     "description": "Presskoblet wirestroppløkke 16mm, 1 meter"},
    {"name": "Sertifisert løftekjetting 13mm G80 3m", "category": "Løfteutstyr og rigg", "unit": "stk",
     "description": "Sertifisert G80 løftekjetting 13mm 3m med krok, SWL 5,3t"},
    {"name": "Wireklemme 14mm (pk 5)", "category": "Løfteutstyr og rigg", "unit": "pk",
     "description": "Buldog wireklemme 14mm galvanisert, pakke à 5 stk"},

    # ══════════════════════════════════════════════════════════════════════════
    # NØTER OG HÅVER
    # ══════════════════════════════════════════════════════════════════════════
    {"name": "Lusehåv PE 10m dybde", "category": "Nøter og håver", "unit": "stk",
     "description": "Lusehåv polyetylen 10 meter dybde, maskevidde 2mm, UV-bestandig"},
    {"name": "Lusehåv PE 15m dybde", "category": "Nøter og håver", "unit": "stk",
     "description": "Lusehåv polyetylen 15 meter dybde, maskevidde 2mm"},
    {"name": "Merdnot 15m dybde standard", "category": "Nøter og håver", "unit": "stk",
     "description": "Polyetylen merdnot 15m, maskevidde 15mm, standard oppdrettsmerd"},
    {"name": "Merdnot 20m dybde standard", "category": "Nøter og håver", "unit": "stk",
     "description": "Polyetylen merdnot 20m, maskevidde 15mm"},
    {"name": "Fortøyningsnot / fangstpose", "category": "Nøter og håver", "unit": "stk",
     "description": "Fangstpose/trengingshåv for fiskeoperasjoner, PE"},
    {"name": "Notlin polyetylen 210/24 (1kg)", "category": "Nøter og håver", "unit": "kg",
     "description": "PE notlin 210/24 for reparasjon og vedlikehold av nøter"},

    # ══════════════════════════════════════════════════════════════════════════
    # PUMPER
    # ══════════════════════════════════════════════════════════════════════════
    {"name": "Sentrifugalpumpe rustfri 3\"", "category": "Pumper", "unit": "stk",
     "description": "Rustfri sentrifugalpumpe 3\", 400V, 4kW, Q=50m³/h"},
    {"name": "Nedsenkspumpe rustfri 4\"", "category": "Pumper", "unit": "stk",
     "description": "Rustfri nedsenkspumpe 4\", 400V, 3kW, for brønn/merd"},
    {"name": "Hydraulisk pumpe 50cc", "category": "Pumper", "unit": "stk",
     "description": "Hydraulisk zahnradpumpe 50cc/omdr, SAE-B flens"},
    {"name": "Dosepumpe kjemikalie 10L/h", "category": "Pumper", "unit": "stk",
     "description": "Membran dosepumpe 10L/h 10 bar for kjemikalier"},

    # ══════════════════════════════════════════════════════════════════════════
    # VENTILER
    # ══════════════════════════════════════════════════════════════════════════
    {"name": "Sluseventil jerntøy 160mm", "category": "Ventiler", "unit": "stk",
     "description": "Jernsluseventil 160mm PN10 flens"},
    {"name": "Sjekklokk PVC 63mm", "category": "Ventiler", "unit": "stk",
     "description": "PVC tilbakeslagsventil 63mm horizontal"},

    # ══════════════════════════════════════════════════════════════════════════
    # FILTRE
    # ══════════════════════════════════════════════════════════════════════════
    {"name": "Trommelfilter 60µm", "category": "Filtre", "unit": "stk",
     "description": "Roterende trommelfilter 60 mikron, 50m³/h kapasitet"},
    {"name": "UV-desinfeksjon 25W", "category": "Filtre", "unit": "stk",
     "description": "UV-C enhet 25W, 5m³/h, 254nm"},

    # ══════════════════════════════════════════════════════════════════════════
    # SIKKERHETSUTSTYR
    # ══════════════════════════════════════════════════════════════════════════
    {"name": "Kjemikaliedress type 3 str M", "category": "Sikkerhetsutstyr", "unit": "stk",
     "description": "Engangsdress mot kjemikaliesøl type 3/4, str M"},
    {"name": "Kjemikaliedress type 3 str L", "category": "Sikkerhetsutstyr", "unit": "stk",
     "description": "Engangsdress mot kjemikaliesøl type 3/4, str L"},
    {"name": "Kjemikaliehansker nitril lange L", "category": "Sikkerhetsutstyr", "unit": "par",
     "description": "Lange nitrilhansker 38cm mot kjemikalier, str L"},
    {"name": "Øyeskylling steril NaCl 500ml", "category": "Sikkerhetsutstyr", "unit": "stk",
     "description": "Øyeskylleflaske steril NaCl 500ml, for førstehjelp"},
    {"name": "Halvmaske gassfilter A2P3", "category": "Sikkerhetsutstyr", "unit": "stk",
     "description": "Halvmaske med A2P3 kombinasjonsfilter mot kjemikalie-damp/partikler"},
    {"name": "Vernestøvler S3 str 43", "category": "Sikkerhetsutstyr", "unit": "par",
     "description": "Vernestøvler S3 med ståltupp og spikerplate, str 43"},
    {"name": "Redningsvest 150N", "category": "Sikkerhetsutstyr", "unit": "stk",
     "description": "Godkjent redningsvest 150N, CE-merket, for arbeid på sjø"},
]


def seed_database(db: Session) -> None:
    """Populate the database with initial data if empty."""
    if db.query(Supplier).count() > 0:
        return  # Already seeded

    logger.info("Seeding database...")

    # Insert suppliers
    db_suppliers = []
    for s in SUPPLIERS:
        supplier = Supplier(**s)
        db.add(supplier)
        db_suppliers.append(supplier)
    db.flush()

    # Insert products
    db_products = []
    for p in PRODUCTS:
        product = Product(**p)
        db.add(product)
        db_products.append(product)
    db.flush()

    # Generate sample prices — use realistic base prices per category
    random.seed(42)
    BASE_PRICES: dict[str, tuple[float, float]] = {
        "Slanger":              (80,   450),
        "Rørdeler":             (120,  1800),
        "Tau og fortøyning":    (30,   2500),
        "Kjemikalier":          (400,  12000),
        "Smøremidler":          (300,  8000),
        "Maling og bunnstoff":  (400,  6000),
        "Løfteutstyr og rigg":  (200,  15000),
        "Nøter og håver":       (2000, 80000),
        "Pumper":               (4000, 45000),
        "Ventiler":             (600,  8000),
        "Filtre":               (3000, 40000),
        "Sikkerhetsutstyr":     (80,   2500),
    }

    category_supplier_map: dict[str, list] = {}
    for s in db_suppliers:
        for cat in (s.categories or []):
            category_supplier_map.setdefault(cat, []).append(s)

    for product in db_products:
        relevant = category_supplier_map.get(product.category, [])
        lo, hi = BASE_PRICES.get(product.category, (100, 5000))
        chosen = random.sample(relevant, min(len(relevant), random.randint(2, 4)))
        base_price = random.uniform(lo, hi)
        for supplier in chosen:
            price = Price(
                product_id=product.id,
                supplier_id=supplier.id,
                price=round(base_price * random.uniform(0.88, 1.18), 2),
                currency="NOK",
                unit=product.unit,
                source="manual",
                notes="Estimert pris – oppdateres med faktiske tilbud",
            )
            db.add(price)

    db.commit()
    logger.info(f"Database seeded: {len(db_suppliers)} leverandører, {len(db_products)} produkter.")
