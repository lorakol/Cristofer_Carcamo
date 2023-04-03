router.get("/", isAuthenticated, async (req, res) => {
    let [[user]] = await pool.execute("SELECT * FROM Users WHERE UsersID = ?", [req.session.UsersID]);
  
    //update table to default values for old users, in DB before categories was set upon signup
    const sql = `UPDATE Users SET General = ?, Business = ?, Entertainment = ?, Health = ?, Science = ?, Sports = ?, Technology = ?, SavedSetting = ? WHERE UsersID = ?`;
    await pool.execute(sql, [user.General, user.Business, user.Entertainment, user.Health, user.Science, user.Sports, user.Technology, user.SavedSetting, req.session.UsersID]);
   
    const columnsToCheck = ["General", "Business", "Entertainment", "Health", "Science", "Sports", "Technology"];
    const columnsWithValue1 = [];
  
    for (const [key, value] of Object.entries(user)) {
      if (columnsToCheck.includes(key) && value.readInt8(0) === 1) {
        columnsWithValue1.push(key);
      }
    }
    const categories = req.session.categories || columnsWithValue1;
    const tabs = [];
    const articleLists = {};
  
  
    for (const category of categories) {
      //console.log(category);
      const checked = (user[category].readInt8(0) === 1) ? 'checked' : '';
      const username = req.session.username;
      //const uri = `http://localhost:8080/news/${username}?category=${category.toLowerCase()}`;
    
      try {
        //const response = await axios.get(uri);
        const response =  await getNewsUser(username, [category.toLowerCase()]);
        const data = response;
        const articles = data.articles;
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
    
        articleLists[category] = `<ul>${articleList}</ul>`;
      } catch (error) {
        console.error(error);
        res.status(500).send("Oops! Something went wrong.");
      }
    }
    
    res.render("dashboard", {
        title: "Dashboard",
        category: category,
        categories: categories,
        user : user,
        username: req.session.username,
        API_KEY: API_KEY,
        pool : pool
    });
  });  


/*
        checkedGeneral : checkedGeneral ,
        checkedBusiness : checkedBusiness ,
        checkedEntertainment : checkedEntertainment ,
        checkedHealth : checkedHealth ,
        checkedScience : checkedScience ,
        checkedSports : checkedSports ,
        checkedTechnology : checkedTechnology ,
        SavedSetting : user.SavedSetting,
*/