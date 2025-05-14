import os

def list_folders(base_path):
    return [f for f in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, f))]

def list_files(base_path, folder):
    folder_path = os.path.join(base_path, folder)
    if not os.path.exists(folder_path):
        return []
    return [f for f in os.listdir(folder_path) if f.endswith('.md')]

def save_markdown(base_path, folder, filename, content):
    folder_path = os.path.join(base_path, folder)
    if not os.path.exists(folder_path):
        raise FileNotFoundError("Folder does not exist")

    file_path = os.path.join(folder_path, filename)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

