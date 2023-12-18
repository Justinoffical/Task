CREATE TABLE user (
    ID INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    mobile TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    role_id INTEGER,
    peleton_id INT,
    FOREIGN KEY (role_id) REFERENCES role(id),
    FOREIGN KEY (peleton_id) REFERENCES peleton(id)
);

DROP TABLE user;

CREATE TABLE IF NOT EXISTS forelder_barn(
    forelder_id INTEGER NOT NULL,
    barn_id INT NOT NULL,
    PRIMARY key (forelder_id, barn_id),
    FOREIGN key (forelder_id) REFERENCES user(id),
    FOREIGN KEY (barn_id) REFERENCES user(id)
);

DROP TABLE forelder_barn;

CREATE TABLE IF NOT EXISTS role (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL
);

DROP TABLE role;

CREATE TABLE IF NOT EXISTS kompani (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    kompaniname TEXT NOT NULL,
    leader_id INTERGER NOT NULL,
    FOREIGN KEY (leader_id) REFERENCES user(id)
);

DROP TABLE kompani;

CREATE TABLE peleton (
    ID INTEGER PRIMARY KEY,
    peleton TEXT NOT NULL,
    kompani_id INTEGER NOT NULL,
    FOREIGN KEY (kompani_id) REFERENCES kompani(id)
);

DROP TABLE peleton;

INSERT INTO role (role) VALUES
('admin'),
('Leader'),
('soldier'),
('Parent'),
('child');

INSERT INTO kompani (kompaniname, leader_id) VALUES
('Alpha Kompani', 1),
('Bravo Kompani', 2),
('Charlie Kompani', 3),
('No kompani', 4);

 
INSERT INTO peleton (peleton, kompani_id) VALUES
('Peleton 1', 1),
('Peleton 2', 1),
('Peleton 3', 2),
('Peleton 4', 2),
('Peleton 5', 3);
 
  
INSERT INTO user (username, firstname, lastname, email, mobile, password,  role_id, peleton_id) VALUES
('john_doe', 'John', 'Doe', 'john@example.com', '1234567890', 'password123',1, 1),
('jane_doe', 'Jane', 'Doe', 'jane@example.com', '0987654321', 'password123', 2, 1),
('admin_user', 'Admin', 'User', 'admin@example.com', '1122334455', 'password123',  3, 2),
('parent_user', 'Parent', 'User', 'parent@example.com', '5566778899', 'password123',  4, 2);
 