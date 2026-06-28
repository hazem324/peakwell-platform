import pandas as pd
import random

random.seed(42)

categories = ["SPORT", "CINEMA", "KARAOKE", "CEREMONY", "OTHER"]

governorates = [
    "Tunis", "Ariana", "Ben Arous", "Manouba",
    "Nabeul", "Zaghouan", "Bizerte", "Beja",
    "Jendouba", "Kef", "Siliana", "Kairouan",
    "Kasserine", "Sidi Bouzid", "Sousse", "Monastir",
    "Mahdia", "Sfax", "Gabes", "Medenine",
    "Tataouine", "Gafsa", "Tozeur", "Kebili"
]

high_popularity_govs = ["Tunis", "Ariana", "Ben Arous", "Sousse", "Sfax", "Nabeul", "Monastir"]
medium_popularity_govs = ["Bizerte", "Mahdia", "Gabes", "Medenine", "Manouba", "Kairouan"]
lower_popularity_govs = [
    "Beja", "Jendouba", "Kef", "Siliana", "Kasserine",
    "Sidi Bouzid", "Tataouine", "Gafsa", "Tozeur", "Kebili", "Zaghouan"
]

rows = []

def get_realistic_hour(category):
    if category == "SPORT":
        return random.choice([8, 9, 10, 16, 17, 18, 19])
    elif category == "CINEMA":
        return random.choice([17, 18, 19, 20, 21])
    elif category == "KARAOKE":
        return random.choice([18, 19, 20, 21, 22])
    elif category == "CEREMONY":
        return random.choice([9, 10, 11, 14, 15, 16, 17])
    else:
        return random.randint(9, 21)

def get_realistic_capacity(category):
    if category == "SPORT":
        return random.randint(20, 120)
    elif category == "CINEMA":
        return random.randint(15, 80)
    elif category == "KARAOKE":
        return random.randint(10, 60)
    elif category == "CEREMONY":
        return random.randint(30, 200)
    else:
        return random.randint(10, 100)

def compute_score(category, governorate, hour, day_of_week, month, max_participants):
    score = 0

    # category effect
    if category == "SPORT":
        score += 2
    elif category == "CINEMA":
        score += 1
    elif category == "KARAOKE":
        score += 1
    elif category == "CEREMONY":
        score += 2

    # governorate effect
    if governorate in high_popularity_govs:
        score += 2
    elif governorate in medium_popularity_govs:
        score += 1
    else:
        score += 0

    # weekend effect
    if day_of_week in [5, 6]:
        score += 2

    # evening effect
    if 17 <= hour <= 21:
        score += 2
    elif 14 <= hour <= 16:
        score += 1

    # seasonal effect
    if month in [6, 7, 8]:
        score += 1
    if month in [9, 10, 11] and category == "SPORT":
        score += 1

    # capacity effect
    if max_participants <= 40:
        score += 2
    elif max_participants <= 80:
        score += 1
    elif max_participants >= 150:
        score -= 1

    return score

def score_to_label(score):
    if score >= 7:
        return "HIGH"
    elif score >= 4:
        return "MEDIUM"
    return "LOW"

for _ in range(5000):
    category = random.choice(categories)
    governorate = random.choice(governorates)

    hour = get_realistic_hour(category)
    day_of_week = random.randint(0, 6)
    month = random.randint(1, 12)
    max_participants = get_realistic_capacity(category)

    score = compute_score(
        category,
        governorate,
        hour,
        day_of_week,
        month,
        max_participants
    )

    success_level = score_to_label(score)

    rows.append({
        "category": category,
        "governorate": governorate,
        "hour": hour,
        "dayOfWeek": day_of_week,
        "month": month,
        "maxParticipants": max_participants,
        "success_level": success_level
    })

df = pd.DataFrame(rows)

print("Distribution success_level:")
print(df["success_level"].value_counts())
print("\nDistribution category:")
print(df["category"].value_counts())
print("\nDistribution governorate:")
print(df["governorate"].value_counts())

df.to_csv("dataset_event_v2.csv", index=False, encoding="utf-8")

print("\nDataset generated successfully: dataset_event_v2.csv")
print("Total rows:", len(df))