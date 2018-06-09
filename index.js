var express = require('express')
var app = express()
var fileUpload = require('express-fileupload');
var generate=require('./generator');
var sender = require('./sender');
var fs = require('fs');

var path = require('path');
var parse= require('body-parser');

var port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(parse.json()); // support json encoded bodies
app.use(parse.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static('public'));
app.use(fileUpload());

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.

//(Focus on This Variable)
var url = 'mongodb://adirou:aDir1701@ds161136.mlab.com:61136/price_quoter';    
//(Focus on This Variable)

console.log("server started");

//Load the docx file as a binary

//db

//routes
app.get('/', function (req, res) {
    let file = __dirname + '/prepared.json';
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("price_quoter");
        dbo.collection("prepared").find({}).toArray(function(err, result) {
          if (err) throw err;
          db.close();
          res.render('form',{old : result});
        });
      });
});

app.post('/preview', function (req, res) {
    fs.readdir(__dirname+"/public/docs", function(err, files) {
        if (err) 
            return;
        let f= String(files[0]);
        if(req.body.preview=="G")
            res.render('viewerG',{File : f});
        else    
            res.render('viewer' ,{File : f});
    });
});


app.post('/uploadImage',function(req,res){
    if (req.files)
    {
      let sampleFile = req.files.sampleFile;
      if(sampleFile){
          // Use the mv() method to place the file somewhere on your server
          sampleFile.mv('upload/img.jpg', function(err) {
              if (err)
                  return res.status(500).send(err);
                  res.end();      
          });
      }
     
  }
  res.end(); 
});

app.post('/create',function(req,res){

    let sumProducts=toArray(req);
    let text = req.body.other_details;
    let pre = '<w:p><w:r><w:t>';
    let post = '</w:t></w:r></w:p>';
    let lineBreak = '</w:t><w:br/><w:t>';
    text = text.replace(/\n?\r/g, lineBreak);
    text = pre + text + post;
//req.body.other_details
    let details={
                name: req.body.name,
                company: req.body.company,
                date: toShortDate(req.body.date),
                products: sumProducts.products,
                sum: sumProducts.sum,
                detail:text,
                img: req.body.numImg ,
                imgSize:req.body.imgSize}

   
   
    generate.generator(details,res);
    fs.readdir(__dirname+"/public/docs", function(err, files) {
        if (err) 
            return;
        MongoClient.connect(url, function(err, db) {
            if (err) 
                throw err;
            var dbo = db.db("price_quoter");
            dbo.collection("params").findOne({},function(err,res){
                    let last=parseInt(res.last);
                    dbo.collection("params").updateOne({},{$set: { last: last+1 } },(err,res)=>db.close());
                    let newn=String(parseInt(last)+1)+".docx";
                    console.log('Files: '+ newn);
        
                    fs.unlink( __dirname+'/public/docs/'+files[0],(err)=>{
                        if(err) 
                            return err;
                    });
        
                    fs.copyFile(__dirname+'/public/price_quote.docx', __dirname+'/public/docs/'+newn, (err) => {
                        if (err) 
                            throw err;
                    
                    });
            });
        });
    });
    //res.end();
});

app.post("/download",function(req,res){
    let file = __dirname + '/public/price_quote.docx';
    res.download(file, toShortDate(req.body.date)+" "+ req.body.company+" הצעת מחיר"+".docx");
})

app.post("/email",function(req,res){
    message={
        to: req.body.email,
        subject: toShortDate(req.body.date)+" דרך המים - הצעת מחיר",
        text:req.body.emailText,
        fileName: req.body.company+" הצעת מחיר",
        company: req.body.company
    }
    sender.send(message);
    //var file = __dirname + '/price_quote.docx';
     res.end();
})
 
app.post("/save",function(req,res){
    let g= changeSpaces( req.body.other_details);
    let dataToUpdate={
        saveName : req.body.saveName,
        products : toArray(req).products,
        other_details :g,
        numImg: req.body.numImg,
        imgSize:req.body.imgSize
    }
    console.log(dataToUpdate);
    MongoClient.connect(url, function(err, db) {
        if (err) 
            throw err;
        var dbo = db.db("price_quoter");
        dbo.collection("prepared").insertOne(dataToUpdate, function(err, res) {
          if (err) throw err;
          console.log("1 document inserted");
          db.close();
          
        });
      });
      res.end();
});
    

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});


function toArray(req){
    let _products=[];
    let _sum=0;
    let _price;
    let _priceNum;
    let i=0;
    while(Reflect.get(req.body,"product"+i)){
        _price=parseInt(Reflect.get(req.body,"price"+i));
        _priceNum=isNaN(_price)?0:_price;
        _sum+=_priceNum;
        var product={
            price : ""+_priceNum,
            count : Reflect.get(req.body,"count"+i),
            product: Reflect.get(req.body,"product"+i)
        }
        _products.push(product);
        i++;
    }
    return {sum:_sum, products:_products};
}
function toShortDate(date){
    let arr=date.split("-");
    let tmp=arr[0];
    arr[0]=arr[2];
    arr[2]=tmp;
    return arr.join('/');
}
function changeSpaces(str){
    let s= str.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t").replace(/\"/g,'\\"').replace(/\'/g,"\\'") ;
    return s;
}

function getTheLastUpdatePreview(){
    MongoClient.connect(url, function(err, db) {
        if (err) 
            throw err;
        var dbo = db.db("price_quoter");
        let last=parseInt(dbo.collection("params").findOne().last);
        dbo.updateOne({},{$set: { last: last+1 } });
        return last;
      });
}

