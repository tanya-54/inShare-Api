const router  = require('express').Router();
const multer = require('multer');
const path = require('path');  ///gives the ext of the file.
const File = require('../model/file');
const {v4: uuidv4} = require('uuid');
const { LOADIPHLPAPI } = require('dns');
console.log('Generated UUID:', uuidv4());

// multer config
let storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/') ,
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    } ,
});

let upload = multer({
    storage : storage ,
    limit: {fileSize: 1000000 * 100 }

}).single('myfile');


router.post('/' ,(req ,res)=>{
    console.log('Request body:', req.body);  

    // store file
    upload(req ,res ,async (err) =>{

        if(!req.file){
            return res.json({error: 'all fields are required'});
        }    

        if(err){
            return res.status(500).send({error: 'something went wrong'});
        }
        // now logging the data just for referencing the error:
        console.log('File data:', {
            filename: req.file.filename,
            uuid: uuidv4(),
            path: req.file.path,
            size: req.file.size
        });

        // database store
        const file = new File({
            filename: req.file.filename,
            uuid : uuidv4() ,
            path: req.file.path,
            size:req.file.size
        })

        // const response = await file.save();
        // return response = ({file : `${process.env.APP_BASE_URL}/files/${response.uuid} `});
        try {
            const response = await file.save();
            return res.json({ file: `${process.env.APP_BASE_URL}/files/${response.uuid}` });
        } catch (dbErr) {
            console.log(dbErr);
            return res.status(500).send({ error: 'Database error' });
        }

    })

    // response -->link
})

router.post('/send', async (req, res) => {
    const { uuid, emailTo, emailFrom } = req.body;

    console.log('UUID in request body:', req.body.uuid);

    // Check for required fields
    if (!uuid || !emailTo || !emailFrom) {
        return res.status(422).send({ error: 'All fields are required' });
    }

    try {
        // Get data from database
        const file = await File.findOne({ uuid: uuid });

        // Check if file exists
        if (!file) {
            return res.status(404).send({ error: 'File not found' });
        }
        console.log('File found:', file);

        // Check if the email has already been sent
        if (file.sender) {
            console.log('Email already sent:', file.sender);
            return res.status(422).send({ error: 'Email already sent!' });
        }

        // Update file with sender and receiver email
        file.sender = emailFrom;
        file.receiver = emailTo;
        const response = await file.save();
        console.log('File updated:', file);

        // Send email
        const sendMail = require('../services/emailService');
        sendMail({
            from: emailFrom,
            to: emailTo,
            subject: 'inShare fileSharing',
            text: `${emailFrom} shared a file with you`,
            html: require('../services/emailTemplate')({
                emailFrom: emailFrom,
                downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}?source=email`,
                size: parseInt(file.size / 1000) + ' KB',
                expires: '24 hours'
            })
        });

        res.status(200).send({ message: 'Email sent successfully' });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});


// router.post('/send' , async (req,res)=>{

//     const{ uuid ,emailTo,emailFrom} =req.body ;
//     if(!uuid || !emailTo || !emailFrom){
//         return res.status(422).send({error: 'All fields are required'});
//     }
//     // get data from database
//     const file = await File.findOne({uuid:uuid});
//     if(file.sender){
//         return res.status(422).send({error: 'email already sent!'});
//     }

//     file.sender = emailFrom ;
//     file.receiver = emailTo;
//     const response = await file.save();

//     const sendMail= require('../services/emailService');
//     sendMail({
//         from : emailFrom,
//         to:emailTo,
//         subject:`inShare fileSharing`,
//         text:`${emailFrom} shared a file with you`,
//         html: require('../services/emailTemplate')({
//             emailFrom:emailFrom,
//             downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}?source=email` ,
//             size: parseInt(file.size/1000) + ' KB',
//             expires: '24 hours'
//         })

//     })


// })

module.exports = router;