require('dotenv').config('.env');
const cors = require('cors');
const express = require('express');
const app = express();
const morgan = require('morgan');
const { PORT = 3000 } = process.env;
// require express-openid-connect and destructure auth from it
const { auth } = require('express-openid-connect');
const jwt = require('jsonwebtoken');

const { User, Recipe } = require('./db');
const { recipes } = require('./db/seedData');

// middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

/* *********** YOUR CODE HERE *********** */
// follow the module instructions: destructure config environment variables from process.env
const {
  JWT_SECRET = 'neverTell',
  AUTH0_SECRET = 'a long, randomly-generated string stored in env', // generate one by using: `openssl rand -base64 32`
  AUTH0_AUDIENCE = 'http://localhost:3000',
  AUTH0_CLIENT_ID,
  AUTH0_BASE_URL,
} = process.env;

// follow the docs:
  // define the config object
  
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: AUTH0_SECRET,
  baseURL: AUTH0_AUDIENCE,
  clientID: AUTH0_CLIENT_ID,
  issuerBaseURL: AUTH0_BASE_URL,
};
  
  // attach Auth0 OIDC auth router
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// createUser router
app.use(async (req, res, next) => {
  if (req.oidc.user) {
    const [user] = await User.findOrCreate({
      where: {
        username: req.oidc.user.nickname,
        name: req.oidc.user.name,
        email: req.oidc.user.email,
      }
    });
  }
  next();
});

app.use(async (req, res, next) => {
  try {
    const auth = req.header('Authorization');
    if (auth) {
      const token = auth.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      req.user = user;
    }
    next();
  } catch (error) {
    next(error);    
  }
});


//create route
app.post('/recipes', async (req, res, next) => {
  const { title, flavor, ingredients, cost } = req.body;
  if(req.user) {
    const recipe = await Recipe.create({
      title,
      flavor,
      ingredients,
      cost,
    });
    res.json(recipe);
  } else {
    res.status(401).send('You must be logged in to create a cupcake');
  }
});


//delete route
app.delete("/recipes/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const deleteRecipe = await Recipe.findByPk(id);
    if (!deleteRecipe) {
      res.status(404).send(`Recipe with id ${id} not found`);
      return;
    }
    await Recipe.destroy({ where: { id } });
    res.send(deleteRecipe);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

//update route
app.put("/recipes/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const updateRecipe = await Recipe.findByPk(id);
    if (!updateRecipe) {
      res.status(404).send(`Recipe with id ${id} not found`);
      return;
    }
    const userId = req.user.id;
    const { name, flavor, ingredients, cost } = req.body;
    await updateRecipe.update({ name: name, flavor: flavor,ingredients:ingredients,cost:cost});
    res.send(updateRecipe);
  } catch (error) {
    console.error(error);
    next(error);
  }
});


//user info
app.get('/me', async (req, res, next) => {
  if(req.oidc.user) {
    const user = await User.findOne({
      where: {
        username: req.oidc.user.nickname
      },
      raw: true
    });
    delete user.password;
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1w' });
    res.json({user, token});
  } else {
    res.json({user: null, token: null});
  }
})


//read the recipes
app.get('/recipes', async (req, res, next) => {
  const data = await Recipe.findAll()
  res.send(data)
 
})



//bcrypt login
app.get('/', async (req, res) => {
  const data = await Recipe.findAll()
  const filtereddata = data.map((food) => food.title)
  const recipes = JSON.stringify(filtereddata)
  const stuff = []
  for(let i = 0; i < data.length; i++){
    stuff[i] = {
      "title": data[i].title,
      "flavor": data[i].flavor,
      "ingredients": data[i].ingredients,
      "cost": data[i].cost
    }
  }

  console.log(req.oidc.user)
  res.send(req.oidc.isAuthenticated() ? `
    <h2 style="text-align: center;">The Krusty Krab CookBook!</h2>
    <h2>Welcome, ${req.oidc.user.nickname}</h2>
    <p><b>Username: ${req.oidc.user.email}</b></p>
    <p>${req.oidc.user.email}</p>
    
    <p>${recipes}</p>


    <img src="https://www.citypng.com/public/uploads/preview/-121610049297jvnolytdyr.png" alt="${req.oidc.user.name}" width="400" 
    height="450">
  ` : 'Logged out');
});





// app.get('/cupcakes', async (req, res, next) => {
//   try {
//     const cupcakes = await Cupcake.findAll();
//     res.send(cupcakes);
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// });

// error handling middleware
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if(res.statusCode < 400) res.status(500);
  res.send({error: error.message, name: error.name, message: error.message});
});

app.listen(PORT, () => {
  console.log(`Krabby Patties are ready at http://localhost:${PORT}`);
});

