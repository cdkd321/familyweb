from app import db # This should be fine if app.py is in the same directory and Python's import system can find it.
# However, to be consistent with the changes in routes.py, and if 'app' is treated as a module:
# from app import db # No change needed if app is discoverable
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=True, default='viewer')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Member(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    birth_date = db.Column(db.Date, nullable=True)
    death_date = db.Column(db.Date, nullable=True)
    bio = db.Column(db.Text, nullable=True)
    photo_url = db.Column(db.String(255), nullable=True)
    
    parent1_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=True)
    parent2_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=True)
    
    spouse_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=True)

    # Relationships
    # Using remote_side=[id] for parent1 and parent2 to avoid SQLAlchemy confusion with multiple paths to Member
    parent1 = db.relationship('Member', foreign_keys=[parent1_id], remote_side=[id], backref=db.backref('children_as_parent1', lazy='dynamic'))
    parent2 = db.relationship('Member', foreign_keys=[parent2_id], remote_side=[id], backref=db.backref('children_as_parent2', lazy='dynamic'))
    
    # Relationship for spouse (one-to-one, but can be extended)
    # Ensure unique=True if one spouse per member, otherwise manage via an association table for multiple spouses
    spouse = db.relationship('Member', foreign_keys=[spouse_id], remote_side=[id], uselist=False, backref=db.backref('married_to', uselist=False, remote_side=[id]))

    # Children relationship: members for whom this member is parent1 or parent2
    # This is a simplified representation. A more complex setup might be needed for full features.
    # For a basic children list, we can query where parent1_id or parent2_id is self.id
    # A more direct children relationship can be defined using an association table or by adjusting backrefs if parent relationships are more fixed.
    # The backrefs 'children_as_parent1' and 'children_as_parent2' can be used to get children.

    def __repr__(self):
        return f'<Member {self.name}>'

    def to_dict(self, include_relationships=False):
        data = {
            'id': self.id,
            'name': self.name,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'death_date': self.death_date.isoformat() if self.death_date else None,
            'bio': self.bio,
            'photo_url': self.photo_url,
            'parent1_id': self.parent1_id,
            'parent2_id': self.parent2_id,
            'spouse_id': self.spouse_id
        }
        # Basic serialization of children for now, can be expanded
        if include_relationships:
            # This could be very large if not handled with care (e.g., depth limiting)
            # For now, let's just list IDs or names of direct children.
            children = []
            if self.children_as_parent1:
                for child in self.children_as_parent1:
                    children.append({'id': child.id, 'name': child.name})
            if self.children_as_parent2:
                for child in self.children_as_parent2:
                    if not any(c['id'] == child.id for c in children): # Avoid duplicates
                        children.append({'id': child.id, 'name': child.name})
            data['children'] = children
            
            # Spouse info
            if self.spouse:
                data['spouse_name'] = self.spouse.name # Example of adding related field
        return data

class FamilyTreeInfo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=True, default='My Family Tree')
    description = db.Column(db.Text, nullable=True)
    historical_documents_links = db.Column(db.Text, nullable=True) # Store links one per line

    def __repr__(self):
        return f'<FamilyTreeInfo {self.name}>'
