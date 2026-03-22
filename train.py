import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

# 1️⃣ Load data
data = pd.read_csv("data/Crop_recommendation.csv")

X = data.drop('label', axis=1)
y = data['label']

# 2️⃣ Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42)

# 3️⃣ Train model
model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X_train, y_train)

# 4️⃣ Save model
joblib.dump(model, "model/crop.pkl")

print("✅ Model trained successfully and saved as model/crop.pkl")
