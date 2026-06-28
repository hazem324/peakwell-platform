import pandas as pd
from unidecode import unidecode

# =========================
# BASE DATA (Tunisie)
# =========================
governorates = {
    "Tunis": [
        "tunis", "centre ville tunis", "medina", "bab bhar", "bab souika",
        "lac 1", "lac 2", "berge du lac", "carthage", "la marsa",
        "sidi bou said", "bardo", "ksar said"
    ],
    "Ariana": [
        "ariana", "ennasr", "menzah", "ghazela", "raoued",
        "soukra", "borj louzir"
    ],
    "Ben Arous": [
        "ben arous", "rades", "megrine", "mourouj",
        "hammam lif", "hammam chatt"
    ],
    "Manouba": [
        "manouba", "den den", "oued ellil", "tebourba",
        "douar hicher"
    ],
    "Nabeul": [
        "nabeul", "hammamet", "kelibia", "korba",
        "dar chaabane", "menzel temime"
    ],
    "Zaghouan": ["zaghouan", "bir mcherga", "zribia"],
    "Bizerte": ["bizerte", "mateur", "ras jebel", "menzel bourguiba"],
    "Beja": ["beja", "testour", "nefza"],
    "Jendouba": ["jendouba", "tabarka", "ain draham"],
    "Kef": ["kef", "tajerouine", "nebber"],
    "Siliana": ["siliana", "gaafour", "bouarada"],
    "Kairouan": ["kairouan", "chebika", "hajeb"],
    "Kasserine": ["kasserine", "sbeitla", "foussana"],
    "Sidi Bouzid": ["sidi bouzid", "meknassy", "regueb"],
    "Sousse": ["sousse", "kantaoui", "hammam sousse", "msaken"],
    "Monastir": ["monastir", "ksar hellal", "jemmal"],
    "Mahdia": ["mahdia", "el jem", "ksour essaf"],
    "Sfax": ["sfax", "sakiet ezzit", "thyna"],
    "Gabes": ["gabes", "el hamma", "metouia"],
    "Medenine": ["medenine", "zarzis", "ben guerdane"],
    "Tataouine": ["tataouine", "gremda"],
    "Gafsa": ["gafsa", "metlaoui", "redayef"],
    "Tozeur": ["tozeur", "degache"],
    "Kebili": ["kebili", "douz"]
}

# =========================
# VARIATIONS
# =========================
def generate_variations(text):
    variations = set()

    base = text.lower()
    variations.add(base)

    # remove accents
    variations.add(unidecode(base))

    # remove spaces
    variations.add(base.replace(" ", ""))

    # add tunis keyword
    variations.add(base + " tunis")

    # hyphen version
    variations.add(base.replace(" ", "-"))

    # uppercase
    variations.add(base.upper())

    return variations

# =========================
# GENERATE DATASET
# =========================
rows = []

for gov, places in governorates.items():
    for place in places:

        variations = generate_variations(place)

        for v in variations:
            rows.append({
                "alias": v,
                "governorate": gov
            })

# =========================
# ADD EXTRA GLOBAL VARIANTS
# =========================
for gov in governorates.keys():
    variations = generate_variations(gov)
    for v in variations:
        rows.append({
            "alias": v,
            "governorate": gov
        })

# =========================
# CREATE DATAFRAME
# =========================
df = pd.DataFrame(rows)

# remove duplicates
df = df.drop_duplicates()

# =========================
# SAVE CSV
# =========================
df.to_csv("location_mapping.csv", index=False, encoding="utf-8")

print("✅ location_mapping.csv généré avec succès !")
print(f"Total rows: {len(df)}")