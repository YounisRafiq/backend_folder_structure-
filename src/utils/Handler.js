const Handler = (reqHandler) => {

(req , res , next) => {
    Promise.resolve(reqHandler(req , res , next)).catch((err) => next(err))
}
}    


export { Handler };







//    try{

//    } catch(err) {
//     res.status(err.code || 500).json({
//         success : false,
//         message : err.message
//     })
//    }
