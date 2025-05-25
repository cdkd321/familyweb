from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from config import Config # Assuming config.py is in the same directory

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Register blueprints here
    from routes import main_bp # main_bp might still be in backend/routes.py
    from routes.auth_routes import auth_bp
    from routes.family_tree_info_routes import family_tree_info_bp
    from routes.member_routes import member_bp # Import member_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(family_tree_info_bp)
    app.register_blueprint(member_bp) # Register member_bp

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
