const express = require("express");
const path = require("path");
const sqlite3 = require('better-sqlite3')
const bcrypt = require('bcrypt'); // Import the bcrypt library
const saltRounds = 10; // Set the number of salt rounds for bcrypt
const db = sqlite3('./users.db', {verbose: console.log})
const session = require('express-session')
const dotenv = require('dotenv');
dotenv.config();


const app = express();
const staticPath = path.join(__dirname, 'public')

app.use(express.urlencoded({ extended: true }));


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.post('/login', (req, res) => {
    console.log(req.body)
    let user = checkUserPassword(req.body.username, req.body.password) 
    if (user != null) {
        req.session.loggedIn = true
        req.session.username = req.body.username
        req.session.userrole = user.role
        req.session.name = user.firstName + ' ' + user.lastName
        req.session.userid = user.ID 
        //res.redirect('/');
        // Pseudocode - Adjust according to your actual frontend framework or vanilla JS
        if (req.session.userrole === 'soldier') {
            res.sendFile(path.join(__dirname, "public/soldier.html"));
        } else if (req.session.userrole === 'Leader') {
            res.sendFile(path.join(__dirname, "public/Leader.html"));
        } else if (req.session.userrole === 'admin') {
            res.sendFile(path.join(__dirname, "public/admin.html"));
        }else if (req.session.userrole === 'forelder') {
            res.sendFile(path.join(__dirname, "public/forelder.html"));
        }

    } else {
        req.session.loggedIn = false;
        res.sendFile(path.join(__dirname, "public/loginForm.html"));
    }

})
function checkUserPassword(username, password) {
    // Retrieve the hashed password from the database based on the username
    const sql = db.prepare('SELECT user.id, user.firstname, user.lastname, role.role as role, user.password FROM user INNER JOIN role WHERE user.role_id = role.id AND username = ?');
    const userRecord = sql.get(username);

    // If the user doesn't exist, or the password is incorrect, return null
    if (!userRecord || !bcrypt.compareSync(password, userRecord.password)) {
        return null;
    }

    // If the password is correct, return the user information
    return {
        ID: userRecord.id,
        firstName: userRecord.firstname,
        lastName: userRecord.lastname,
        role: userRecord.role,
    };
}

// Middleware to check if the user has the admin role
const isAdmin = (req, res, next) => {
    if (req.session.userrole === 'admin') {
        // User has admin role, proceed to the next middleware/route
        next();
    } else {
        // User does not have admin role, redirect to login form or another page
        res.sendFile(path.join(__dirname, "public/loginForm.html"));
    }
};

// Apply the isAdmin middleware only to the /admin.html route
app.get('/admin.html', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// For other routes under /admin, apply the isAdmin middleware
app.use('/admin', isAdmin);



// Middleware to check if the user has the Leader role
const isLeader = (req, res, next) => {
    if (req.session.userrole === 'Leader') {
        next();
    } else {
        res.sendFile(path.join(__dirname, "public/loginForm.html"));
    }
};
app.get('/Leader.html', isLeader, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/Leader.html'));
});

app.use('/Leader', isLeader);

// Middleware to check if the user has the Leader or admin role
const isLeaderOrAdmin = (req, res, next) => {
    if (req.session.userrole === 'Leader' || req.session.userrole === 'admin') {
        next();
    } else {
        res.sendFile(path.join(__dirname, "public/loginForm.html"));
    }
};
app.get('/createKompani.html', isLeaderOrAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/createKompani.html'));
});

//Denne henger sammen med i loginformen -- Jeg var lat og har både login og register i loginform.html
//  <form action='/register' method="POST">
 
 
 app.get('/createUser.html', (req, res) => {
    console.log("redirect to create user")
    res.sendFile(path.join(__dirname, 'public', 'createUser.html'));
});

//addUser function
function addUser(username, firstName, lastName, mobile, email, password, role_id = 3, peleton_id = 6) {
    // Hash the password before storing it
    const passworden = bcrypt.hashSync(password, saltRounds);
    const sql = db.prepare("INSERT INTO user (username, firstName, lastName, mobile, email, password, role_id, peleton_id) values (?, ?, ?, ?, ?, ?, ?, ?)");
    const info = sql.run(username, firstName, lastName, mobile, email, passworden, role_id, peleton_id);
    return info;
}

app.post('/create-user', (req, res) => {
    console.log("createUser", req.body);
    const user = req.body;
    addUser(user.username, user.firstname, user.lastname, user.mobile, user.email, user.password, user.role_id, user.peleton_id);
    // Redirect to user list or confirmation page after adding user
    res.redirect('/loginForm.html');
});


function addKompani(kompaniname, leader_id = 2) {
    const sql = db.prepare("INSERT INTO kompani (kompaniname, leader_id) values (?, ?)");
    const info = sql.run(kompaniname, leader_id);
    return info;
}

app.post('/create-kompani', (req, res) => {
    console.log("createKompani", req.body);
    const kompani = req.body;
    addKompani(kompani.kompaniname, kompani.leader_id);
    // Redirect to user list or confirmation page after adding user
    res.redirect('/loginForm.html');
});


//Middleware 
//I alle app.get() app.post og app.put blir denne funksjonen kjørt før app.() blir kjørt. 
//Her sjekkes om bruker er logget inn, hvis ikke blir du rutet til loginformen
//login og register ligger foran deklarasjonen av middleware, så denne slår
//derfor ikke inn der
app.use((req, res, next)=>{
    console.log(req.session)
    if (req.session.loggedIn != undefined && req.session.loggedIn){
        console.log("Bruker innlogget")
        next()
    }
    else {
        console.log("Bruker not logged in - redirect i middleware")
        res.sendFile(path.join(__dirname, "public/loginForm.html"));

    }
})

//denne må defineres etter middleware. 
//Jeg prøvde å flytte den opp, for å rydde i koden og da fungerte det ikke
app.use(express.static(staticPath));


async function getUsers(request, response) {
    const sql = db.prepare(`
        SELECT user.username, user.firstname, user.lastname, user.mobile, user.email, user.password,
               peleton.peleton, kompani.kompaniname, role.role 
        FROM user
        INNER JOIN peleton ON user.peleton_id = peleton.id
        INNER JOIN kompani ON peleton.kompani_id = kompani.id
        INNER JOIN role ON user.role_id = role.id
        
    `);

    let rows = sql.all();
    
    // Send the response as JSON
    response.json(rows);
}

app.get("/users", getUsers);

//
async function getKompani(request, response) {
    const sql = db.prepare(`
        SELECT kompani.kompaniname, user.username AS leader_username
        FROM kompani
        INNER JOIN user ON kompani.leader_id = user.id
    `);

    // Execute the SQL query and retrieve the results
    let rows = sql.all();

    // Send the response as JSON
    response.json(rows);
}

// This route will return the user data as JSON
app.get("/Kompani", getKompani);

//
async function getPeleton(request, response) {
    const sql = db.prepare(`
        SELECT peleton.peleton, kompani.kompaniname AS kompani_name
        FROM peleton
        INNER JOIN kompani ON peleton.kompani_id = kompani.id
    `);

    // Execute the SQL query and retrieve the results
    let rows = sql.all();

    // Send the response as JSON
    response.json(rows);
}

// This route will return the user data as JSON
app.get("/Peleton", getPeleton);


async function getForelder(request, response) {
    const sql = db.prepare(`
        SELECT forelder_barn.forelder_id, forelder.username AS forelder_username, barn.username AS barn_username, 
        barn.firstname AS barn_firstname,  barn.lastname AS barn_lastname,  barn.mobile AS barn_mobile
        FROM forelder_barn
        INNER JOIN user AS forelder ON forelder_barn.forelder_id = forelder.id
        INNER JOIN user AS barn ON forelder_barn.barn_id = barn.id;
    `);

    let rows = sql.all();

    // Send the response as JSON
    response.json(rows);
}

app.get("/forelder", getForelder);




// update for admin
function updateUserDB(username, firstName, lastName, mobile, role_id, peleton_id) {
    const sql = db.prepare("update user set firstName=?, lastName=?, mobile=?, role_id=?, peleton_id=? where username=?")
    const info = sql.run(firstName, lastName, mobile, role_id, peleton_id, username)
}

// update for leader
function updateUserDBleader(username, firstName, lastName, mobile, peleton_id) {
    const sql = db.prepare("update user set firstName=?, lastName=?, mobile=?, peleton_id=? where username=?")
    const info = sql.run(firstName, lastName, mobile, peleton_id, username)
}

// update for soldier
function updateUserDBSoldier(username, firstName, lastName, mobile, req) {
    // Check if the logged-in user is the same as the user being updated
    if (req.session.username === username) {
        const sql = db.prepare("UPDATE user SET firstName=?, lastName=?, mobile=? WHERE username=?");
        const info = sql.run(firstName, lastName, mobile, username);
    }
}

function updateKompani(kompaniname, leader_id, req) {
    // Check if the logged-in user is the same as the user being updated
        const sql = db.prepare("UPDATE kompani SET leader_id=? WHERE kompaniname=?");
        const info = sql.run(leader_id, kompaniname);

}
//for admin
 app.post("/user", (req, res) => {
    console.log(req.body);
    const user = req.body;
    updateUserDB(user.username, user.firstname, user.lastname, user.cell, user.role_id, user.peleton_id);
    res.sendFile(path.join(__dirname, "public/admin.html"));
})

// for leader
app.post("/userld", (req, res) => {
    console.log(req.body);
    const user = req.body;
    updateUserDBleader(user.username, user.firstname, user.lastname, user.cell, user.peleton_id);
    res.sendFile(path.join(__dirname, "public/Leader.html"));
})

// for soldier
app.post("/userSd", (req, res) => {
    console.log(req.body);
    const user = req.body;
    updateUserDBSoldier(user.username, user.firstname, user.lastname, user.cell, req);
    res.sendFile(path.join(__dirname, "public/soldier.html"));
})

app.post("/kompani", (req, res) => {
    console.log(req.body);
    const kompani = req.body;
    updateKompani(kompani.kompaniname, kompani.leader_id);
    res.sendFile(path.join(__dirname, "public/admin.html"));
})

//for delete button
app.delete('/user/:username', (req, res) => {
    const username = req.params.username;

    // Disable foreign key constraints
    db.exec('PRAGMA foreign_keys = OFF;');

    // Your DELETE statement here
    const sql = db.prepare('DELETE FROM user WHERE username = ?');
    const result = sql.run(username);

    // Enable foreign key constraints
    db.exec('PRAGMA foreign_keys = ON;');

    if (result.changes > 0) {
        // User deleted successfully
        res.status(200).json({ message: 'User deleted successfully' });
    } else {
        // User not found or failed to delete
        res.status(404).json({ error: 'User not found or failed to delete' });
    }
});

//for delete button
app.delete('/kompani/:kompaniname', (req, res) => {
    const kompaniname = req.params.kompaniname;
        // Disable foreign key constraints
        db.exec('PRAGMA foreign_keys = OFF;');
    // Your DELETE statement here
    const sql = db.prepare('DELETE FROM kompani WHERE kompaniname = ?');
    const result = sql.run(kompaniname);
    if (result.changes > 0) {
            // Enable foreign key constraints
    db.exec('PRAGMA foreign_keys = ON;');
        // User deleted successfully
        res.status(200).json({ message: 'Kompani deleted successfully' });
    } else {
        // User not found or failed to delete
        res.status(404).json({ error: 'Kompani not found or failed to delete' });
    }
});

function addForelder(forelder_id, barn_id) {
    // Check if the combination of forelder_id and barn_id already exists
    const checkSql = db.prepare("SELECT COUNT(*) as count FROM forelder_barn WHERE forelder_id = ? AND barn_id = ?");
    const { count } = checkSql.get(forelder_id, barn_id);

    // If the combination already exists, return an error or handle it accordingly
    if (count > 0) {
        return { error: 'Combination already exists' };
    }

    // Insert the new record
    const insertSql = db.prepare("INSERT INTO forelder_barn (forelder_id, barn_id) VALUES (?, ?)");
    const info = insertSql.run(forelder_id, barn_id);

    return info;
}


app.post('/create-forelder', (req, res) => {
    console.log("createForelder", req.body);
    const forelder_barn = req.body;
    addForelder(forelder_barn.forelder_id, forelder_barn.barn_id);
    // Redirect to user list or confirmation page after adding user
    res.redirect('/loginForm.html');
});

app.get('/forelder-options', (req, res) => {
    const sql = db.prepare(`
        SELECT forelder_id, forelder.username AS forelder_username
        FROM forelder_barn
        INNER JOIN user AS forelder ON forelder_barn.forelder_id = forelder.id
    `);

    const options = sql.all();
    res.json(options);
});

// Endpoint to get barn options
app.get('/barn-options', (req, res) => {
    const sql = db.prepare(`
        SELECT barn_id, barn.username AS barn_username, barn.firstname AS barn_firstname, barn.lastname AS barn_lastname
        FROM forelder_barn
        INNER JOIN user AS barn ON forelder_barn.barn_id = barn.id
    `);

    const options = sql.all();
    res.json(options);
});



app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});





