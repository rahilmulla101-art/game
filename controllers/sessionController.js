import pool from '../config/db.js';

// export const checkSession = async (req,res)=>{

//     try{

//         const { token, uuid } = req.body;

//         const [rows] = await pool.query(
//             `
//             SELECT *
//             FROM user_sessions
//             WHERE auth_token = ?
//             `,
//             [token]
//         );

//         if(rows.length===0){

//             return res.json({
//                 success:false,
//                 message:'Invalid Token'
//             });

//         }

//         const session = rows[0];

//         if(new Date(session.expires_at) < new Date()){

//             return res.json({
//                 success:false,
//                 message:'Token Expired'
//             });

//         }

//         if(
//             session.device_uuid===null ||
//             session.device_uuid===''
//         ){

//             await pool.query(
//                 `
//                 UPDATE user_sessions
//                 SET device_uuid=?
//                 WHERE id=?
//                 `,
//                 [
//                     uuid,
//                     session.id
//                 ]
//             );

//             session.device_uuid=uuid;
//         }

//         if(session.device_uuid!==uuid){

//             return res.json({
//                 success:false,
//                 message:'Please login with registered mobile'
//             });

//         }

//         if(session.dt==1){

//             return res.json({
//                 success:true,
//                 page:'dt'
//             });

//         }

//         if(session.cl==1){

//             return res.json({
//                 success:true,
//                 page:'cl'
//             });

//         }

//         return res.json({
//             success:false,
//             message:'No Page Assigned'
//         });

//     }catch(err){

//         return res.status(500).json({
//             success:false,
//             message:err.message
//         });

//     }

// };


export const checkToken =
async(req,res)=>{
    console.log(
        "checkToken called",req.body
    );

try{
const token = req.body?.token;
const uuid = req.body?.uuid;
    console.log("METHOD:", req.method);
    console.log("HEADERS:", req.headers);
    console.log("BODY:", req.body);

if (!token || !uuid) {
    return res.json({
        success: false,
        message: 'Token and UUID are required'
    });
}

    const [rows] =
    await pool.query(
        `
        SELECT *
        FROM user_sessions
        WHERE auth_token=?
        `,
        [token]
    );

    if(rows.length===0){

        return res.json({
            success:false,
            message:
            "Invalid Token"
        });

    }

    const row =
    rows[0];

    if(
        row.expires_at &&
        new Date(
            row.expires_at
        ) < new Date()
    ){

        return res.json({
            success:false,
            message:
            "Token Expired"
        });

    }

    if(
        row.device_uuid===null ||
        row.device_uuid===''
    ){

        await pool.query(
            `
            UPDATE user_sessions
            SET device_uuid=?
            WHERE id=?
            `,
            [
                uuid,
                row.id
            ]
        );

        row.device_uuid =
        uuid;
    }

    if(
        row.device_uuid!==uuid
    ){

        return res.json({
            success:false,
            message:
            "Please login with registered mobile"
        });

    }

    let version =
    '';

    if(row.dt==1){

        version =
        'dt';

    }

    if(row.cl==1){

        version =
        'cl';

    }

    return res.json({

        success:true,

        version

    });

}
catch(err){

    return res.status(500)
    .json({

        success:false,

        message:
        err.message

    });

}
};