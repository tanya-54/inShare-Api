const router = require('express').Router();
const File = require('../model/file')

router.get('/:uuid' , async (req, res) =>{
    try{
        const file = await File.findOne({ uuid:req.params.uuid });
        if(!file){
            return res.render('download' , {err:'link has been expired'});
        }
        return res.render('download',  {
            uuid:file.uuid,
            fileName:file.filename,
            fileSize:file.size,
            downloadLink:`S{process.env.APP_BASE_URL}/files/download/${file.uuid}`
            // http://localhost:3000/files/download/jhdajjhfsfdh-8709790

        })
    }catch(err){
        return res.render('download' , {err:'something went wrong'});
    }
})



module.exports = router; 