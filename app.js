const express = require('express');
const app = express();
const port = 1000;
app.use(express.urlencoded({ extended: true }));
const path = require('path');
const multer = require('multer');

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

app.use(express.static('public'));

const storage = multer.diskStorage({
destination: function (req, file, cb) {
cb(null, 'public/uploads/');
},
filename: function (req, file, cb) {
const uniqueName = Date.now() + '-' + file.originalname;
cb(null, uniqueName);
}
});
const upload = multer({ storage });

app.get('/', (req, res) => {
    res.send(`
    <head>
  <meta charset="UTF-8">
  <title>MacroMate</title>
  <link rel="icon" href="/favicon.ico" type="image/x-icon">
  <link rel="shortcut icon" href="/favicon.png" type="image/x-icon">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
</head>
<body>  
<nav class="navbar navbar-expand-lg bg-warning">
        <div class="container">
            <a class="navbar-brand" href="#"><img src="/uploads/MacroMate Horizontal.png" style="width: 200px"></a>
            <ul class="navbar-nav">
                <li class="nav-item">
                  <a class="nav-link" href="/meals">View Meal Entries</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="/addEntry">Add a New Entry</a>
                </li>
              </ul>
            </div>
            </nav>
            <div class="container mt-5 text-center" style="margin-bottom: 3px;">
            <div class="container">
            <img src="/uploads/MacroMate Logo.png"style="width: 500px; object-fit: cover;" 
            alt="MacroMate Logo">
            </div>
            <h1 style="color:Brown;">Welcome to MacroMate: Powered by Adhav!</h1>
            <p1>Track your calories, and live a healthier lifestyle.</p1>
            <p><i>Fuel smart. Track better. Live stronger.</i></p>

            <div class="container">
            <div class="row g-4 mb-5">
              <div class="col-6">
                <div class="card h-100">
                  <div class="text-center pt-3"> 
                    <img src="/uploads/ViewMealEntries.png" 
                         class="card-img-top" 
                         style="width: 200px; object-fit: cover;" 
                         alt="View Meal Entries">
                  </div>
                  <div class="card-body d-flex flex-column">
                    <div class="card-footer bg-white px-0 pb-0 pt-3">
                      <a href="/meals" class="btn btn-primary m-2">View Meal Entries</a>
                    </div>
                  </div>
                </div>
              </div>
          
              <div class="col-6">
                <div class="card h-100">
                  <div class="text-center pt-3"> 
                    <img src="/uploads/AddMealEntries.png" 
                         class="card-img-top" 
                         style="width: 200px; object-fit: cover;" 
                         alt="Add Meal Entries">
                  </div>
                  <div class="card-body d-flex flex-column">
                    <div class="card-footer bg-white px-0 pb-0 pt-3">
                      <a href="/addEntry" class="btn btn-success m-2">Add a New Entry</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
    </body>
    </html>
    `);
});

let meals =
[
];
let nextId = 1;

let dailyCalorieGoal = null;

app.get('/meals', (req, res) => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
  const todayCalories = meals
    .filter(meal => meal.date === today)
    .reduce((sum, meal) => sum + (meal.calories || 0), 0);

  const { start, end } = req.query;
  let filteredMeals = meals;

  const calorieDiff = dailyCalorieGoal ? todayCalories - dailyCalorieGoal : null;
  let calorieDiffMessage = '';
if (calorieDiff !== null) {
  if (calorieDiff > 0) {
    calorieDiffMessage = `<div class="text-danger">You are <b>${calorieDiff} kcal over</b> your goal today.</div>`;
  } else if (calorieDiff < 0) {
    calorieDiffMessage = `<div class="text-success">You are <b>${Math.abs(calorieDiff)} kcal under</b> your goal today.</div>`;
  } else {
    calorieDiffMessage = `<div class="text-primary">You've hit your calorie goal exactly today!</div>`;
  }
}



  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    filteredMeals = meals.filter(meal => {
      const mealDate = new Date(meal.date);
      return mealDate >= startDate && mealDate <= endDate;
    });
  }

  const sortedMeals = [...filteredMeals].sort((a, b) => {
    const aDateTime = new Date(`${a.date}T${a.time || '00:00'}`);
    const bDateTime = new Date(`${b.date}T${b.time || '00:00'}`);
    return bDateTime - aDateTime;
  });

  const groupedMeals = {};
  sortedMeals.forEach(meal => {
    if (!groupedMeals[meal.date]) {
      groupedMeals[meal.date] = [];
    }
    groupedMeals[meal.date].push(meal);
  });

  let list = '';
  if (sortedMeals.length === 0) {
    list = '<p class="text-muted">No meals found for the selected date.</p>';
  } else {
    for (const date in groupedMeals) {
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      list += `<div class="mt-4"><h4>${formattedDate}</h4><ul class="list-group">`;
      for (const meal of groupedMeals[date]) {
        list += `
          <li class="list-group-item">
            ${meal.image ? `<img src="${meal.image}" class="img-fluid mb-2" style="max-height: 200px;" /><br>` : ''}
            <h4><b>${meal.title}</b></h4><br>
            🔥 <i>${meal.calories} kcal</i><br>
            ${meal.date} ${meal.time || ''}<br>
            (Notes: ${meal.notes || 'N/A'})
            <div class="mt-2">
              <a href="/editMeal/${meal.id}" class="btn btn-sm btn-outline-primary">Edit</a>
              <form action="/deleteMeal/${meal.id}" method="POST" style="display:inline;">
                <button type="submit" class="btn btn-sm btn-outline-danger">Delete</button>
              </form>
            </div>
          </li>`;
      }
      list += `</ul></div>`;
    }
  }

  const showDeleteAlert = req.query.deleted === '1';
  const searchRangeMessage = start && end
    ? `<p class="text-muted">Showing meals from <b>${new Date(start).toLocaleDateString()}</b> to <b>${new Date(end).toLocaleDateString()}</b></p>`
    : '';

  res.send(`
  <head>
  <meta charset="UTF-8">
  <title>MacroMate</title>
  <link rel="icon" href="/favicon.ico" type="image/x-icon">
  <link rel="shortcut icon" href="/favicon.png" type="image/x-icon">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <body>
      <nav class="navbar navbar-expand-lg bg-warning">
        <div class="container">
          <a class="navbar-brand" href="/"><img src="/uploads/MacroMate Horizontal.png" style="width: 200px"></a>
          <ul class="navbar-nav me-auto">
            <li class="nav-item"><a class="nav-link" href="/meals">View Meal Entries</a></li>
            <li class="nav-item"><a class="nav-link" href="/addEntry">Add a New Entry</a></li>
          </ul>
          <form class="d-flex" method="GET" action="/meals">
            <input type="date" name="start" class="form-control me-2" required />
            <input type="date" name="end" class="form-control me-2" required />
            <button class="btn btn-outline-dark" type="submit">Search</button>
          </form>
        </div>
      </nav>

      <div class="container mt-5">
        ${showDeleteAlert ? `
          <div class="alert alert-success alert-dismissible fade show" role="alert">
            Meal entry deleted successfully!
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>` : ''}
        <h2>Meal Entries</h2>
        <h5 class="text-end text-secondary">🔥 Today's Calories: ${todayCalories} kcal</h5>
        ${calorieDiffMessage ? `<div class="text-end">${calorieDiffMessage}</div><hr>` : ''}
        <div class="card p-3 my-3">
  <h6>🎯 Daily Calorie Goal: ${dailyCalorieGoal || 'Not set yet'}</h6>
  <form action="/setCalorieGoal" method="POST" class="row g-2 mt-2">
    <div class="col-md-3">
      <input type="number" name="weight" class="form-control" placeholder="Weight (kg)" required />
    </div>
    <div class="col-md-3">
      <input type="number" name="height" class="form-control" placeholder="Height (cm)" required />
    </div>
    <div class="col-md-3">
      <input type="number" name="age" class="form-control" placeholder="Age" required />
    </div>
    <div class="col-md-3">
      <select name="gender" class="form-select" required>
        <option value="">Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
    </div>
    <div class="col-md-12 text-center">
      <button type="submit" class="btn btn-primary mt-2">Set Goal</button>
    </div>
  </form>
</div>

        ${searchRangeMessage}
        ${list}
      </div>
    </body>
  `);
});


  app.get('/addEntry', (req, res) => {
    res.send(`
    <head>
    <meta charset="UTF-8">
    <title>MacroMate</title>
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
    <link rel="shortcut icon" href="/favicon.png" type="image/x-icon">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <body>
        <nav class="navbar navbar-expand-lg bg-warning">
          <div class="container">
          <a class="navbar-brand" href="/"><img src="/uploads/MacroMate Horizontal.png" style="width: 200px"></a>
            <ul class="navbar-nav">
              <li class="nav-item"><a class="nav-link" href="/meals">View Meal Entries</a></li>
              <li class="nav-item"><a class="nav-link" href="/addEntry">Add a New Entry</a></li>
            </ul>
          </div>
        </nav>
  
        <div class="container d-flex justify-content-center align-items-center mt-5" style="min-height: 80vh;">
          <div class="card p-4 shadow" style="width: 100%; max-width: 500px;">
            <h4 class="text-center mb-4">Add a New Meal Entry</h4>
            <form action="/addEntry" method="POST" enctype="multipart/form-data">
              <div class="mb-3">
                <label class="form-label">Name of Meal:</label>
                <input type="text" name="title" class="form-control" placeholder="Meal name" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Calories:</label>
                <input type="number" name="calories" class="form-control" placeholder="Calories" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Date:</label>
                <input type="date" name="date" id="dateField" class="form-control" required />
              </div>
              <script>
  document.addEventListener("DOMContentLoaded", function () {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateField').value = today;
  });
</script>
              <div class="mb-3">
                <label class="form-label">Time:</label>
                <input type="time" name="time" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label">Notes:</label>
                <textarea name="notes" class="form-control" placeholder="Notes (optional)"></textarea>
              </div>
              <div class="mb-3"> <label class="form-label">
              Meal Image (optional):</label> 
              <input type="file" name="filename" class="form-control" />
              </div>
              <div class="text-center">
                <button type="submit" class="btn btn-success">Add Entry</button>
              </div>
            </form>
          </div>
        </div>
      </body>
    `);
  });
  
  app.post('/addEntry', upload.single('filename'), (req, res) => {
    const { title, calories, date, time, notes } = req.body;
  
    const imagePath = req.file ? '/uploads/' + req.file.filename : '';

    const newEntry = {
    id: nextId++,
    title,
    calories: Number(calories) || 0,
    date,
    time: time || '',
    notes: notes || '',
    image: imagePath
    };

    console.log(newEntry);
  
    meals.push(newEntry);
    res.redirect('/meals');
  });

  app.post('/deleteMeal/:id', (req, res) => {
    const id = parseInt(req.params.id);
    meals = meals.filter(b => b.id !== id);
    res.redirect('/meals?deleted=1');
;
});

app.get('/editMeal/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const meal = meals.find(m => m.id === id);

  if (!meal) {
    return res.send('<p>Meal Entry not found.</p><a href="/meals">Back to List</a>');
  }

  res.send(`
  <head>
  <meta charset="UTF-8">
  <title>MacroMate</title>
  <link rel="icon" href="/favicon.ico" type="image/x-icon">
  <link rel="shortcut icon" href="/favicon.png" type="image/x-icon">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <body>
      <nav class="navbar navbar-expand-lg bg-warning">
        <div class="container">
          <a class="navbar-brand" href="/"><img src="/uploads/MacroMate Horizontal.png" style="width: 200px"></a>
          <ul class="navbar-nav">
            <li class="nav-item"><a class="nav-link" href="/meals">View Meal Entries</a></li>
            <li class="nav-item"><a class="nav-link" href="/addEntry">Add a New Entry</a></li>
          </ul>
        </div>
      </nav>
      <div class="container d-flex justify-content-center align-items-center mt-5" style="min-height: 80vh;">
        <div class="card p-4 shadow" style="width: 100%; max-width: 500px;">
          <h4 class="text-center mb-4">Edit Meal Entry</h4>
          <form action="/editMeal/${meal.id}" method="POST" enctype="multipart/form-data">
            <div class="mb-3">
              <label class="form-label">Name of Meal:</label>
              <input type="text" name="title" value="${meal.title}" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Calories:</label>
              <input type="number" name="calories" value="${meal.calories}" class="form-control" required />
            </div>
            <div class="mb-3">
            <label class="form-label">Date:</label>
            <input type="date" name="date" class="form-control" value="${meal.date}" required />
          </div>
            <div class="mb-3">
              <label class="form-label">Time:</label>
              <input type="time" name="time" value="${meal.time}" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Notes:</label>
              <textarea name="notes" class="form-control" placeholder="Notes (optional)">${meal.notes || ''}</textarea>
              <div class="mb-3">
              <label class="form-label">Replace Image (optional):</label>
              <input type="file" name="filename" class="form-control" />
            </div>
            
            <div class="text-center">
            
              <button type="submit" class="btn btn-primary">Update Entry</button>
              <a href="/meals" class="btn btn-secondary ms-2">Cancel</a>
            </div>
          </form>
        </div>
      </div>
    </body>
  `);
});


// Edit Meal POST route
app.post('/editMeal/:id', upload.single('filename'), (req, res) => {
    const id = parseInt(req.params.id);
    const { title, calories, date, time, notes } = req.body;
  
    const meal = meals.find(m => m.id === id);
    if (meal) {
      meal.title = title;
      meal.calories = Number(calories) || 0;
      meal.date = date;
      meal.time = time || '';
      meal.notes = notes || '';
      if (req.file) {
        meal.image = '/uploads/' + req.file.filename;
      }
    }
  
    res.redirect('/meals');
  });
  

  app.post('/setCalorieGoal', (req, res) => {
    const { weight, height, age, gender } = req.body;
    dailyCalorieGoal = calculateCalories({ weight, height, age, gender });
    res.redirect('/meals');
  });


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
}); 