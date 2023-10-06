require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
//ADDITIONAL REQUIREMENTS
const bodyParser=require('body-parser') //returns a body json
const dns=require('dns')
const mongoose=require('mongoose') //need to npm i mongodb
const urlparser = require('url') //splits url into parts

// Basic Configuration
const port = process.env.PORT || 8000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
//using bodyparser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

//database connection
const client = process.env['MONGO_URI']

mongoose.connect(client,{useNewUrlParser: true, useUnifiedTopology: true})

const urlShortSchema = new mongoose.Schema({
  original: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    required: true
  }
})

let urlShortner = mongoose.model('urlShortner', urlShortSchema)

let responseObject ={} //empty object to hold info

//endpoints
app.post("/api/shorturl/new", bodyParser.urlencoded({ extended: false }),(req, res) => { //this route was taken from the views/index.html at the form section
  console.log(req.body)
  let inputURL = req.body["url"] //when you make a req.body the og url gets returned as url
  responseObject['original_url'] = inputURL //if you look at the example the og url is returned as "original_url"
  //initializing original shorturl
  let inputShort = 1
  //generating the shorturl
  //finding max shorturl number and incrementing by 1
  urlShortner.findOne({})
    .sort({short:'desc'}) //sorting by descending, so first short will be highest
    .exec((error,result)=>{ //executing
      if(!error && result != undefined){ //if no error and the result is not undf
        inputShort = result.short_url + 1 //taking the result with key short and incrementing
      }
      if(!error){
        urlShortner.findOneAndUpdate(
          {original: inputURL},
          {original: inputURL, short_url:inputShort}, 
          {new: true, upsert: true},
          (error, savedUrl)=>{//callback with error and the updatedvariable
            if(!error){
              responseObject["short_url"]=savedUrl.short_url //responseObject now has original_url and short_url,
              res.json(responseObject)
            }
          }
        )
      }
    })
});

app.get("/api/shorturl/:inputShort", (req,res)=>{
  let inputShort = req.params.inputShort
  urlShortner.findOne({short:inputShort}, (error,result)=>{ //finding in our db where short = inputshort
    if(!error && result != undefined){
      res.redirect(result.original) //redirecting to the original key of the resulting findOne query
    }else{
      res.json({error: 'URL Does Not Exist'})
    }
  })
})
