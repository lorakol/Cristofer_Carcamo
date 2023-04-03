const axios = require("axios");
const API_KEY = process.env.API_KEY;
const getNews = async (category = "general", page = 1, pageSize = 10) => {
    let res = null;
    
    try {
      // Make an API request to the News API with the specified category and pagination parameters
      const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=${pageSize}&page=${page}&apiKey=${API_KEY}`);
      const articles = response.data.articles;
      const totalResults = response.data.totalResults;

      res = { 
        title: 'News', 
        category: category,
        articles: articles,
        totalResults: totalResults
      };
  
    } catch (error) {
      console.error(error);
    }

    return res;
}

const getNewsUser = async(username, categories = [], page = 1,pageSize = 5) => {
    //const username = req.params.username;
    //const categories = req.query.category ? [req.query.category.toLowerCase()] : [];
    //const page = req.query.page || 1; // Get the page number from the query parameters or use 1 as the default value
    //const pageSize = req.query.pageSize || 10; // Get the page size from the query parameters or use 3 as the default value
    //console.log('page',page);
    //console.log('pageSize',pageSize);
    let res = null;
    try {
      if (categories.length === 0) {
        // Retrieve the user's preferred categories from the database
        const result = await pool.query("SELECT General, Business, Entertainment, Health, Science, Sports, Technology FROM Users WHERE Username = ?", [username]);
        const userPreferences = result && result[0].length > 0 ? {
          General: result[0][0].General.readInt8(0),
          Business: result[0][0].Business.readInt8(0),
          Entertainment: result[0][0].Entertainment.readInt8(0),
          Health: result[0][0].Health.readInt8(0),
          Science: result[0][0].Science.readInt8(0),
          Sports: result[0][0].Sports.readInt8(0),
          Technology: result[0][0].Technology.readInt8(0),
        } : null;
  
        for (let category in userPreferences) {
          if (userPreferences[category]) {
            categories.push(category.toLowerCase());
          }
        }
      }
  
      // Make an API request to the News API with the specified categories
      const promises = categories.map(category => axios.get(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${API_KEY}`));
      const responses = await Promise.all(promises);
      const articles = responses.flatMap(response => response.data.articles);
      // const totalResults = responses.flatMap(response => response.data.totalResults).reduce((a, b) => a + b, 0);
  
      // // Slice the articles into pages of 3 articles each
      // const startIndex = (page - 1) * pageSize ;
      // const endIndex = Math.min( articles.length);
      // const slicedArticles = articles.slice(startIndex, endIndex);
  
      res = { 
        title: 'News', 
        categories: categories,
        articles: articles, //slicedArticles,
        totalResults: articles.length
      }

    } catch (error) {
      console.error(error);
      //res.status(500).json({ message: "Internal server error" });
    }
    return res;
}

module.exports = {
    getNews,
    getNewsUser
}