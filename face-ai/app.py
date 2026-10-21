import os
import pickle
import threading

import cv2
import numpy as np

from flask import Flask, request, jsonify
from dotenv import load_dotenv
from insightface.app import FaceAnalysis


# ==========================================
# CONFIGURATION
# ==========================================

load_dotenv()

app = Flask(__name__)

API_KEY = os.getenv("FACE_AI_API_KEY", "")

MATCH_THRESHOLD = float(
    os.getenv("FACE_MATCH_THRESHOLD", "0.45")
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_DIR = os.path.join(BASE_DIR, "models")

DATABASE_PATH = os.path.join(
    MODEL_DIR,
    "face_database.pkl"
)

os.makedirs(MODEL_DIR, exist_ok=True)

# Protect database updates from concurrent requests.
database_lock = threading.RLock()


# ==========================================
# LOAD INSIGHTFACE
# ==========================================

print("Loading InsightFace model...")

face_app = FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)

face_app.prepare(
    ctx_id=-1,
    det_size=(640, 640)
)

print("InsightFace model loaded.")


# ==========================================
# DATABASE FUNCTIONS
# ==========================================



def load_database():
    """
    Load saved employee face embeddings.
    An empty or missing database is allowed during initial setup.
    """

    if not os.path.exists(DATABASE_PATH):
        print("Face database does not exist yet.")
        return {}

    if os.path.getsize(DATABASE_PATH) == 0:
        print("Face database is empty. Starting with zero employees.")
        return {}

    try:
        with open(DATABASE_PATH, "rb") as file:
            database = pickle.load(file)

    except (EOFError, pickle.UnpicklingError) as error:
        print("Warning: Face database is empty or corrupted.")
        print("Details:", error)
        print("Starting with zero employees.")
        return {}

    if not isinstance(database, dict):
        print("Warning: Invalid face database format.")
        return {}

    normalized_database = {}

    for employee_id, embeddings in database.items():

        embeddings = np.asarray(
            embeddings,
            dtype=np.float32
        )

        if embeddings.ndim == 1:
            embeddings = embeddings.reshape(1, -1)

        if embeddings.ndim != 2:
            print(f"Skipping invalid embeddings: {employee_id}")
            continue

        if embeddings.shape[1] != 512:
            print(f"Invalid embedding dimensions: {employee_id}")
            continue

        norms = np.linalg.norm(
            embeddings,
            axis=1,
            keepdims=True
        )

        valid_rows = norms[:, 0] > 0

        if not np.any(valid_rows):
            print(f"No valid embeddings: {employee_id}")
            continue

        embeddings = embeddings[valid_rows]
        norms = norms[valid_rows]

        embeddings = embeddings / norms

        normalized_database[str(employee_id)] = embeddings

    print(
        f"Successfully loaded {len(normalized_database)} employees."
    )

    return normalized_database



def save_database(database):
    temporary_path = DATABASE_PATH + ".tmp"

    with open(temporary_path, "wb") as file:
        pickle.dump(database, file)

    os.replace(temporary_path, DATABASE_PATH)


# Load the existing database, if present.
with database_lock:
    face_database = load_database()

print("Enrolled employees:", len(face_database))


# ==========================================
# API AUTHENTICATION
# ==========================================

@app.before_request
def authenticate_request():

    # Health endpoint intentionally does not expose
    # employee or biometric information.
    if request.endpoint == "health":
        return None

    if not API_KEY:
        return jsonify({
            "success": False,
            "message": "AI service API key is not configured"
        }), 503

    supplied_key = request.headers.get(
        "X-API-Key", ""
    )

    if supplied_key != API_KEY:
        return jsonify({
            "success": False,
            "message": "Unauthorized"
        }), 401


# ==========================================
# IMAGE PROCESSING
# ==========================================

def extract_face_embedding(image_file):

    image_bytes = image_file.read()

    if not image_bytes:
        return None, "Empty image"

    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        return None, "Invalid image"

    faces = face_app.get(image)

    if len(faces) == 0:
        return None, "No face detected"

    # Avoid ambiguous enrollment or recognition
    # when several faces appear in the image.
    if len(faces) > 1:
        return None, "Multiple faces detected"

    face = faces[0]

    embedding = np.asarray(
        face.embedding,
        dtype=np.float32
    )

    norm = np.linalg.norm(embedding)

    if norm == 0:
        return None, "Invalid face embedding"

    embedding = embedding / norm

    return embedding, None


# ==========================================
# HEALTH CHECK
# ==========================================

@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "success": True,
        "service": "InsightFace",
        "model": "buffalo_l",
        "status": "running"
    })


# ==========================================
# ENROLL EMPLOYEE
# ==========================================

@app.route("/enroll", methods=["POST"])
def enroll_employee():

    global face_database

    employee_id = request.form.get(
        "employeeId", ""
    ).strip()

    image_file = request.files.get("face")

    if not employee_id:
        return jsonify({
            "success": False,
            "message": "employeeId is required"
        }), 400

    if image_file is None:
        return jsonify({
            "success": False,
            "message": "Face image is required"
        }), 400

    embedding, error = extract_face_embedding(
        image_file
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    with database_lock:

        # Enrollment replaces the existing enrollment
        # for this employee in this initial implementation.
        updated_database = dict(face_database)

        updated_database[employee_id] = np.array(
            [embedding],
            dtype=np.float32
        )

        try:
            save_database(updated_database)

            face_database = updated_database

        except Exception:
            app.logger.exception(
                "Failed to save employee enrollment"
            )

            return jsonify({
                "success": False,
                "message": "Could not save enrollment"
            }), 500

    return jsonify({
        "success": True,
        "employeeId": employee_id,
        "message": "Face enrollment successful"
    }), 201


# ==========================================
# RECOGNIZE EMPLOYEE
# ==========================================

@app.route("/recognize", methods=["POST"])
def recognize_employee():

    image_file = request.files.get("face")

    if image_file is None:
        return jsonify({
            "success": False,
            "message": "Face image is required"
        }), 400

    embedding, error = extract_face_embedding(
        image_file
    )

    if error:
        return jsonify({
            "success": True,
            "recognized": False,
            "employeeId": None,
            "similarity": 0,
            "message": error
        })

    with database_lock:

        database_snapshot = dict(face_database)

    if not database_snapshot:
        return jsonify({
            "success": True,
            "recognized": False,
            "employeeId": None,
            "similarity": 0,
            "message": "No employees enrolled"
        })

    best_employee_id = None
    best_similarity = -1.0

    for employee_id, known_embeddings in (
        database_snapshot.items()
    ):

        similarities = np.dot(
            known_embeddings,
            embedding
        )

        similarity = float(
            np.max(similarities)
        )

        if similarity > best_similarity:
            best_similarity = similarity
            best_employee_id = employee_id

    recognized = (
        best_similarity >= MATCH_THRESHOLD
    )

    return jsonify({
        "success": True,
        "recognized": recognized,
        "employeeId": (
            best_employee_id if recognized else None
        ),
        "similarity": round(
            float(best_similarity), 4
        ),
        "message": (
            "Face matched"
            if recognized
            else "No matching employee"
        )
    })


# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":

    print()
    print("===================================")
    print("INSIGHTFACE AI SERVICE")
    print("===================================")
    print("URL: http://127.0.0.1:8001")
    print("Health: http://127.0.0.1:8001/health")
    print("Enrolled employees:", len(face_database))
    print("===================================")

    app.run(
        host="127.0.0.1",
        port=8001,
        debug=False,
        threaded=True
    )