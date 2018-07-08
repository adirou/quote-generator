
var nodemailer = require('nodemailer');
var GoogleTokenProvider = require('refresh-token').GoogleTokenProvider;
var fs = require('fs');
const {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;


var auth2={
    type: 'OAuth2',
    user: '********',
    clientId: '*******',
    clientSecret: '*******',
    refreshToken: '******',
    accessToken:'*********'
};


var oauth2Client = new OAuth2(
  auth2.clientId,
  auth2.clientSecret,
  'https://developers.google.com/oauthplayground'
);



var tokenProvider = new GoogleTokenProvider({
    refresh_token: auth2.refreshToken, 
    client_id:     auth2.clientId, 
    client_secret: auth2.clientSecret
  });




//main function to send an email, and invoke uploading to drive
function send(message){
    console.log(1);
    tokenProvider.getToken(function (err, token) {
        auth2.accessToken=token;
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: auth2
          });
       var mailOptions = {
       from: ' **********',
       to: message.to,
       subject: message.subject,
       text: message.text,
       attachments: [,
            {   // utf-8 string as an attachment
                filename: message.fileName+'.pdf',
                path:__dirname+ '/public/price_quote.pdf'
            },
            {   // utf-8 string as an attachment
                filename: message.fileName+'.docx',
                path:__dirname+ '/public/price_quote.docx'
            }]
    };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
                upload(message,token);
            }
        });
    });
   
}

//
function upload(message,token){
    oauth2Client.setCredentials({
        access_token: token,
        refresh_token: auth2.refreshToken
      });
    let drive=google.drive({ version: 'v3', auth: oauth2Client });
    var fileMetadata = {
        name : message.company+'.docx',
        parents : ['16WHWWiHgHGjq28r63CRh-GVuXhvztEbl']
    };
    var media = {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        body: fs.createReadStream('public/price_quote.docx')
    };
    drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
    }, function (err, file) {
        if (err) {
        // Handle error
        console.error(err);
        } else {
        console.log("file uploded");
        }
    });
}
exports.send=send;
