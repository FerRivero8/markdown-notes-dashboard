from app import app, db, User
from werkzeug.security import generate_password_hash

def create_user(username, password, name, email, avatar):
    with app.app_context():
        if User.query.filter_by(username=username).first():
            print(f'⚠️ User "{username}" already exists.')
            return

        password_hash = generate_password_hash(password)
        user = User(
            username=username,
            password_hash=password_hash,
            name=name,
            email=email,
            avatar=avatar
        )
        db.session.add(user)
        db.session.commit()
        print(f'✅ User "{username}" created successfully.')

# 🧪 Ejemplo de uso
if __name__ == '__main__':
    # Cambia estos datos por los que quieras insertar
    create_user(
        username='bob',
        password='bob',
        name='Bob Johnson',
        email='bob@example.com',
        avatar='img/profile.JPG'
    )
