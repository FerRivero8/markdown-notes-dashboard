# 🧠 MySpace – Gestor de Notas Markdown Personalizado

**MySpace** es una aplicación web construida con **Flask**, **JavaScript** y **Markdown** que permite a múltiples usuarios gestionar notas personales en formato `.md` con una estructura jerárquica de carpetas. Cada usuario tiene su propio espacio de trabajo, totalmente aislado y seguro.

---

## 🚀 Funcionalidades Principales

- ✅ Registro y autenticación de usuarios mediante **JWT**
- 🗂️ Gestión de carpetas y archivos Markdown
- ✏️ Editor de Markdown con previsualización en tiempo real
- 📂 Estructura de árbol para organizar el contenido
- 📌 Arrastrar y soltar archivos entre carpetas
- 🖼️ Avatar personalizado por usuario
- 🧾 Modales para crear, eliminar y renombrar carpetas y archivos
- 🔒 Panel de usuario individual, aislado por ID

---

## 🧱 Tecnologías Usadas

- **Backend:** Flask + Flask-JWT-Extended + SQLAlchemy  
- **Frontend:** HTML5 + CSS3 + Vanilla JavaScript  
- **Base de datos:** SQLite  
- **Markdown Preview:** `marked.js`  
- **Gestión de sesiones:** LocalStorage + JWT

---

## 🧩 Estructura del Proyecto

```
MySpace/
├── static/
│   ├── style.css
│   ├── script.js
│   └── img/
├── templates/
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   └── editor.html
├── utils/
│   └── file_manager.py
├── data/
│   └── [user_id]/
├── users.db
├── app.py
└── README.md
```

---

## ⚙️ Instalación y Configuración

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/myspace.git
   cd myspace
   ```

2. **Crea un entorno virtual e instala dependencias:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Inicializa la base de datos:**
   ```python
   from app import db
   db.create_all()
   ```

4. **Ejecuta la aplicación:**
   ```bash
   python app.py
   ```

---

## 🔐 Seguridad

- Los tokens JWT se almacenan en `localStorage` y se validan en cada ruta protegida.
- Cada usuario tiene un directorio aislado en `data/[user_id]` para evitar el acceso cruzado.
- Solo se puede acceder al contenido con token válido.

---

## 🎯 Próximas Mejoras

- Sistema de registro (sign up)
- Compartir carpetas con otros usuarios
- Historial de versiones de archivos
- Editor Markdown enriquecido (syntax highlighting, emojis, tablas)
- Subida de imágenes en notas
- Tema claro/oscuro configurable

---

## 👨‍💻 Autor

Creado con ❤️ por Fernando Rivero (FerRivero8)

---

## 📄 Licencia

Este proyecto está licenciado bajo los términos de la licencia MIT.
