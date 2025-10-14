import os
import shutil

# === Projektpfad ermitteln ===
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

# === Ordner, die bei Electron sicher gelöscht werden können ===
REMOVE_DIRS = [
    "node_modules",             # kann nach npm install neu erstellt werden
    "dist",                     # Vite-Build-Output (Frontend)
    "out",                      # electron-builder Output (z. B. Installer, .exe)
    "build",                    # electron-packager / builder temporäre Daten
    ".webpack",                 # bei electron-webpack Projekten
    "release",                  # evtl. alte Release-Builds
    "app/dist",                 # falls du src/frontend getrennt hältst
    "app/node_modules",         # Submodule (optional)
    "temp",                     # temporäre Ordner
    "__pycache__",              # Python-Cache, falls vorhanden
]

# === Unnötige Dateien ===
REMOVE_FILES = [
    ".DS_Store",
    "Thumbs.db",
    "npm-debug.log",
    "yarn-error.log",
    "package-lock.json",    # optional – löschen, wenn du Lockfiles vermeiden willst
    "pnpm-lock.yaml",
    "yarn.lock"
]

def delete_path(path):
    """Löscht Datei oder Ordner sicher"""
    if os.path.isdir(path):
        try:
            shutil.rmtree(path)
            print(f"[🗑️ Ordner gelöscht] {path}")
        except Exception as e:
            print(f"[❌ Fehler beim Löschen des Ordners] {path}: {e}")
    elif os.path.isfile(path):
        try:
            os.remove(path)
            print(f"[🧹 Datei gelöscht] {path}")
        except Exception as e:
            print(f"[❌ Fehler beim Löschen der Datei] {path}: {e}")

def main():
    print("🚀 Starte Electron-Projekt Cleanup...\n")

    # Ordner löschen
    for d in REMOVE_DIRS:
        full_path = os.path.join(PROJECT_DIR, d)
        if os.path.exists(full_path):
            delete_path(full_path)
        else:
            print(f"[🔍 Nicht gefunden] {full_path}")

    # Dateien löschen
    for root, _, files in os.walk(PROJECT_DIR):
        for f in files:
            if f in REMOVE_FILES:
                delete_path(os.path.join(root, f))

    print("\n✅ Cleanup abgeschlossen – Projekt ist frisch für neuen Build!")
    input("\nDrücke [Enter], um das Fenster zu schließen...")

if __name__ == "__main__":
    main()
