const express = require("express");
const router = express.Router();
const request = require('request');
const cors = require('cors');
const session = require("express-session");
const axios = require("axios");
const bodyParser = require('body-parser');
const pool = require("../db/db");
const newsRouter = require("./news");
const { getNews, getNewsUser } = require("../utils/newsutils");
//const fetch = require("node-fetch");

require('dotenv').config();

router.use(bodyParser.json());

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("API_KEY not found in .env file");
  process.exit(1);
}

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  optionSuccessStatus: 200
  
};

router.use(cors(corsOptions));

const sessionOptions = {
  secret: "secret",
  resave: true,
  saveUninitialized: true
};

router.use(session(sessionOptions));

const isAuthenticated = (req, res, next) => {
  if (req.session.login) {
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    next();
  } else {
    req.session.login = false;
    res.redirect('/signin');
  }
};

router.get("/", isAuthenticated, async (req, res) => {
  let [[user]] = await pool.execute("SELECT * FROM Users WHERE UsersID = ?", [req.session.UsersID]);

  //const fieldsToCheck = ['General','Business', 'Entertainment', 'Health', 'Science', 'Sports', 'Technology'];

  // check if General field is 1 or 0, if not set it to 1, to fix users already in db
  // check if General field is NULL or not 1 or 0, if not set it to 1, to fix users already in db
  if (user.General === null ) {
    user.General = 1;
  }

  // check if field is NULL or not 1 or 0, if not set it to 0, to fix users already in db
  if (user.Business === null ) {
    user.Business = 0;
  }

  // check if field is NULL or not 1 or 0, if not set it to 0, to fix users already in db
  if (user.Entertainment === null ) {
    user.Entertainment = 0;
  }

  // check if field is NULL or not 1 or 0, if not set it to 0, to fix users already in db
  if (user.Health === null ) {
    user.Health = 0;
  }

  // check if field is NULL or not 1 or 0, if not set it to 0, to fix users already in db
  if (user.Science === null ) {
    user.Science = 0;
  }

  // check if field is NULL or not 1 or 0, if not set it to 0, to fix users already in db
  if (user.Sports === null ) {
    user.Sports = 0;
  }

  // check if field is NULL or not 1 or 0, if not set it to 0, to fix users already in db
  if (user.Technology === null ) {
    user.Technology = 0;
  }

  if (user.SavedSetting === null ) {
    user.SavedSetting = 0;
  }

  //update table to default values for old users, in DB before categories was set upon signup
  const sql = `UPDATE Users SET General = ?, Business = ?, Entertainment = ?, Health = ?, Science = ?, Sports = ?, Technology = ?, SavedSetting = ? WHERE UsersID = ?`;
  await pool.execute(sql, [user.General, user.Business, user.Entertainment, user.Health, user.Science, user.Sports, user.Technology, user.SavedSetting, req.session.UsersID]);
 

  //call latest updated data from Users table
  [[user]] = await pool.execute("SELECT * FROM Users WHERE UsersID = ?", [req.session.UsersID]);

  

  const category = user.General.readInt8(0);
  //const category = "General";
  const checkedGeneral = (user.General.readInt8(0) === 1) ? 'checked' : '';
  const checkedBusiness = (user.Business.readInt8(0) === 1) ? 'checked' : '';
  const checkedEntertainment = (user.Entertainment.readInt8(0) === 1) ? 'checked' : '';
  const checkedHealth = (user.Health.readInt8(0) === 1) ? 'checked' : '';
  const checkedScience = (user.Science.readInt8(0) === 1) ? 'checked' : '';
  const checkedSports = (user.Sports.readInt8(0) === 1) ? 'checked' : '';
  const checkedTechnology = (user.Technology.readInt8(0) === 1) ? 'checked' : '';

  const columnsToCheck = ["General", "Business", "Entertainment", "Health", "Science", "Sports", "Technology"];
  const columnsWithValue1 = [];

  for (const [key, value] of Object.entries(user)) {
    if (columnsToCheck.includes(key) && value.readInt8(0) === 1) {
      columnsWithValue1.push(key);
    }
  }
  let categories = req.session.categories || columnsWithValue1;
  if(req.query.category) {
    categories = [req.query.category];
  }
  const currentCategory = categories[0];
  const tabs = [];
  const articleLists = {};
  const allArticles = [];
  const currentpage = req.query.page ? parseInt(req.query.page) : 1;
  let totalResults = 0;
  let count = 0;
  const pageSize = 5;
  
  for (const category of categories) {
    const checked = (user[category].readInt8(0) === 1) ? 'checked' : '';
    const username = req.session.username;
    //const uri = `http://localhost:8080/news/${username}?category=${category.toLowerCase()}`;
    try {
      //const response = await axios.get(uri);
      const response =  await getNewsUser(username, [category.toLowerCase()], page=currentpage); // await axios.get(uri);
      const data = response;
      totalResults += data.totalResults;
      const articles = data.articles;
      // # articleList.push.apply(articleList, data.articles)
      const articleList = articles.map(article => {
        return `
          <li>
            <img src="${article.urlToImage}" alt="${article.title}" />
            <h2>${article.title}</h2>
            <p>${article.description}</p>
            <a href="${article.url}" target="_blank">Read more</a>
          </li>
        `;
      }).join('');
  
      tabs.push({
        category: category,
        checked: checked
      });
  
      articleLists[category] = {
        articleList: `<ul>${articleList}</ul>`,
        totalResults: data.totalResults
      };
      allArticles.push(...articles); // add articles to allArticles
    } catch (error) {
      console.error(error);
      res.locals.error = true;
    }
  }
  // if(articleList == null){
  //   res.status(500).send("Oops! Something went wrong.");
  //   return;
  // }
  const startIndex = (currentpage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalResults || 0);  
  const articles = allArticles.slice(startIndex, endIndex);
  
  // for (const category in articleLists) {
  //   const articleList = articleLists[category];
  //   const categoryArticles = articleList.articleList;
  //   const categoryTotalResults = articleList.totalResults;
  //   const categoryStartIndex = count;
  //   const categoryEndIndex = count + categoryTotalResults - 1;
  
  //   if (startIndex <= categoryEndIndex && endIndex >= categoryStartIndex) {
  //     const categoryArticlesList = categoryArticles.split('</li>').slice(0, -1);
  //     const categoryStart = Math.max(startIndex - categoryStartIndex, 0);
  //     const categoryEnd = Math.min(endIndex - categoryStartIndex, categoryTotalResults);
  //     const selectedArticles = categoryArticlesList.slice(categoryStart, categoryEnd);
  //     articles.push(...selectedArticles);
  //   }
  
  //   count += categoryTotalResults;
  // }
  
  // Calculate pagination links
  const numPages = Math.ceil(totalResults / pageSize);

    // Generate an array of page numbers for the pagination links
    const pages = Array.from({ length: numPages }, (_, i) => ({
      page: i + 1,
      isActive: i + 1 === currentpage
    }));
  //const pages = Math.ceil(totalResults / pageSize);
  const hasPrevPage = currentpage > 1;
  const hasNextPage = currentpage < pages;
  const prevPage = hasPrevPage ? currentpage - 1 : null;
  const nextPage = hasNextPage ? currentpage + 1 : null;
  const firstPage = 1;
  const lastPage = pages;
  const catButtons = ['General', 'Business', 'Entertainment', 'Health', 'Science', 'Sports', 'Technology'];

  const CategoryBtns = catButtons.map((str, index) => ({ value: str, isActive: str==currentCategory }));
  if (res.locals.error) {
    res.status(500).send("Oops! Something went wrong.");
  } else {
    res.render("dashboard", {


      title: "Dashboard",
      category: category,
      categories: categories,
      user: user,
      checkedGeneral: checkedGeneral,
      checkedBusiness: checkedBusiness,
      checkedEntertainment: checkedEntertainment,
      checkedHealth: checkedHealth,
      checkedScience: checkedScience,
      checkedSports: checkedSports,
      checkedTechnology: checkedTechnology,
      SavedSetting: user.SavedSetting,
      username: req.session.username,
      API_KEY: API_KEY,
      pool: pool,
      articles: articles,
      pages,
      hasPrevPage,
      hasNextPage : hasNextPage,
      currentpage : currentpage,
      prevPage,
      nextPage : nextPage,
      firstPage,
      lastPage,
      CategoryBtns,
      curCategory: currentCategory
    });
  }
  

});  


router.get('/catButtons', (req, res) => {
  res.json(catButtons);
});

router.get("/username", (req, res) => {
  if (req.session.login) {
    res.send(req.session.emailOrUsername);
  } else {
    req.session.login = false;
    res.status(401).send('Not logged in');
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Oops! Something went wrong.");
    } else {
      res.redirect("/signin");
    }
  });
});

router.post("/update", isAuthenticated, async (req, res) => {
  const { general, business, entertainment, health, science, sports, technology } = req.body;
  const [[user]] = await pool.execute("SELECT * FROM Users WHERE UsersID = ?", [req.session.UsersID]);

  // Update user preferences in database
  const sql = `UPDATE Users SET General = ?, Business = ?, Entertainment = ?, Health = ?, Science = ?, Sports = ?, Technology = ? WHERE UsersID = ?`;
  await pool.execute(sql, [general, business, entertainment, health, science, sports, technology, req.session.UsersID]);

  res.redirect("/");
});

router.post("/updateSavedSetting", isAuthenticated, async (req, res) => {
  const { savedSetting } = req.body;
  await pool.execute("UPDATE Users SET SavedSetting = ? WHERE UsersID = ?", [savedSetting, req.session.UsersID]);
  res.sendStatus(200);
});

router.get("/getSavedSetting", isAuthenticated, async (req, res) => {
  const [[user]] = await pool.execute("SELECT SavedSetting FROM Users WHERE UsersID = ?", [req.session.UsersID]);
  res.json({ savedSetting: user.SavedSetting.readInt8(0) });
});


router.post('/dashrefresh', (req, res) => {
  res.redirect('/dashboard?loginSuccess=true');
});


module.exports = router;