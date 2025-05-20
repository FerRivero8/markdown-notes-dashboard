from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
import os
import shutil
from utils.file_manager import list_folders, list_files, save_markdown
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash

db = SQLAlchemy()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'

db.init_app(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True)
    avatar = db.Column(db.String(200))


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

    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'msg': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=str(user.id))


    return jsonify({
        'access_token': access_token,
        'user': {
            'name': user.name,
            'email': user.email,
            'avatar': user.avatar
        }
    })

# ------------------- API protegida con JWT -------------------

@app.route('/api/folders', methods=['GET'])
@jwt_required()
def get_folders():
    print("🧠 Usuario con ID:", get_jwt_identity())
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
    
@app.route('/api/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    return jsonify({
        'name': user.name,
        'email': user.email,
        'avatar': user.avatar
    })


# ------------------- Servir archivos -------------------

@app.route('/data/<path:filename>')
@jwt_required()
def serve_markdown_file(filename):
    return send_from_directory('data', filename)

# ------------------- Inicio -------------------

if __name__ == '__main__':
    app.run(debug=True)
