//imports
//--packages
var express = require('express');
var session = require('express-session');
var app = express();
var fileUpload = require('express-fileupload');
var fs = require('fs');
var path = require('path');
var parse= require('body-parser');
var hashPass = require('password-hash');
//--modules
var generate=require('./generator');
var sender = require('./sender');
var dbHandler = require("./dbHandler");

//express configs
var port = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.use(parse.json()); // support json encoded bodies
app.use(parse.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static('public'));
app.use(fileUpload());
app.use(session({
    secret: '123'
}));



//routes

//-login
app.get('/', (req,res) => {
    if(verifyUser(req.session))
        res.redirect('/home');   
    else
        res.render('login',{});
});

app.post('/login', (req,res) => {
    if(hashPass.verify(req.body.password,'sha1$d3cad11f$1$e6f87987735c858c51cb3154e8313339d4f943b0')){
        req.session.login=true;
        res.redirect('/home');
    }
    else
        res.redirect('/');
});

//-main page
app.get('/home', function (req, res) {
    if(!verifyUser(req.session)){
        res.redirect('/');
        return;
    }
    dbHandler.connectDBpromise().then(dbHandler.getPreparedTemplatesP)
                    .then(templates=>{ res.render('form',{oldTemplates: templates});})
                    .catch((err)=>console.log(`get route promise error1 ${err}`));
});


app.post('/preview', function (req, res) {
    if(!verifyUser(req.session)){
        res.redirect('/');
        return;
    }
    fs.readdir(__dirname+"/public/docs", function(err, files) {
        if (err) 
            return;
        let f= String(files[0]);
        if(req.body.preview === "G")
            res.render('viewerG',{File : f});
        else    
            res.render('viewer' ,{File : f});
    });
});


app.post('/uploadImage',function(req,res){
    if(!verifyUser(req.session)){
        res.redirect('/');
        return;
    }
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

//create quote doc
app.post('/create',function(req,res){
    if(!verifyUser(req.session)){
        res.redirect('/');
        return;
    }
    dbHandler.connectDBpromise()
        .then(dbHandler.getLastFileId)
        .then(lastId => {
            let details = fixDetails(req,lastId);
            generate.generator(details,res);
            fs.readdir(__dirname+"/public/docs", function(err, files) {
                if (err) return;
                let incrementedFileId = parseInt(lastId)+1;
                let newFileName = String(incrementedFileId)+".docx";
                console.log('Files: '+ newFileName);
                dbHandler.connectDBpromise()
                        .then(dbHandler.setLastFileId(incrementedFileId))
                        .then(()=>new Promise((res,rej)=>fs.unlink(__dirname+'/public/docs/'+files[0],
                                                                    err => err? rej(err) : res() ))) 
                        .then(()=>new Promise((res,rej)=>fs.copyFile(__dirname+'/public/price_quote.docx',
                                                                    __dirname+'/public/docs/'+newFileName,
                                                                    err => err? rej(err): res() ))) 
                        .catch(err=>console.log(`error inside generate route ${err}`));             
            });
        })
        .catch(err=>console.log(`error inside generate route ${err}`));
    });

app.post("/download",function(req,res){
    if(!verifyUser(req.session)){
        res.redirect('/');
        return;
    }
    let file = __dirname + '/public/price_quote.docx';
    res.download(file, toShortDate(req.body.date)+" "+ req.body.company+" הצעת מחיר"+".docx");
})

app.post("/email",function(req,res){
    if(!verifyUser(req.session)){
        res.redirect('/');
        return;
    }
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
 
//save templates into db
app.post("/save",function(req,res){
    if(!verifyUser(req.session)){
        res.redirect('/');
        return;
    }
    let g= changeSpaces( req.body.other_details);
    let dataToUpdate={
        saveName : req.body.saveName,
        products : toArray(req).products,
        other_details :g,
        numImg: req.body.numImg,
        imgSize: req.body.imgSize
    }
    dbHandler.connectDBpromise().then(dbHandler.addPreparedWithTemplate(dataToUpdate))
                                .then(()=>res.sendStatus(200))
                                .catch(err=>console.log(`error was occured ${err}`));
});
    
app.listen(port, function() {
    console.log("server started");
    console.log('Our app is running on http://localhost:' + port);
});


//utils

const verifyUser = (session)=>
        ((session.login !== undefined) && (session.login === true));

function fixDetails(req,lastId){
    let sumProducts= makeTableDataAndSum(req);
    let text = req.body.other_details;
    let pre = '<w:p><w:r><w:t>';
    let post = '</w:t></w:r></w:p>';
    let lineBreak = '</w:t><w:br/><w:t>';
    text = text.replace(/\n?\r/g, lineBreak);
    text = pre + text + post;
    //req.body.other_details
    return {
                name: req.body.name,
                company: req.body.company,
                docNum: lastId,  
                phone: req.phone,
                date: toShortDate(req.body.date),
                products: sumProducts.products,
                sum: sumProducts.sum,
                detail:text,
                img: req.body.numImg ,
                imgSize: req.body.imgSize}

}

function makeTableDataAndSum(req){
    let _products=[];
    let _sum=0;
    let _price;
    let _priceNum;
    let i=0;
    while(Reflect.get(req.body,"product"+i)){
        _price = parseInt(Reflect.get(req.body,"price"+i));
        _count = parseInt(Reflect.get(req.body,"count"+i))
        _priceNum = isNaN(_price)?0:_price;
        _sum += _priceNum*_count;
        var product={
            price : "" + _priceNum,
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
    //swap
    let tmp=arr[0];
    arr[0]=arr[2];
    arr[2]=tmp;

    return arr.join('/');
}
function changeSpaces(str){
    let s= str.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t").replace(/\"/g,'\\"').replace(/\'/g,"\\'") ;
    return s;
}


