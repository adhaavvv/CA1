const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');

// ✅ Body parser
app.use(express.urlencoded({ extended: true }));

// ✅ Static serving (absolute safe path)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Memory upload storage (REQUIRED for Vercel)
const upload = multer({ storage: multer.memoryStorage() });

function calculateCalories({ weight, height, age, gender }) {
  weight = parseFloat(weight);
  height = parseFloat(height);
  age = parseInt(age);

  if (gender === 'male') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
}

let meals = [];
let nextId = 1;
let dailyCalorieGoal = null;

// ==========================================
// ROUTES
// ==========================================

app.get('/', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>MacroMate</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  </head>
  <body>
    <nav class="navbar navbar-expand-lg bg-warning">
      <div class="container">
        <a class="navbar-brand" href="/">MacroMate</a>
        <ul class="navbar-nav">
          <li class="nav-item">
            <a class="nav-link" href="/meals">View Meals</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/addEntry">Add Entry</a>
          </li>
        </ul>
      </div>
    </nav>

    <div class="container text-center mt-5">
      <h1>Welcome to MacroMate!</h1>
      <p>Track your meals and calories easily.</p>
    </div>
  </body>
  </html>
  `);
});


// ✅ Add entry form
app.get('/addEntry', (req, res) => {
  res.send(`
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

  <div class="container mt-5">
    <h3>Add New Meal</h3>
    <form method="POST" action="/addEntry" enctype="multipart/form-data">

      <input name="title" class="form-control mb-2" placeholder="Meal Title" required>
      <input name="calories" type="number" class="form-control mb-2" placeholder="Calories" required>
      <input name="date" type="date" class="form-control mb-2" required>
      <input name="time" type="time" class="form-control mb-2">
      <textarea name="notes" class="form-control mb-2"></textarea>

      <input name="filename" type="file" class="form-control mb-2">

      <button class="btn btn-success">Add Meal</button>

    </form>
  </div>
  `);
});


// ✅ Add meal (no filesystem writing)
app.post('/addEntry', upload.single('filename'), (req, res) => {
  const { title, calories, date, time, notes } = req.body;

  const imagePath = req.file ? `/uploads/${req.file.originalname}` : '';

  const newMeal = {
    id: nextId++,
    title,
    calories: Number(calories),
    date,
    time,
    notes,
    image: imagePath,
  };

  meals.push(newMeal);

  res.redirect('/meals');
});


// ✅ Meals view
app.get('/meals', (req, res) => {
  res.send(`
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

  <div class="container mt-5">
      <h2>Meal Entries</h2>

      ${meals.map(m => `
        <div class="card my-2 p-2">
          <strong>${m.title}</strong>
          <br>🔥 ${m.calories} kcal
          <br>${m.date} ${m.time || ""}
          <br>Notes: ${m.notes || "N/A"}
        </div>
      `).join("") || "<p>No meals yet.</p>"}
  </div>
  `);
});


// ✅ Calorie goal calculator
app.post('/setCalorieGoal', (req,res)=>{
  dailyCalorieGoal = calculateCalories(req.body);
  res.redirect('/meals');
});


// ==========================================
// ✅ REQUIRED FOR VERCEL
// Remove app.listen() and export app
// ==========================================

module.exports = app;