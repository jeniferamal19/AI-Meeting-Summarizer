import os

UPLOAD_DIR = "uploads"

def save_file(file):
    filepath = os.path.join(UPLOAD_DIR, file.filename)

    with open(filepath, "wb") as buffer:
        buffer.write(file.file.read())

    return filepath