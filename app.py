from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
import os
import shutil
from utils.file_manager import list_folders, list_files, save_markdown

app = Flask(__name__)

# 📁 Ruta base de almacenamiento de archivos markdown
DATA_DIR = os.path.join(os.getcwd(), 'data')

# 🔐 Clave secreta para firmar los JWT
app.config['JWT_SECRET_KEY'] = 'clave-super-secreta'  # cámbiala por algo más seguro
jwt = JWTManager(app)

# ------------------- Rutas públicas -------------------

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/editor')
def editor():
    return render_template('editor.html')

# ------------------- Autenticación -------------------

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # 🔐 AUTENTICACIÓN BÁSICA (de prueba)
    if username == 'fer' and password == 'fer':
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token)
    else:
        return jsonify({'msg': 'Credenciales inválidas'}), 401

# ------------------- API protegida con JWT -------------------

@app.route('/api/folders', methods=['GET'])
@jwt_required()
def get_folders():
    folders = list_folders(DATA_DIR)
    return jsonify(folders)

@app.route('/api/files', methods=['GET'])
@jwt_required()
def get_files():
    folder = request.args.get('folder')
    if not folder:
        return jsonify({'status': 'error', 'message': 'Parámetro "folder" requerido'}), 400

    files = list_files(DATA_DIR, folder)
    return jsonify(files)

@app.route('/api/save', methods=['POST'])
@jwt_required()
def save_file():
    data = request.get_json()
    folder = data['folder']
    filename = data['filename']
    content = data['content']
    try:
        save_markdown(DATA_DIR, folder, filename, content)
        return jsonify({'status': 'ok'})
    except FileNotFoundError:
        return jsonify({'status': 'error', 'message': 'La carpeta no existe'}), 400

@app.route('/api/delete_folder', methods=['DELETE'])
@jwt_required()
def delete_folder():
    folder = request.args.get('folder')
    folder_path = os.path.join(DATA_DIR, folder)
    if os.path.exists(folder_path):
        shutil.rmtree(folder_path)
        return jsonify({'status': 'deleted'})
    return jsonify({'status': 'not found'}), 404

@app.route('/api/delete_file', methods=['DELETE'])
@jwt_required()
def delete_file():
    folder = request.args.get('folder')
    file = request.args.get('file')
    file_path = os.path.join(DATA_DIR, folder, file)
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({'status': 'deleted'})
    return jsonify({'status': 'not found'}), 404

@app.route('/api/move_file', methods=['POST'])
@jwt_required()
def move_file():
    data = request.get_json()
    file = data.get('file')
    source = data.get('source')
    target = data.get('target')

    if not all([file, source, target]):
        return jsonify({'status': 'error', 'message': 'Datos incompletos'}), 400

    source_path = os.path.join(DATA_DIR, source, file)
    target_folder_path = os.path.join(DATA_DIR, target)
    target_path = os.path.join(target_folder_path, file)

    if not os.path.exists(source_path):
        return jsonify({'status': 'error', 'message': 'Archivo origen no encontrado'}), 404

    if not os.path.exists(target_folder_path):
        os.makedirs(target_folder_path)

    try:
        shutil.move(source_path, target_path)
        return jsonify({'status': 'moved'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ------------------- Servir archivos -------------------

@app.route('/data/<path:filename>')
@jwt_required()
def serve_markdown_file(filename):
    return send_from_directory('data', filename)

# ------------------- Inicio -------------------

if __name__ == '__main__':
    app.run(debug=True)
