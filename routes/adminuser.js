import express from 'express';

const adminUserRouter = express.Router();


// create an api
/*

/login
- login an existing admin 



/register
- register a new admin 
- create a new admin in the admin table


/getUsers 

adminUserRouter.get('/getUsers', (req, res) => {


    res.json({
        success: true,
        message: 'Test route is working!',
        timestamp: new Date().toISOString()
    });
});


*/

export default adminUserRouter;