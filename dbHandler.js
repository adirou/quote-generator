var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://adirou:aDir1701@ds161136.mlab.com:61136/price_quoter';    

const getPreparedTemplatesP = function(db) { 
    return new Promise((resolve,reject)=>{
        var dbo = db.db("price_quoter");
        dbo.collection("prepared").find({}).toArray(function(err, data) {
            db.close();
            console.log("disconnect db");
            resolve(data);
            
        });
    });
};

const addPreparedWithTemplate = (template) => 
    (db)=>{
        return new Promise((resolve,reject)=>{
            var dbo = db.db("price_quoter");
            dbo.collection("prepared").insertOne(template, function(err, res) {
                db.close();
                console.log("disconnect db");
                if(err) reject(err);
                else {
                    resolve();
                    console.log("1 prepared Template inserted.");
                }
            });
    });
};
const getLastFileId = (db) => 
    new Promise((resolve,reject)=>{
        //console.log(123);
        var dbo = db.db("price_quoter");
        dbo.collection("params").find({}).toArray(function(err,res) {
            db.close();
            
            if (err) reject(err);
            else resolve(res[0].last);
        });
    });

const setLastFileId = (newId) => 
    (db)=>
        new Promise((resolve,reject)=>{
            var dbo = db.db("price_quoter");
            dbo.collection("params").findOne({},function(err,res){
                dbo.collection("params").updateOne({},{$set: { last: newId} },
                    (err,res)=>{
                        db.close();
                        console.log("disconnect db");
                        if(err) reject(err);
                        else {
                            resolve();
                            console.log("last incremented");
                        }
            });
    });
});

const connectDBpromise = () => {
    return new Promise((resolve,reject)=>{
        MongoClient.connect(url, function(err, db) {
            console.log("connect db");
            
            if(err) reject (err);
            else resolve(db);
        });
    });
};
exports.getLastFileId=getLastFileId;
exports.setLastFileId=setLastFileId;
exports.addPreparedWithTemplate=addPreparedWithTemplate;
exports.getPreparedTemplatesP=getPreparedTemplatesP;
exports.connectDBpromise=connectDBpromise;