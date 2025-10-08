import os
import shutil

# Pfad zu deinem Projekt (automatisch das aktuelle Verzeichnis)
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

# Ordner, die sicher gelöscht werden können
REMOVE_DIRS = [
    "node_modules",
    "dist",
    "src-tauri/target",
    "src-tauri/resources/bin",
    "__pycache__",
]

# Dateien, die gelöscht werden sollen
REMOVE_FILES = [
    ".DS_Store",
    "Thumbs.db",
    "npm-debug.log",
    "yarn-error.log",
]

def delete_path(path):
    if os.path.isdir(path):
        shutil.rmtree(path, ignore_errors=True)
        print(f"Ordner gelöscht: {path}")
    elif os.path.isfile(path):
        os.remove(path)
        print(f"Datei gelöscht: {path}")

def main():
    print("Cleaning up project...")

    for d in REMOVE_DIRS:
        full_path = os.path.join(PROJECT_DIR, d)
        if os.path.exists(full_path):
            delete_path(full_path)

    for root, _, files in os.walk(PROJECT_DIR):
        for f in files:
            if f in REMOVE_FILES:
                delete_path(os.path.join(root, f))

    print("\nCleanup fertig – Projekt ist bereit für Commit.")
    input("\nDrücke [Enter], um das Fenster zu schließen...")

if __name__ == "__main__":
    main()
