import os
import shutil

# Aktuelles Projektverzeichnis
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

# Ordner, die gelöscht werden können, ohne den Build zu zerstören
REMOVE_DIRS = [
    "node_modules",           # kann nach "npm install" wiederhergestellt werden
    "dist",                   # Vite/Tauri build output
    "src-tauri/target",       # Rust Build Output
    "src-tauri/resources/bin" # generierte Tauri Binärdateien
]

# Dateien, die gelöscht werden sollen
REMOVE_FILES = [
    ".DS_Store",
    "Thumbs.db",
    "npm-debug.log",
    "yarn-error.log"
]

def delete_path(path):
    """Löscht Datei oder Ordner sicher"""
    if os.path.isdir(path):
        try:
            shutil.rmtree(path)
            print(f"[Ordner gelöscht] {path}")
        except Exception as e:
            print(f"[Fehler beim Löschen des Ordners] {path}: {e}")
    elif os.path.isfile(path):
        try:
            os.remove(path)
            print(f"[Datei gelöscht] {path}")
        except Exception as e:
            print(f"[Fehler beim Löschen der Datei] {path}: {e}")

def main():
    print("Starte Cleanup...")

    # Ordner löschen
    for d in REMOVE_DIRS:
        full_path = os.path.join(PROJECT_DIR, d)
        if os.path.exists(full_path):
            delete_path(full_path)
        else:
            print(f"[Nicht gefunden] {full_path}")

    # Dateien löschen
    for root, _, files in os.walk(PROJECT_DIR):
        for f in files:
            if f in REMOVE_FILES:
                delete_path(os.path.join(root, f))

    print("\nCleanup abgeschlossen – Projekt bereit für Commit!")
    input("\nDrücke [Enter], um das Fenster zu schließen...")

if __name__ == "__main__":
    main()
