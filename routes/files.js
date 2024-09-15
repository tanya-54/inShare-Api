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

router.post('/send' , async (req,res)=>{
    const{ uuid ,emailTo,emailFrom} =req.body ;
    if(!uuid || !emailTo ||emailFrom){
        return res.status(422).send({error: 'All fields are required'});
    }
    // get data from database
    const file = await File.findOne({uuid:uuid});
    if(file.sender){
        return res.status(422).send({error: 'email already sent!'});
    }

    file.sender = emailFrom ;
    file.receiver = emailTo;
    const response = await file.save();
})

module.exports = router;