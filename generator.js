var JSZip = require('jszip');
var Docxtemplater = require('docxtemplater');
var ImageModule=require('docxtemplater-image-module')
var fs = require('fs');
var path = require('path');
var cloudconvert = new (require('cloudconvert'))(process.env.CLOUD_CONVERTER_SECRET);

function generate(details ,res){
    //console.log(JSON.stringify(details));
    let sizeImg=300;
    sizeImg=(details.imgSize=="B")?225:sizeImg;
    sizeImg=(details.imgSize=="A")?150:sizeImg;

    var content = fs
        .readFileSync(path.resolve(__dirname, 'input1.docx'), 'binary');

    var opts = {}
    opts.centered = false;
    opts.getImage=function(tagValue, tagName) {
        console.tagValue;
        if(tagValue=='f')
           return fs.readFileSync(__dirname+"/upload/img.jpg");
        else
           return fs.readFileSync(__dirname+"/public/imgs/"+tagValue+"-lightbox.jpg")
    }
    opts.getSize=function(img,tagValue, tagName) {
        return [sizeImg,sizeImg];
    }
    var imageModule=new ImageModule(opts);
    var zip = new JSZip(content);
    var doc = new Docxtemplater()
        .attachModule(imageModule)
        .loadZip(zip)
        .setData(details)

        // .setData({ name: name1 ,
        //           image: __dirname+"/"+imgPath})
        .render();
   
   
    //set the templateVariables

    try {

        // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        doc.render();
    }
    catch (error) {
        var e = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties,
        }
        console.log(JSON.stringify({error: e}));
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
        throw error;
    }

    var buf = doc.getZip()
                .generate({type: 'nodebuffer'});
    // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
    fs.writeFileSync(path.resolve(__dirname+"/public/", 'price_quote.docx'), buf);

    fs.createReadStream(__dirname+"/public/price_quote.docx")
    .pipe(cloudconvert.convert({
        inputformat: 'docx',
        outputformat: 'pdf',
        converteroptions: {
            quality : 100,
        }
     }))
    .pipe(fs.createWriteStream(__dirname+"/public/price_quote.pdf"))
    .on('error', function(err) {
        console.error('Failed: ' + err);
        res.sendStatus(424);})
    .on('finish', function() {
        console.log('Done!');
        res.sendStatus(200);
    });

}
exports.generator = generate;