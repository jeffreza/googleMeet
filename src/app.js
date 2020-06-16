const express = require("express");
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', __dirname + '/public/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');



app.get("/", (req, res) => {
  res.render('index.html');
});

app.post("/", (req, res) => {
  res.render('events.html');
});

app.listen(3000, (req,res)=>{
    console.log('listening at port 3000');
});