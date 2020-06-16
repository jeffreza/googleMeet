const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("hello get");
});

app.post("/", (req, res) => {
  res.send("hello post");
});

app.listen(3000, (req,res)=>{
    console.log('listening at port 3000');
});