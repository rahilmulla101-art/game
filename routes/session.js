import express from 'express';
import { checkToken } from '../controllers/sessionController.js';

const router = express.Router();

router.post('/check-token', (req,res)=>{
    console.log("BODY TEST:", req.body);

    res.json({
        success:true,
        body:req.body
    });
});

export default router;