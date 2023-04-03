const express = require("express");
const router = express.Router();
const flash = require('connect-flash');
const session = require("express-session");
const cors = require('cors');
require('dotenv').config();
const axios = require("axios");
const { getNews } = require("../utils/newsutils");

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

router.use(flash());


// Define the number of items per page
const PAGE_SIZE = 3;


router.get("/", async (req, res) => {
  // Get the current page from the query parameters, or default to page 1
  const currentPage = req.query.page ? parseInt(req.query.page) : 1;

  try {

    const category = req.query.category || "general";
    const page = req.query.page || 1; // Get the page number from the query parameters or use 1 as the default value
    const pageSize = req.query.pageSize || 10; // Get the page size from the query parameters or use 10 as the default value

    let response = await getNews();
    if (!response) {
      res.status(500).json({ message: "Internal server error" });
      return;
    }
    const articles = response.articles;

    // Calculate the start and end indexes for the current page
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    // Get the articles for the current page
    const pageArticles = articles.slice(startIndex, endIndex);

    // Calculate the number of pages
    const numPages = Math.ceil(articles.length / PAGE_SIZE);

    // Generate an array of page numbers for the pagination links
    const pages = Array.from({ length: numPages }, (_, i) => ({
      page: i + 1,
      isActive: i + 1 === currentPage
    }));

    // Determine if there is a previous page and a next page
    const hasPrevPage = currentPage > 1;
    const hasNextPage = currentPage < numPages;
    const prevPage = currentPage - 1; // Set the previous page number
    const nextPage = currentPage + 1; // Set the next page number
    const firstPage = 1; // Set the first page number
    const lastPage = numPages; // Set the last page number


    res.render("home", {
      title: "Home",
      category: category,
      articles: pageArticles,
      API_KEY: process.env.API_KEY,
      isLoggedIn: false,
      pages,
      hasPrevPage,
      hasNextPage,
      currentPage,
      prevPage, 
      nextPage, 
      firstPage,
      lastPage
    });

  
    
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }

    // Make a request to the `/news` endpoint using axios library, passing the `category` variable as a parameter
    

    
});


router.post('/homerefresh', (req, res) => {
  res.redirect('/');
});

module.exports= router;
