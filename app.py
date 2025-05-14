from flask import Flask, render_template, request, jsonify
import os
from utils.file_manager import list_folders, list_files, save_markdown
from flask import send_from_directory

app = Flask(__name__)
DATA_DIR = os.path.join(os.getcwd(), 'data')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/editor')
def editor():
    return render_template('editor.html')

@app.route('/api/folders', methods=['GET'])
def get_folders():
    folders = list_folders(DATA_DIR)
    return jsonify(folders)

@app.route('/api/files', methods=['GET'])
def get_files():
    folder = request.args.get('folder')
    files = list_files(DATA_DIR, folder)
    return jsonify(files)

@app.route('/api/save', methods=['POST'])
def save_file():
    data = request.get_json()
    folder = data['folder']
    filename = data['filename']
    content = data['content']
    save_markdown(DATA_DIR, folder, filename, content)
    return jsonify({'status': 'ok'})

@app.route('/api/delete_folder', methods=['DELETE'])
def delete_folder():
    folder = request.args.get('folder')
    folder_path = os.path.join(DATA_DIR, folder)
    if os.path.exists(folder_path):
        import shutil
        shutil.rmtree(folder_path)
        return jsonify({'status': 'deleted'})
    return jsonify({'status': 'not found'}), 404


@app.route('/api/delete_file', methods=['DELETE'])
def delete_file():
    folder = request.args.get('folder')
    file = request.args.get('file')
    file_path = os.path.join(DATA_DIR, folder, file)
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({'status': 'deleted'})
    return jsonify({'status': 'not found'}), 404


@app.route('/data/<path:filename>')
def serve_markdown_file(filename):
    return send_from_directory('data', filename)

if __name__ == '__main__':
    app.run(debug=True)
